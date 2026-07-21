# CLAUDE.md — TRACKRAT Project Guide

Context for AI assistants working on the TRACKRAT codebase.

## Project Overview

TRACKRAT is a static multi-page marketing site for the **TRACKRAT Sprint
Club** (Austin, TX) at **www.trackratsprint.club**, plus a small
authenticated PR ("personal record") tracking dashboard.

Pages:

- `/` — landing (with about/FAQ content + structured data for SEO/AEO)
- `/schedule` — weekly schedule with `.ics` calendar export
- `/brand` — brand guide
- `/podium` — competition results: meets TRACKRAT raced as a team, the relay squads, and placements (newest first; client-side search + discipline filter; static data array; grouped under the **Club** nav dropdown)
- `/invitational` — 2026 Invitational event page: October 18, 2026 at
  4401 Tilley St (has Event JSON-LD with a date-only `startDate`; no RSVP
  yet — when it exists, add an `offers` block with the RSVP URL and a
  start time, mirroring offtrack.html's Event)
- `/offtrack` — OFFTRACK demo night, presented by TRACKRAT (grouped under the **Events** nav dropdown)
- `/dashboard` — member dashboard (Google sign-in): a **Personal Records** tab
  (per-user PRs via Supabase), a **Partners** tab (member perks from the
  `promotions` table; deep link `/dashboard#PARTNERS`), and a **Gallery**
  tab (members-only club photos/videos from the shared Google Drive
  folder; deep link `/dashboard#gallery` — see the **Gallery** section
  below). `/gallery` used to be its own page; it now 301-redirects to
  `/dashboard#gallery`.

> Note: the dashboard is `/dashboard`. It used to be `/pr` (and `/prs` before
> that); both now 301-redirect to `/dashboard`. If you see `/pr` or `pr.html`
> anywhere outside those redirect rules, it's stale and should be `/dashboard`
> / `dashboard.html`.

## Architecture

| Concern | Choice |
|---|---|
| Hosting | Vercel (static pages + one zero-dep Node serverless function under `/api`) |
| Pages | One self-contained HTML file per route (inline CSS + JS) |
| Auth | Supabase Auth (Google OAuth provider) |
| Database | Supabase Postgres with Row Level Security |
| Build step | None — plain HTML/CSS/JS; the Supabase SDK is vendored in `js/vendor/` |

There is intentionally no framework, bundler, or `package.json`. Each page
holds its own styles and scripts so it can be read top-to-bottom without
chasing imports. The only shared module is the Supabase client.

## File Structure

```
TRACKRAT/
├── index.html              # /                      — landing
├── schedule.html           # /schedule              — weekly schedule + .ics + Event JSON-LD
├── brand.html              # /brand                 — brand guide
├── podium.html             # /podium                — competition results (search + discipline filter)
├── invitational.html       # /invitational          — 2026 Invitational (Oct 18, 2026 · Tilley St; RSVP TBD)
├── offtrack.html           # /offtrack              — OFFTRACK demo night (under Events dropdown)
├── dashboard.html          # /dashboard             — member dashboard: PRs + Partners + Gallery (Google sign-in)
├── 404.html                # branded 404 (served automatically by Vercel)
├── js/
│   ├── supabase-config.js  # Shared Supabase client (URL + anon key)
│   └── vendor/             # Vendored Supabase JS SDK (dep-inlined ESM bundle + node-*.mjs polyfills)
├── api/
│   └── video.js            # /api/video — same-origin Drive video streaming proxy (zero-dep Vercel Node function)
├── apps-script/
│   └── gallery/            # Apps Script web app behind /gallery (Code.gs + manifest; deployed manually)
├── fonts/                  # Self-hosted webfonts (woff2, latin subset) + OFL licenses
│   ├── fugaz-one-latin.woff2
│   ├── ibm-plex-mono-{400,500,600,700}-latin.woff2
│   └── LICENSE-*.txt
├── promos/                 # Partner logos for the Dashboard → Promotions tab
├── og.png                  # default 1200×630 Open Graph image
├── og-invitational.png     # /invitational OG image
├── og-offtrack.png         # /offtrack OG image
├── trackrat-wordmark.svg   # wordmark, black (outlined paths, no font; /brand DETAILS kit)
├── trackrat-wordmark-white.svg   # wordmark, white
├── trackrat-wordmark-orange.svg  # wordmark, Sprint Orange
├── trackrat-wordmark-black.png   # wordmark PNGs (transparent, 2000px): black / white / orange
├── trackrat-wordmark-white.png
├── trackrat-wordmark-orange.png
├── vercel.json             # cleanUrls, security headers, redirects, cache headers
├── robots.txt              # Crawl rules (/dashboard handled by noindex meta, NOT Disallow)
├── sitemap.xml             # Public-page sitemap (excludes /dashboard + /gallery; includes /offtrack)
├── llms.txt                # LLM-facing site description
├── favicon.ico             # browser-tab + Google SERP icon (TR monogram; 16/32/48/64px frames)
├── favicon.svg             # vector favicon (TR monogram; crisp at any size, modern browsers)
├── apple-touch-icon.png    # iOS home-screen icon (180×180, non-transparent)
├── icon-192.png            # PWA/Android home-screen icon (192×192)
├── icon-512.png            # PWA/Android icon + splash (512×512; also the icon master)
├── site.webmanifest        # Web app manifest (home-screen name/icons/theme)
├── LICENSE                 # MIT for code; brand assets all rights reserved
├── SECURITY.md             # Vulnerability disclosure policy
├── README.md               # User-facing setup docs
└── CLAUDE.md               # This file
```

`supabase-schema.sql` was removed from the repo intentionally — the production
DB is already provisioned. The canonical schema lives in the **Run the
schema** section of `README.md`. If you make DB changes, update that block
*and* write a migration snippet in your PR description.

## Routing, redirects & headers

`vercel.json` uses **`cleanUrls: true`** — no per-page rewrites needed.
Vercel serves `/schedule` from `schedule.html` and 308-redirects
`/schedule.html` → `/schedule`. There is deliberately **no catch-all
rewrite**: unknown URLs return the branded `404.html` with a real 404
status (a catch-all to index.html would make every typo a soft-404).

Redirects: apex → `www.trackratsprint.club` (canonical host),
`/2026-invitational` → `/invitational`, `/pr` + `/prs` → `/dashboard`,
and `/gallery` → `/dashboard#gallery` (the gallery used to be its own
page).

Headers: security baseline on `/(.*)`(HSTS, nosniff, `X-Frame-Options:
DENY`, CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'none'`,
Referrer-Policy, Permissions-Policy); immutable year cache on `/fonts/*`
and `/js/vendor/*`; daily cache on `og*.png` + `favicon.ico` + the
home-screen icons; the `.webmanifest` MIME is set explicitly. Don't add a
`script-src` CSP directive casually — the pages run inline module
scripts and would need hashes.

Locally (no Vercel) visit `*.html` paths directly.

## Supabase SDK (vendored)

`js/supabase-config.js` imports the SDK (currently 2.108.1) from
`/js/vendor/supabase-js-<version>.bundle.mjs` — a dependency-inlined ESM
bundle whose Node polyfill imports are rewritten to the local
`./node-*.mjs` files (buffer, process, events, tty, async_hooks — they
import each other, so the rewrite is recursive). Auth uses `flowType:
'pkce'`. **Don't reintroduce a CDN import (esm.sh, jsDelivr, unpkg)** —
the vendored copy exists so no third party executes code on the
authenticated /dashboard page. To upgrade: fetch a dependency-inlined bundle of
the new version, rewrite the polyfill imports, verify zero absolute/bare
specifiers remain (beware: realtime-js embeds `import ws from "ws"`
inside error-message *strings* — a grep false positive, not a real
import), update the import in supabase-config.js, and test sign-in + a
PR save on production before calling it done.

## SEO / AEO

Every public page ships with:

- A specific `<title>` (e.g. `TRACKRAT — Austin Sprint Club`, `Schedule ·
  TRACKRAT — Austin Sprint Club`).
- A descriptive `meta name="description"`.
- A `rel="canonical"` link pointing at the **`www.trackratsprint.club`** host.
- Open Graph + Twitter Card meta tags pointing at the page's OG image —
  `/og.png` by default; `/invitational` and `/offtrack` have their own
  `og-*.png`.
- Geo meta (`US-TX`, `Austin`).

`index.html` additionally has:

- A visible content section below the splash hero with about / schedule / FAQ
  copy. Without it, crawlers can't rank the page — the hero is a single word.
- A `SportsClub` JSON-LD block with the full Sunday meet location
  (4401 Tilley St) and `sameAs` links (Instagram/Discord/X/shop + the
  Google Business Profile share link).
- A `FAQPage` JSON-LD block — high signal for Google AI Overviews, ChatGPT
  Search, Perplexity, etc. Every FAQ answer must stay grounded in visible
  page copy (invisible-answer FAQ markup can be treated as spam).

`dashboard.html` carries `noindex, follow`; it's a member-private page
(and excluded from sitemap.xml). It is deliberately NOT `Disallow`ed in
robots.txt — blocking crawl would prevent Google from ever seeing the
noindex meta.

`schedule.html` ships `Event` JSON-LD for both weekly sessions
(`eventSchedule`, weekly recurrence). **Sunday** carries its full street
address (4401 Tilley St, Austin TX 78723, a fixed, already-public
location; the address makes it eligible for Google's local/event
surfaces). **Thursday's location varies week to week** (announced on the
Instagram story and Discord), so its JSON-LD `location` stays city-level
(`Austin, TX`, `name: "Location varies weekly (announced on Instagram
and Discord)"`) with no street address.
Each Event also carries a concrete `startDate`/`endDate` for an upcoming
occurrence — Google requires `startDate` for Event rich results
(`eventSchedule` alone doesn't qualify). **Those dates go stale once the
occurrence passes — refresh them periodically** to the next
Sunday/Thursday (CDT is `-05:00`, CST is `-06:00`).

The OG image is rendered in actual Fugaz One (black wordmark on Sprint
Orange `#FF4D1F`, 1200×630, palette-optimized PNG).

### Favicon + home-screen icons

Every page's `<head>` carries the same icon block (right after the first
`<link rel="icon">`): the SVG favicon, `apple-touch-icon`, `manifest`,
and the `apple-mobile-web-app-title` meta. Keep it identical across all
pages (same lockstep rule as the nav) — whichever page a member "adds to
home screen" must resolve the icons.

- `favicon.ico` — browser tab + **Google search-result favicon**. Holds
  16/32/48/64px frames; the 48+ frames matter because Google upscales
  anything smaller in the SERP (a 32px-max .ico rendered grainy). **iOS
  ignores it for the home screen** (falls back to a page screenshot
  without an `apple-touch-icon`), which is why the block below is
  required.
- `favicon.svg` — vector tab icon for modern browsers (crisp at any
  DPI). White TR reusing the outlined letterforms from
  `trackrat-wordmark.svg` (subpaths 0–2 = T + R), scaled to match the
  raster icons. No font dependency. Regenerate the raster set from
  `icon-512.png`; the .ico is assembled with a small ICO writer
  (PNG-in-ICO frames) since there's no ImageMagick.
- `apple-touch-icon.png` (180×180) — iOS home screen. **Must be
  non-transparent** (iOS composites transparency to black and applies
  its own rounded-corner mask; design full-bleed and let iOS round).
- `site.webmanifest` → `icon-192.png` / `icon-512.png` — Android/Chrome
  home screen + install + splash. Icons are `purpose: "any maskable"`;
  the TR sits well inside the center safe zone so adaptive masks don't
  clip it. `theme_color`/`background_color` are `#000000`.
- All icons are the **TR monogram (white, Fugaz One) on Sprint Orange**,
  matching favicon.ico. `icon-512.png` is the master; the 192 and 180
  are downscales. To regenerate: render `TR` in Fugaz One centered on a
  512×512 `#FF4D1F` square (headless Chrome or any renderer), then
  `sips -Z 192` / `-Z 180`. vercel.json sets the manifest MIME
  (`application/manifest+json`) and a daily cache on the icons.

## Shared Patterns Across Pages

### Design tokens

```css
--orange: #FF4D1F;       /* primary brand */
--black:  #000000;
--white:  #FFFFFF;
--font:   'IBM Plex Mono', monospace;
--lane-color: rgba(255, 255, 255, 0.12);  /* track-lane background */
```

Typography pairs **Fugaz One** (display) with **IBM Plex Mono** (UI / body).
Both are **self-hosted** as latin-subset woff2 files in `/fonts`. Every
page preloads the two above-the-fold fonts (Fugaz One regular + Plex Mono
400) and declares all five `@font-face` rules inline at the top of its
`<style>` block. `font-display: swap` keeps the page readable in a
fallback face during the brief load. Don't bring back the Google Fonts
`<link>` — it was removed deliberately to eliminate render-blocking and
the third-party round-trip. To swap fonts: drop a replacement woff2 with
the same filename into `/fonts/`.

### Track-lane background

`schedule.html`, `brand.html`, `podium.html`, and `dashboard.html` use a fixed 8-lane track backdrop:

```html
<div class="track-lanes">
  <div class="lane"></div> <!-- ×8 -->
</div>
```

`index.html` and `invitational.html` use the solid orange / black backgrounds
without lanes.

### Nav

**Byte-identical across all pages** (intentionally duplicated — no framework).
The only per-page difference is the `.menu-toggle` color (black on the orange/
paper pages, white on the black pages) — the rest of the nav markup, CSS, and
JS must stay identical everywhere. There is **no HOME link** — the `TRACKRAT`
wordmark on the left is the home link everywhere. There is also **no
top-level DASHBOARD link** — the dashboard is reached via CLUB →
PERSONAL RECORDS / PROMOTIONS; those links are not state-aware
(`/dashboard` handles signed-out vs signed-in).

Desktop order: `SHOP · SCHEDULE · BRAND · CLUB ▾ · EVENTS ▾`

The centered bar collapses to the hamburger at **≤880px** (the
breakpoint is tuned to where the bar starts crowding the
absolute-positioned wordmark, so re-tune it on every page if the bar
gets wider or narrower).

**CLUB and EVENTS are dropdowns, not pages** (there are intentionally no
`/club` or `/events` routes). CLUB groups the member-facing destinations:
GALLERY (`/dashboard#gallery`), PODIUM, PERSONAL RECORDS (`/dashboard`),
and PARTNERS (`/dashboard#PARTNERS`) — the hashes deep-link to dashboard
tabs (matched case-insensitively; the legacy `#promotions` still works).
EVENTS groups the two event pages: **2026 Invitational** and **OFFTRACK**
(`/offtrack`). Desktop: `.nav-dropdown`s whose `.nav-dropdown-panel`
opens on `:hover` / `:focus-within` (CSS) plus click-toggle +
click-outside + Escape (JS — the shared nav script handles any number of
dropdowns and closes the others when one opens); the panel is always
solid black with a hairline border so it reads the same on the orange
pages and the black pages. Mobile: one `.mobile-accordion-trigger`
button per group (direct children of `.mobile-menu-links`, so the
slide-in stagger still works — the stagger runs to `:nth-child(7)`)
toggling `.mobile-accordion-panel.is-open`. If you add another nav item,
replicate the whole block across all pages and re-check the stagger
count.

Mobile menu is a full-screen overlay with its own **header** — the TRACKRAT
wordmark (→ home) on the left and an explicit **close X** (`#menuClose`) on the
right. The X lives INSIDE the overlay on purpose: the old hamburger-morph X was
buried by a z-index stacking trap (nav's `z-index:100` context capped the
toggle below the `150` overlay). Don't move the close control back into `<nav>`.
The hamburger (`#menuToggle`) only opens; `#menuClose`, tapping a link, and
Escape all close. Focus moves to the X on open, back to the hamburger on close.
Stagger fade-ins run on `.mobile-menu-links > *:nth-child(1…7)` (7: SHOP,
SCHEDULE, BRAND, the CLUB accordion trigger + panel, the EVENTS accordion
trigger + panel).

## Gallery (Dashboard → GALLERY tab)

Members-only photo + video gallery served straight from the club's
shared **Google Drive** folder. It lives as the third tab of
`/dashboard` (`#galleryPanel` in dashboard.html; deep link
`/dashboard#gallery`; the old `/gallery` route 301-redirects there). No
API key, no build step; the dashboard's Google sign-in + Supabase gate
who gets in:

- **Backend** — a Google Apps Script **web app** (source committed at
  `apps-script/gallery/Code.gs` + `appsscript.json`; deployed manually at
  script.google.com — steps in README's *Photo gallery* section). Deployed
  "Execute as: Me" / access "Anyone", so it runs as the club's Google
  account: GET returns the folder listing as JSON, POST accepts an upload
  — both require the view token (below). Deploy it from the account that
  owns the photo folder — website uploads are created by (and billed to
  the storage of) that account.
- **Config** — `GALLERY_CONFIG.scriptUrl` at the top of the GALLERY TAB
  block in dashboard.html's script (the `/exec` URL; empty string = the
  tab shows setup instructions), plus optional `folderUrl`. `FOLDER_ID`
  and `VIEW_TOKEN` live only in the *deployed* Code.gs — the repo copy
  keeps placeholders (the repo is public).
- **Members gate** — the gallery code is a block-scoped section of
  dashboard.html's module script (its only exports are the
  `openGalleryTab` / `resetGalleryTab` hooks used by `selectTab` and the
  auth listener). Lazy like the Partners tab: on first open it reads the
  **view token** from Supabase's `gallery_access` table — RLS lets the
  row through only when `is_member()` (a security-definer function
  checking the JWT email against the `members` allowlist; DDL in
  README's *Photo gallery* section; both tables + real values live only
  in Supabase). Zero rows = a "MEMBERS ONLY / not on the list yet" note
  inside the tab. The token rides every listing/upload request
  (`?token=` / body `token`) and must equal `VIEW_TOKEN` in the deployed
  Code.gs — rotate both together. `resetGalleryTab` runs on sign-out /
  user switch so one member's roll never lingers for the next account.
- **Images** — Drive's public thumbnail CDN:
  `https://drive.google.com/thumbnail?id=<id>&sz=w400` for tiles, `w1600`
  for the lightbox. This only works while the folder is shared **"Anyone
  with the link · Viewer"** (files inherit). Exactly two size buckets on
  purpose — keeps the CDN cache hot. Videos play in the lightbox inside
  the gallery's own custom controls (`makeNativePlayer`:
  play/scrub/mute/fullscreen). The `controls` attribute is deliberately
  OFF — iOS Safari stacks its system media overlay on top of the
  built-in inline controls, doubling the UI even on a plain native
  `<video controls>`; custom controls are the only reliable
  single-control-set cure (the YouTube/Vimeo/Mux pattern). The `<video>`
  src is the **same-origin streaming proxy** `/api/video?id=<id>&token=`
  (`api/video.js`, a dependency-free Vercel Node function): it fetches
  `https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`
  server-side and pipes the bytes through with Range/206 passthrough
  (plus an explicit `Accept-Ranges: bytes`, `Content-Disposition:
  inline`, and MIME corrected from the filename Drive reports — .MOVs
  come back `application/octet-stream`). The proxy exists because
  **Google gates the usercontent host on Fetch Metadata** (verified
  2026-07 by header bisection): any cross-site browser subresource
  request — `<video>` src (`Sec-Fetch-Dest: video`) or `fetch()`
  (`Sec-Fetch-Mode: cors`) — gets a 403 HTML page; only navigations
  (`Sec-Fetch-Mode: navigate`) pass. Browsers attach those headers
  unconditionally and JS can't strip them, so **no client-side approach
  (direct src, CORS-fetch-to-blob, lh3 =m22 transcodes — all tested) can
  ever stream Drive bytes** — don't re-attempt one; curl "verifying" the
  endpoint without Sec-Fetch headers is a false positive. On `error`
  (proxy not deployed, upstream quota 403, a codec the device can't
  decode) the player falls back to Drive's transcoding
  `https://drive.google.com/file/d/<id>/preview` iframe, which always
  plays but double-stacks controls on iOS — the last resort, never the
  primary. The proxy's gate protects bandwidth, not secrecy (files are
  link-shared): with a `GALLERY_VIEW_TOKEN` env var set in Vercel
  (same value as the Apps Script `VIEW_TOKEN`) it requires the token;
  without it, it falls back to a same-site `Sec-Fetch-Site`/Referer
  check. Fullscreen hands off to `webkitEnterFullscreen` on iPhone
  (iOS's clean native fullscreen player), `requestFullscreen` elsewhere.
  The usercontent URL is still the DOWNLOAD link (navigations pass the
  gate and Content-Disposition applies). The page CSP doesn't restrict
  child frames, only being framed.
- **Albums** — one level of subfolders inside the photo folder. Root-level
  files appear under ALL only. The upload form can create a new album
  (server-side, with a lock to avoid duplicate folders). Chips are
  ordered newest-event-first by the `M.DD.YY-` date prefix in the folder
  name (`albumCompare` in dashboard.html; undated names fall back to Z→A),
  and the row collapses to ALL + the three newest + a `+ N MORE` toggle
  (`CHIPS_COLLAPSED`); the active album always stays visible even when
  it's behind the fold.
- **Uploads** — members-only via the same view token; there is no
  separate upload code. The POST body is JSON sent as
  `Content-Type: text/plain` **on purpose**: Apps Script web apps can't
  answer a CORS preflight, and text/plain keeps the request "simple".
  ~40MB/file cap (Apps Script's POST limit is ~50MB of base64); bigger
  files go through the Drive folder link shown in the form. Uploads are
  stored byte-for-byte — **never add client-side recompression**;
  preserving quality is the whole reason the club moved to Drive.
- **Caching** — the script caches its listing for 5 minutes
  (CacheService) and busts the cache on every successful upload, so page
  uploads appear immediately; files added directly in Drive can take up
  to 5 minutes.
- **Privacy** — this is a club gate, not cryptographic privacy. The
  Drive folder stays link-shared ("Anyone with the link · Viewer") so
  Drive's thumbnail CDN can serve images anonymously — meaning any
  individual file/folder Drive link still works for whoever it's
  forwarded to, exactly like sharing from Drive directly. The website
  layer (sign-in + allowlist + token) gates *discovery and listing*.
  The dashboard page carrying the tab is `noindex` and excluded from
  sitemap.xml (deliberately not robots-Disallowed). Locking the folder
  itself would require proxying every image through an authorized
  backend and losing Drive's CDN — deliberately not done.

## Dashboard (`/dashboard`)

Authenticated member dashboard backed by Supabase (`dashboard.html`, formerly
`pr.html` / `/pr`). Three tabs inside the signed-in view, toggled by
`.dash-tab` buttons (`selectTab('pr'|'promo'|'gallery')`); the nav's CLUB
dropdown deep-links via hashes handled by `applyTabHash()` (initial load
+ `hashchange`, case-insensitive): `#PARTNERS` (legacy `#promotions`
too) → Partners, `#gallery` → Gallery, anything else → Personal Records.

- **Personal Records** (default) — the PR tracker described below, wrapped in
  `#prPanel`.
- **Partners** — `#promoPanel` (promotions under the hood). Lazy-loads on
  first open from the Supabase `promotions` table and renders
  `.promo-card`s. See **Promotions** below.
- **Gallery** — `#galleryPanel`. The Drive-backed club gallery; see the
  **Gallery** section above.

### Promotions tab

Member perks (discount codes etc.) live in a Supabase **`promotions`** table —
**not** in this public repo — so the codes stay behind the sign-in wall. RLS
grants `select` to the `authenticated` role only (any signed-in Google user;
there's no separate "member" role). The table **DDL** lives in README's
*Promotions table* section; the **real rows are seeded directly in Supabase and
are deliberately NOT committed** (the repo is public — committing codes/offers
would defeat the sign-in gate). README ships only a placeholder example.
Migrations are manual (run in the SQL editor).

- Columns: `partner, offer, details, code, redemption, location, url, logo,
  logo_bg, sort_order, active`. Rendering is data-driven in
  `dashboard.html` (`promoCardHtml`); add a promo by inserting a row.
- Partner **logos** are committed under `/promos/` (brand marks are public; only
  the codes are gated). **Use raster (PNG/WEBP/JPG), not SVG** — SVG-as-`<img>`
  can render blank on iOS Safari. `logo_bg` is the tile color behind the logo:
  dark-on-light logos use `#FFFFFF`; a light/white logo for the dark dashboard
  bakes a dark bg into the PNG and sets `logo_bg` to match (WellSport: `#080808`).
- All promo fields are escaped before injection (`escapeHtml`); `url` is
  validated with `safeUrl` (http/https only) and `logo_bg` with `safeColor`.
- The tab degrades gracefully if the table doesn't exist yet (shows an error
  line, PR tab unaffected).

## Personal Records tab

Backed by Supabase.

### Events

**Run / distance** (stored as seconds, `numeric(10,3)`):
`100m`, `200m`, `400m`, `1mile`, `5K`, `halfmarathon`, `marathon`.

**Lifts** (stored as pounds + sets + reps):
`bench`, `deadlift`, `squat`, `hangclean`, `pullups` (pull-ups allow
`value_pounds = 0` for bodyweight; every other lift requires > 0).

**Performance metrics** (single number in `value_metric`, configured in
the `METRIC_EVENTS` object in dashboard.html — unit label, input step,
placeholder, and BEST direction): `verticaljump` (in), `rsi` (unitless),
`peakpower` (W), `groundcontact` (s, lower-is-better). To add another
metric: one entry in `METRIC_EVENTS`, plus `EVENT_LABELS`/`EVENT_ORDER`,
a chip button, and the SQL whitelist.

### Data model

Single `prs` table:

```
prs (
  id            uuid pk,
  user_id       uuid references auth.users on delete cascade,
  event         text,                  -- check: whitelist above
  value_seconds numeric(10,3),         -- run events
  value_pounds  numeric(10,2),         -- lift events
  value_metric  numeric(10,3),         -- performance metrics
  sets          int,                   -- lifts only
  reps          int,                   -- lifts only
  notes         text,                  -- optional, ≤ 280 chars, any event
  achieved_on   date,
  created_at    timestamptz default now()
)
```

The `value_matches_event` check constraint enforces that the right value
columns are populated for each event category:

- Run events → `value_seconds` set, `value_pounds`/`sets`/`reps` null.
- Lift events → `value_pounds` set, `value_seconds` null. `sets`/`reps` are
  nullable to keep legacy rows valid; the form requires them for new entries
  (default 1×1).

`notes` is orthogonal — any event can carry a note, including none.

RLS is enabled with four policies (`select`, `insert`, `update`, `delete`)
each scoped to `auth.uid() = user_id`. The `authenticated` role has explicit
GRANTs for `select, insert, update, delete` (Supabase doesn't auto-grant
when you create tables via SQL — only via the Table Editor UI). Without
those GRANTs, signed-in users get *"permission denied for table prs"*
*before* RLS even runs.

### Why the anon key is safe to commit

Supabase's anon key is *designed* to be public. Security is enforced by the
RLS policies above — not by key secrecy. The only key that must never ship
to the client is `service_role`, which bypasses RLS. We don't use it.

### Client flow (`dashboard.html`)

1. Import shared client: `import { supabase } from '/js/supabase-config.js'`.
2. On load, call `supabase.auth.getSession()`. The page defaults to
   `body.auth-mode`, which shows the focused full-screen sign-in (`#authScreen`)
   — an orange/black split with the wordmark and a single **Sign in with Google**
   button — and hides the nav/dashboard/footer.
   - No session → keep `body.auth-mode` (show `#authScreen`).
   - Session → `setSignedIn()` removes `body.auth-mode`, revealing the nav,
     user strip, PR form/history, and Promotions tab. (Google is the only
     sign-in method.)
3. `signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/dashboard }})`.
4. `onAuthStateChange` keeps the UI in sync after sign-in/sign-out — see the
   *Important gotchas* section below.
5. CRUD calls go straight to `supabase.from('prs')…` — RLS handles
   authorization.

The form has four modes shown conditionally based on the selected event:

- Run events → hours / minutes / seconds inputs → stored as total seconds.
- Lift events → pounds + sets + reps inputs.
- Date picker → month / day / year selects (always shown).
- Notes → optional textarea (always shown).

The "current PR" badge per event is computed client-side (min seconds for
runs, max pounds for lifts), so we don't have to maintain a "best" flag in
the DB.

### Edit + delete

Each row in `YOUR RECORDS` has a pencil (edit) and trash (delete). Edit loads
that row's values back into the form, locks the event chip, and changes the
submit button to `UPDATE PR`. Sets `editingId` on the page; on submit, routes
through `update(payload).eq('id', editingId)` instead of `insert(payload)`.

### Important gotchas

**Supabase JS v2 auth lock.** `onAuthStateChange` runs inside an internal
lock. Awaiting Supabase calls (`refreshHistory`, `from('prs').select`) inside
the callback deadlocks when the SDK fires a background event like a token
refresh or tab visibility change. Symptom: ~30–60 seconds after page load,
the records list goes to a perma-LOADING state and saves also hang. The
current code addresses this by:

1. Making the `onAuthStateChange` callback **synchronous**.
2. Only re-fetching when `user.id` actually changes (not on every token
   refresh).
3. Wrapping any Supabase call inside the callback in `setTimeout(…, 0)` so
   the lock is released first.
4. Using `{ silent: true }` on the re-fetch to avoid LOADING flicker.

If you touch the init block, preserve all four of those. The original
buggy pattern (`async (event, session) => { ... await refreshHistory() ... }`)
will break in production after a minute.

**Always set every value column in payloads.** Even when only one is
relevant. So a run-event insert sends `value_pounds: null, sets: null,
reps: null`, and a lift-event insert sends `value_seconds: null`. This keeps
the `value_matches_event` constraint satisfied for UPDATEs even if we ever
allow swapping event types during edit.

**Notes are user input.** Use `escapeHtml()` before injecting into
`innerHTML`. The helper is already defined in `dashboard.html`.

## Development Guidelines

### Local development

```bash
npx serve .          # http://localhost:3000
# or
python -m http.server 3000
```

Visit pages by their `.html` filename locally — Vercel's clean-URL rewrites
don't apply to plain file servers.

### Adding a new page

1. Create `newpage.html` mirroring an existing page's skeleton (nav, mobile
   menu, track lanes if applicable, **full SEO meta block**, **the icon
   block** — `favicon`/`apple-touch-icon`/`manifest`/
   `apple-mobile-web-app-title` (see *Favicon + home-screen icons*),
   **the two `<link rel="preload" as="font" ... crossorigin>` tags**, and
   **all five `@font-face` declarations** at the top of `<style>`).
2. No `vercel.json` route change needed — `cleanUrls` serves `/newpage`
   from `newpage.html` automatically.
3. Add the link to **every** page's nav (desktop `.nav-center` and mobile
   `.mobile-menu-links`) — and update the
   `.mobile-menu.is-open .mobile-menu-links > *:nth-child(N)` stagger delays
   accordingly. (Or add it under the Club or Events dropdown if it
   belongs in one of those groups.)
