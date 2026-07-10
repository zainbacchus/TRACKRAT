// /api/video — same-origin streaming proxy for gallery videos.
//
// Why this exists: Google gates drive.usercontent.google.com on Fetch
// Metadata. Any cross-site request a browser makes with Sec-Fetch-Dest:
// video (a <video> src) or Sec-Fetch-Mode: cors (a fetch()) gets a 403
// HTML page — and pages can't remove those headers, so NO client-side
// path can stream Drive bytes directly (verified 2026-07: only
// Sec-Fetch-Mode: navigate, i.e. the DOWNLOAD link, passes). Server-side
// requests carry no Sec-Fetch headers, so this function fetches the file
// and pipes it through with Range support intact — the page's <video>
// talks same-origin to us and iOS streams + seeks natively.
//
// Zero dependencies on purpose (no package.json in this repo — Vercel
// builds api/*.js as Node serverless functions with zero config).
//
// Gate (bandwidth protection — the files themselves are link-shared on
// Drive, so this guards the Vercel bill, not secrecy):
//   - Hardened mode: set a GALLERY_VIEW_TOKEN env var in Vercel to the
//     same value as VIEW_TOKEN in the deployed Apps Script. Requests
//     must then carry ?token=<it> (the dashboard already holds the token
//     for listings/uploads).
//   - Default mode (env var unset): only browser requests from this site
//     are allowed (Sec-Fetch-Site / Referer check) — stops third-party
//     hotlinking; scripted abusers would just hit Drive directly.

'use strict';

const { Readable } = require('node:stream');
const crypto = require('node:crypto');

const DRIVE_ID = /^[A-Za-z0-9_-]{10,80}$/;
const EXT_MIME = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
};

// Hash-then-compare sidesteps both timing leaks and timingSafeEqual's
// equal-length requirement.
function tokenMatches(got, expected) {
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function allowed(req, url) {
  const expected = process.env.GALLERY_VIEW_TOKEN || '';
  if (expected) return tokenMatches(url.searchParams.get('token') || '', expected);
  // Fetch Metadata is authoritative when the browser sends it — a proven
  // same-origin request needs no Referer test (which would 403 preview
  // *.vercel.app deploys). Referer is only the fallback for older stacks.
  const sfs = String(req.headers['sec-fetch-site'] || '');
  if (sfs) return sfs === 'same-origin' || sfs === 'same-site';
  const ref = String(req.headers.referer || '');
  return !ref ||
    /^https:\/\/(www\.)?trackratsprint\.club([/:]|$)/.test(ref) ||
    /^http:\/\/(localhost|127\.0\.0\.1)([/:]|$)/.test(ref);
}

// Drive labels .MOVs application/octet-stream — recover the real type
// from the filename it reports in Content-Disposition.
function videoMime(upstream) {
  const ct = String(upstream.headers.get('content-type') || '');
  if (ct.startsWith('video/')) return ct;
  const cd = String(upstream.headers.get('content-disposition') || '');
  const m = cd.match(/filename="?[^";]*\.([A-Za-z0-9]+)"?/);
  return (m && EXT_MIME[m[1].toLowerCase()]) || 'video/mp4';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end('method not allowed');
  }
  const url = new URL(req.url, 'http://internal');
  if (!allowed(req, url)) {
    res.statusCode = 403;
    return res.end('forbidden');
  }
  const id = url.searchParams.get('id') || '';
  if (!DRIVE_ID.test(id)) {
    res.statusCode = 400;
    return res.end('bad id');
  }

  // Stop paying for upstream bytes the moment the player disconnects
  // (AVFoundation drops connections constantly as it buffers).
  const abort = new AbortController();
  res.on('close', () => abort.abort());

  const headers = {};
  if (req.headers.range) headers.Range = req.headers.range;
  let upstream;
  try {
    upstream = await fetch(
      `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
      { headers, signal: abort.signal }
    );
  } catch (e) {
    if (abort.signal.aborted) return; // client went away — nothing to answer
    res.statusCode = 502;
    return res.end('upstream unreachable');
  }
  if (upstream.status !== 200 && upstream.status !== 206) {
    res.statusCode = 502;
    return res.end('upstream ' + upstream.status);
  }
  // Drive serves several failures as 200 text/html — notably the
  // download-quota page and the virus-scan interstitial. Passing those
  // through mislabeled as video would let the browser cache HTML junk
  // under this URL for an hour; a 502 is uncacheable and the player's
  // error→iframe fallback handles it.
  if (/^text\/html/i.test(String(upstream.headers.get('content-type') || ''))) {
    res.statusCode = 502;
    return res.end('upstream interstitial');
  }

  res.statusCode = upstream.status;
  for (const name of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const v = upstream.headers.get(name);
    if (v) res.setHeader(name, v);
  }
  res.setHeader('accept-ranges', 'bytes'); // Drive omits it; iOS needs it to seek
  res.setHeader('content-type', videoMime(upstream));
  res.setHeader('content-disposition', 'inline');
  res.setHeader('cache-control', 'private, max-age=3600');

  if (!upstream.body) return res.end();
  const body = Readable.fromWeb(upstream.body);
  body.on('error', () => res.destroy()); // mid-stream upstream failure/abort
  body.pipe(res);
};
