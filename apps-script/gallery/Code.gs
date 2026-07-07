/**
 * TRACKRAT Gallery — Google Apps Script backend
 *
 * A tiny JSON API in front of the club's Google Drive photo folder. The
 * members-only /gallery page calls it to list photos and videos (GET)
 * and to accept member uploads (POST). The web app executes AS THE
 * ACCOUNT THAT DEPLOYS IT, so the site needs no Google API key, and
 * members can upload without Drive access — files land in the folder
 * owned by the deploying account.
 *
 * ACCESS: every request must carry the gallery VIEW TOKEN. The website
 * hands the token only to signed-in members (Supabase `gallery_access`
 * table, RLS-gated by the `members` email allowlist — schema in
 * README → Photo gallery). VIEW_TOKEN below must equal the `view_token`
 * value stored in Supabase; rotate by changing BOTH, then publishing a
 * new version of this deployment.
 *
 * Everything below uses DriveApp only — no external HTTP requests, no
 * hand-built URLs, and OAuth scopes are auto-detected from the code.
 * (Both were paste-mangling hazards that produced real deploy failures:
 * "Error 400: invalid_scope" and a broken googleapis.com fetch.)
 *
 * DEPLOY (one time, ~5 minutes) — full walkthrough in README.md under
 * "Photo gallery (Google Drive)". Use the Google account that owns the
 * photo folder (uploads count against its storage quota):
 *
 *   1. Share the photo folder: "Anyone with the link · Viewer". Drive's
 *      thumbnail CDN only serves link-public files, so without this the
 *      site shows broken tiles.
 *   2. Go to https://script.new and name the project "TRACKRAT Gallery".
 *   3. Replace the default Code.gs with this ENTIRE file. Paste the
 *      folder ID (the long string in the folder's URL) into FOLDER_ID
 *      below and set VIEW_TOKEN to the same random value you insert
 *      into Supabase's gallery_access table.
 *   4. Project Settings (gear) → check "Show appsscript.json in editor",
 *      then replace its contents with the appsscript.json next to this
 *      file. It only pins the timezone + web-app access — OAuth scopes
 *      are auto-detected from the code on purpose. Don't hand-list
 *      oauthScopes: a mangled scope string is what produces
 *      "Error 400: invalid_scope" at the authorization screen.
 *   5. Deploy → New deployment → type "Web app" → Execute as: Me →
 *      Who has access: Anyone → Deploy, and authorize when prompted.
 *      ("Anyone" is required for the site's anonymous fetch to reach the
 *      script — the VIEW_TOKEN check above is the actual gate.)
 *   6. Copy the .../exec URL into GALLERY_CONFIG.scriptUrl in
 *      gallery.html.
 *
 * To change this code later: edit in the Apps Script editor, then
 * Deploy → MANAGE DEPLOYMENTS → pencil → Version: New version → Deploy.
 * (Saving the editor does NOT ship; and "New deployment" instead would
 * mint a NEW /exec URL and require a gallery.html update.)
 */

// The Drive folder that holds the photos. Subfolders (one level deep)
// become album filters on the site; files sitting in the root show under
// ALL only.
var FOLDER_ID = 'PASTE-FOLDER-ID-HERE';

// Must match the view_token row in Supabase's gallery_access table.
// Signed-in members read it from Supabase and send it with every
// request; nothing here is served without it. Long + random.
var VIEW_TOKEN = 'CHANGE-ME';

var CACHE_KEY = 'gallery-list-v2'; // v2: cached value is gzipped
var CACHE_SECONDS = 300; // listing cache; uploads bust it immediately

function tokenOk_(t) {
  return !!VIEW_TOKEN && VIEW_TOKEN !== 'CHANGE-ME' && String(t || '').trim() === VIEW_TOKEN;
}

// GET ?token=… → { ok, folderId, photos: [{id, name, album, video, ts, dur}] }
function doGet(e) {
  if (!tokenOk_(e && e.parameter && e.parameter.token)) {
    return jsonOut_(JSON.stringify({ ok: false, error: 'unauthorized' }));
  }

  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEY);
  if (cached) return jsonOut_(unzip_(cached));

  var payload;
  try {
    payload = JSON.stringify({ ok: true, folderId: FOLDER_ID, photos: listPhotos_() });
  } catch (err) {
    return jsonOut_(JSON.stringify({ ok: false, error: String((err && err.message) || err) }));
  }
  try { cache.put(CACHE_KEY, zip_(payload), CACHE_SECONDS); } catch (e2) { /* still too big — serve uncached */ }
  return jsonOut_(payload);
}

// POST → upload. The body is JSON sent as text/plain: a "simple" POST
// skips the CORS preflight, which Apps Script web apps cannot answer.
// { action:'upload', token, album, name, mimeType, data(base64) }
function doPost(e) {
  var out = { ok: false };
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.action !== 'upload') {
      out.error = 'unknown action';
    } else if (!tokenOk_(req.token)) {
      out.error = 'unauthorized';
    } else {
      var mime = String(req.mimeType || '');
      if (!/^(image|video)\//.test(mime)) {
        out.error = 'images and videos only';
      } else {
        var name = String(req.name || 'upload').replace(/[\/\\]/g, '-').slice(0, 200);
        var bytes = Utilities.base64Decode(String(req.data || ''));
        var file = targetFolder_(String(req.album || '').trim().slice(0, 80))
          .createFile(Utilities.newBlob(bytes, mime, name));
        CacheService.getScriptCache().remove(CACHE_KEY); // show it on the next load
        out = { ok: true, id: file.getId() };
      }
    }
  } catch (err) {
    out.error = String((err && err.message) || err);
  }
  return jsonOut_(JSON.stringify(out));
}

// CacheService caps values at 100KB, which the raw listing outgrows at
// ~800 photos — so cache it gzipped (~10× smaller). Without this, every
// page load re-lists the whole folder (seconds instead of instant).
function zip_(s) {
  return Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(s)).getBytes());
}
function unzip_(s) {
  return Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(s), 'application/x-gzip')).getDataAsString();
}

// All image/video files in the root folder + one level of subfolders,
// newest upload first. Plain DriveApp iteration — a few seconds cold for
// big folders, then served from cache for CACHE_SECONDS.
function listPhotos_() {
  var root = DriveApp.getFolderById(FOLDER_ID);
  var photos = [];
  collectMedia_(root, '', photos);
  var subs = root.getFolders();
  while (subs.hasNext()) {
    var sub = subs.next();
    collectMedia_(sub, sub.getName(), photos);
  }
  photos.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
  return photos;
}

function collectMedia_(folder, albumName, out) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var mime = f.getMimeType() || '';
    if (!/^(image|video)\//.test(mime)) continue;
    out.push({
      id: f.getId(),
      name: f.getName(),
      album: albumName,
      video: mime.indexOf('video/') === 0,
      ts: f.getDateCreated().toISOString(),
      dur: null // DriveApp doesn't expose video duration; the badge shows a play icon
    });
  }
}

// Album name → matching subfolder (created if new). Empty → root folder.
function targetFolder_(albumName) {
  var root = DriveApp.getFolderById(FOLDER_ID);
  if (!albumName) return root;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // concurrent uploads must not create duplicate album folders
  try {
    var existing = root.getFoldersByName(albumName);
    return existing.hasNext() ? existing.next() : root.createFolder(albumName);
  } finally {
    lock.releaseLock();
  }
}

function jsonOut_(payload) {
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}