4. If indexable, add to `sitemap.xml` with a `<lastmod>`. If user-private,
   set `<meta name="robots" content="noindex, follow">` in the page head —
   and do NOT also `Disallow` it in robots.txt (a crawl block would stop
   Google from ever seeing the noindex).

### Adding a new PR event

Three places to keep in sync:

1. **SQL** — extend the `prs_event_check` and `value_matches_event`
   constraints in Supabase (write a migration as `alter table ... drop
   constraint ... add constraint ...`).
2. **`dashboard.html`** — add to `RUN_EVENTS` or `LIFT_EVENTS`, plus `EVENT_LABELS`
   and `EVENT_ORDER`.
3. **`dashboard.html`** — add a chip button to the `#eventGrid` markup.

### Editing the PR dashboard

- All UI logic lives in `dashboard.html`. Don't try to extract components.
- Database changes: write the migration in `README.md`'s schema section, run
  it in the Supabase SQL editor, and call it out in commit messages.
- Migrations are manual — there's no migration tool.

### Deployment

Push to the default branch (`main`) → Vercel auto-deploys. No build step.
Static files plus the zero-config Node serverless function(s) under
`/api` (currently just `api/video.js` — keep them dependency-free; no
`package.json`).

## Browser Compatibility

- ES modules (native `<script type="module">`)
- `fetch`, async/await, viewport units (`dvh`, `vw`)
- Targets: current Chrome, Safari 14+, Firefox 85+, mobile Safari + Chrome

## AI Assistant Tips

1. **Read the page top-to-bottom.** Each `.html` file is self-contained
   (styles + scripts inline). There's no shared CSS file or component
   library to chase.
2. **The repo is public.** Treat anything in `js/supabase-config.js` and
   below as visible to the world. Anything sensitive belongs in Vercel env
   vars, not in tracked files.
3. **Don't introduce a framework or build step.** The minimal, no-deps
   ethos is intentional. If you reach for React/Vite/Tailwind, stop and
   reconsider.
4. **Match the existing style.** Black background, orange accent, Fugaz One +
   IBM Plex Mono, ALL-CAPS labels with letter-spacing on UI chrome, track
   lanes for dashboard-style pages.
5. **Keep the nav in lockstep across all eight nav pages** (index, schedule,
   brand, podium, gallery, invitational, offtrack, dashboard). A change to nav
   markup, the Club/Events dropdowns/accordions, stagger delays, or the
   1060px collapse breakpoint must be applied everywhere or pages will
   drift. (404.html has no nav.)
6. **For PR features, trust RLS.** Don't add server-side authorization logic
   — it's already in Postgres. The client talks to Supabase directly.
7. **Mobile-first.** Test at 375px before declaring done.
8. **SEO meta is not optional.** Every new public page needs a unique title,
   canonical, OG, Twitter card, and geo meta. Copy the head block from
   `schedule.html` as a starting point.
9. **Address policy: Sunday is fixed and published, Thursday varies.**
   Sunday at 4401 Tilley St appears with its full street address in
   JSON-LD, llms.txt, and visible copy (already public on the schedule
   page + in the .ics file; the address makes the event eligible for
   Google's local/event surfaces). Thursday's location changes week to
   week and is announced on the Instagram story and Discord, so it stays
   city-level (Austin, TX) everywhere: no street address in JSON-LD,
   llms.txt, .ics, or visible copy. Keep structured data, GBP, and
   visible copy consistent with each other (NAP consistency).
10. **Don't use `opacity` for "dim" text on the orange background.** Black
    at low opacity composites with `#FF4D1F` to a muddy mid-orange that
    fails WCAG AA contrast. On `index.html`, use the solid color
    `#1a0700` (or darker) instead — same visual feel, ~5.9:1 contrast.
    On the black-background pages (`schedule`/`brand`/`dashboard`) white text is
    fine.
11. **Don't reintroduce Google Fonts.** Fonts are self-hosted in `/fonts/`
    and preloaded per page. Reverting to `fonts.googleapis.com/css2?...`
    brings back render-blocking + a network-dependency chain that
    Lighthouse will flag. If you need a new weight, fetch the matching
    woff2 from Google with a modern UA and drop it in `/fonts/`.
