# TRACKRAT

The website for **TRACKRAT**, a free sprint club in Austin, Texas.

Static, no build step. Each page is a self-contained HTML file with inline CSS
and JS. Hosted on Vercel.

## Technology Stack

| Concern | Choice |
|---|---|
| Hosting | Vercel (static + edge runtime for `/api`) |
| Pages | One self-contained `.html` per route (inline CSS + JS) |
| Auth (PR tracker) | Supabase Auth (Google OAuth) |
| Database (PR tracker) | Supabase Postgres with Row Level Security |
| Photo gallery | Google Drive folder + Apps Script web app (no API key — see [Photo gallery](#photo-gallery-google-drive)) |
| Fonts | Self-hosted Fugaz One (display) + IBM Plex Mono (UI), latin subset, woff2 in `/fonts` |
| Build step | None |

## Project Structure

```
TRACKRAT/
├── index.html              # /                      — landing (with SEO/AEO content + JSON-LD)
├── schedule.html           # /schedule              — weekly schedule + .ics export + Event JSON-LD
├── brand.html              # /brand                 — brand guide
├── podium.html             # /podium                — competition results (search + discipline filter)
├── invitational.html       # /invitational          — 2026 Invitational (Oct 18, 2026 · Tilley St; RSVP TBD)
├── offtrack.html           # /offtrack              — OFFTRACK demo night, presented by TRACKRAT (under Events)
├── dashboard.html          # /dashboard             — member Dashboard: PRs + Partners + Gallery + Waiver (Google sign-in)
├── waiver.html            # /waiver               — club rules + liability waiver, signed in the browser
├── 404.html                # branded not-found page (Vercel serves it with status 404)
├── js/
│   ├── supabase-config.js  # Shared Supabase client (URL + anon key)
│   ├── waiver-config.js    # Waiver + code-of-conduct registry (versions, hashes, stamp coords)
│   └── vendor/             # Vendored (self-hosted) Supabase JS SDK + pdf-lib bundles
├── apps-script/
│   └── gallery/            # Apps Script web app behind /gallery (Code.gs + manifest; deployed manually)
├── fonts/                  # Self-hosted webfonts (woff2, latin subset) + OFL license texts
│   ├── fugaz-one-latin.woff2
│   ├── ibm-plex-mono-{400,500,600,700}-latin.woff2
│   └── LICENSE-*.txt       # SIL OFL 1.1 notices for both font families
├── promos/                 # Partner logos for the Dashboard → Promotions tab
├── waiver-docs/            # Versioned waiver PDFs + code of conduct + verbatim HTML transcripts
│                           #   NEVER overwrite a file here: signed rows are pinned to its bytes
├── vercel.json             # cleanUrls, security headers, redirects, cache headers
├── og.png                  # default 1200×630 Open Graph image
├── og-invitational.png     # /invitational OG image
├── og-offtrack.png         # /offtrack OG image
├── trackrat-wordmark.svg   # wordmark, black (outlined paths, no font; /brand DETAILS kit)
├── trackrat-wordmark-white.svg   # wordmark, white
├── trackrat-wordmark-orange.svg  # wordmark, Sprint Orange
├── trackrat-wordmark-black.png   # wordmark PNGs (transparent, 2000px): black / white / orange
├── trackrat-wordmark-white.png
├── trackrat-wordmark-orange.png
├── robots.txt              # Crawl rules (/dashboard is noindexed via meta, not Disallowed)
├── sitemap.xml             # Public-page sitemap
├── llms.txt                # LLM-facing site description
├── favicon.ico             # browser-tab + Google SERP icon (TR; 16/32/48/64px)
├── favicon.svg             # vector favicon (TR; crisp at any size)
├── apple-touch-icon.png    # iOS home-screen icon (180×180)
├── icon-192.png            # PWA/Android home-screen icon
├── icon-512.png            # PWA/Android icon + splash (icon master)
├── site.webmanifest        # Web app manifest (home-screen name/icons/theme)
├── LICENSE                 # MIT for code; brand assets excluded (all rights reserved)
├── SECURITY.md             # Vulnerability disclosure policy
├── README.md               # This file
└── CLAUDE.md               # Project context for AI assistants
```

## SEO / AEO

Each public page ships with:

- A specific `<title>` and meta description (e.g. *"TRACKRAT — Austin Sprint Club"*).
- A canonical link to the `www.trackratsprint.club` host.
- Open Graph + Twitter Card tags pointing at the page's OG image — `/og.png`
  by default; `/invitational` and `/offtrack` ship their own `og-*.png`.
- Geo meta (`US-TX`, `Austin`).

The home page (`index.html`) additionally has:

- An actual content section below the splash hero with location, schedule, and
  audience copy (so crawlers and answer engines have substantive text to read).
- A `SportsClub` JSON-LD block with `openingHoursSpecification`, `areaServed`,
  the full Sunday meet location (4401 Tilley St — also on Google Business
  Profile), and `sameAs` links covering Instagram/Discord/X/shop/GBP.
- A `FAQPage` JSON-LD block (high signal for Google AI Overviews, ChatGPT
  Search, Perplexity). Every FAQ answer is grounded in visible page copy.

`dashboard.html` carries `noindex, follow` since it's an authenticated
dashboard. (It is deliberately NOT `Disallow`ed in `robots.txt` — Google must
be able to crawl the page to see the noindex.) `offtrack.html` is a normal
public, indexable page and is listed in `sitemap.xml`.

`schedule.html` ships `Event` JSON-LD for both weekly sessions
(`eventSchedule` with weekly recurrence, plus a concrete
`startDate`/`endDate` for an upcoming occurrence — Google requires
`startDate` for Event rich results, so refresh those dates periodically).
Sunday carries its full street address (4401 Tilley St, a fixed,
already-public location matching Google Business Profile, which makes it
eligible for Google's local/event surfaces). Thursday's location varies
week to week (announced on the Instagram story and Discord), so its
JSON-LD stays city-level with no street address.

The OG image (`og.png`) is rendered in actual Fugaz One (black wordmark on
brand orange, 1200×630, palette-optimized).

## Fonts

Fonts are **self-hosted** (woff2, latin subset) from `/fonts`. Every page:

1. Preloads the two above-the-fold fonts (Fugaz One + IBM Plex Mono 400)
   via `<link rel="preload" as="font" ... crossorigin>`.
2. Declares all five `@font-face` rules inline at the top of `<style>`.
3. Uses `font-display: swap` so text renders in the fallback font for the
   brief moment before the woff2 finishes loading.

Total weight: ~50 KB across 5 files. `vercel.json` sets
`Cache-Control: public, max-age=31536000, immutable` on `/fonts/*`, so
returning visitors don't re-download the fonts.

To refresh or change fonts: re-fetch the woff2s from Google Fonts (or any
source), drop them in `/fonts/` with the existing filenames, and they'll
be picked up by the next deploy. No build step.

## Routing & headers

`vercel.json` uses **`cleanUrls: true`** — Vercel serves `/schedule` from
`schedule.html` and 308-redirects `/schedule.html` → `/schedule` (no
duplicate-content URLs). There is no catch-all rewrite: unknown URLs get
the branded `404.html` with a real 404 status.

Redirects:

- apex `trackratsprint.club/*` → `www.trackratsprint.club/*` (canonical host)
- `/2026-invitational` → `/invitational` (legacy URL)
- `/pr` and `/prs` → `/dashboard` (legacy URLs — the PR tracker is now the
  Dashboard's Personal Records tab)

Headers: security baseline on every response (`Strict-Transport-Security`,
`X-Content-Type-Options`, `X-Frame-Options: DENY`, CSP
`frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`),
immutable year-long cache on `/fonts/*` and `/js/vendor/*`, daily cache
on `og*.png`/`favicon.ico`.

## Supabase SDK (vendored)

The Supabase JS SDK (currently **2.108.1**) is **self-hosted** at
`js/vendor/supabase-js-<version>.bundle.mjs` — a dependency-inlined ESM
bundle plus its Node polyfills (`node-buffer.mjs`, `node-process.mjs`,
`node-events.mjs`, `node-tty.mjs`, `node-async_hooks.mjs`) — so no
third-party CDN executes code on the authenticated `/dashboard` page. Auth
uses the PKCE flow (`flowType: 'pkce'` in `js/supabase-config.js`).

To upgrade: fetch `https://esm.sh/@supabase/supabase-js@<ver>?bundle-deps&target=es2020`,
follow its stub to the `.bundle.mjs` build, rewrite every `/node/*.mjs`
import (recursively — polyfills import each other) to the local
`./node-*.mjs` files, verify no absolute or bare module specifiers remain
(string literals inside error messages can false-positive a grep), update
the import path in `js/supabase-config.js`, and test sign-in + a PR save
on production before calling it done.

## Photo gallery (Google Drive)

The Dashboard's **GALLERY tab** (`/dashboard#gallery` — the old
`/gallery` route redirects there) renders the club's shared Google Drive
photo folder as a mobile-first, **members-only** gallery — album chips
from subfolders, a swipeable lightbox, Drive-hosted video playback — and
lets members add photos from the page itself. Photos never leave Drive
(full quality preserved), and the site needs **no Google API key**: a
tiny Google Apps Script web app sits in front of the folder, listing it
and receiving uploads while running as the Google account that deployed
it.

**Access model**: viewing requires Google sign-in (Supabase) *and* an
email on the `members` allowlist. Members' browsers read a shared
`view_token` from Supabase (RLS: allowlisted members only) and send it
with every request; the Apps Script rejects requests without it. The
Drive folder itself stays link-shared ("Anyone with the link · Viewer")
so Drive's thumbnail CDN can serve images — so treat this as a club
gate, not secrecy: any individual file's Drive link still works for
whoever it's forwarded to, exactly like sharing from Drive directly.

```
dashboard.html ──sign-in────▶ Supabase: members allowlist → view_token
dashboard.html ──GET+token──▶ Apps Script /exec ──▶ folder listing (JSON)
dashboard.html ──POST+token─▶ Apps Script /exec ──▶ file created in the folder
<img> tiles ────────────────▶ drive.google.com/thumbnail?id=…  (Drive's public CDN)
<video> src ──same-origin──▶ /api/video?id=… ──▶ Drive download host (proxied 206 ranges)
```

Videos can't stream straight from Drive: Google 403s any cross-site
`<video>` or `fetch()` request to its download host (Fetch Metadata
gating), so the small zero-dependency Vercel function
[`api/video.js`](api/video.js) proxies the bytes same-origin with Range
support intact. It deploys automatically with the site — no extra setup
required — but see step 9 below to harden it.

### One-time setup (~10 minutes)

1. **Pick the Drive folder** members already use. Optional but nice:
   organize photos into subfolders — each subfolder becomes an album
   filter on the site. Do everything below **from the Google account that
   should own the photos** — website uploads are created by that account
   and count against its storage quota.
2. **Share the folder**: Share → *Anyone with the link · Viewer*. Drive's
   thumbnail CDN only serves link-public files; skip this and the gallery
   renders broken tiles.
3. **Create the script**: go to [script.new](https://script.new), name it
   "TRACKRAT Gallery", and paste in
   [`apps-script/gallery/Code.gs`](apps-script/gallery/Code.gs). Set
   `FOLDER_ID` (the long id in the folder's URL) and `VIEW_TOKEN` (a
   long random string — the same value goes into Supabase in step 7).
4. **Set the manifest**: Project Settings (gear) → check *Show
   "appsscript.json" manifest file in editor* → replace its contents with
   [`apps-script/gallery/appsscript.json`](apps-script/gallery/appsscript.json).
   It only pins the timezone + web-app access; OAuth scopes are
   auto-detected from the code (don't hand-list `oauthScopes` — a mangled
   scope string causes `Error 400: invalid_scope` at authorization).
5. **Deploy**: Deploy → New deployment → type **Web app** → *Execute as:*
   **Me** · *Who has access:* **Anyone** → Deploy, authorize when
   prompted, and copy the `.../exec` URL. On a personal account expect
   the *"Google hasn't verified this app"* interstitial — that's normal
   for a self-owned script: Advanced → *Go to TRACKRAT Gallery (unsafe)*
   → Allow.
6. **Wire the site**: paste the `/exec` URL into
   `GALLERY_CONFIG.scriptUrl` at the top of the GALLERY TAB block in
   `dashboard.html`'s `<script>` (optionally the folder's share link into
   `folderUrl`), and deploy.
7. **Create the Supabase tables** (SQL Editor → New query). Replace the
   placeholder token with the real `VIEW_TOKEN` value and add real member
   emails — **run only in the SQL editor, never commit real values** (this
   repo is public):

   ```sql
   -- Who can see the gallery. Deny-all RLS + no grants: clients never
   -- read this table directly — is_member() (security definer) does.
   create table if not exists public.members (
     email      text primary key,
     note       text,
     created_at timestamptz not null default now()
   );
   alter table public.members enable row level security;

   -- True when the signed-in user's email is on the allowlist.
   create or replace function public.is_member()
   returns boolean
   language sql
   stable
   security definer
   set search_path = public
   as $$
     select exists (
       select 1 from public.members
       where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     );
   $$;

   -- One row holding the gallery view token; readable by signed-in
   -- members only. The gallery page forwards it to the Apps Script.
   create table if not exists public.gallery_access (
     id         int primary key default 1 check (id = 1),
     view_token text not null
   );
   alter table public.gallery_access enable row level security;
   grant select on public.gallery_access to authenticated;
   create policy "gallery_access_members_only" on public.gallery_access
     for select to authenticated using (public.is_member());

   -- ⚠️ Placeholders — swap in the real token + member emails before
   -- running; keep them out of this repo.
   insert into public.gallery_access (id, view_token)
     values (1, 'REPLACE-WITH-THE-SAME-TOKEN-AS-VIEW_TOKEN')
     on conflict (id) do update set view_token = excluded.view_token;

   insert into public.members (email, note) values
     ('you@example.com', 'founder')
   on conflict (email) do nothing;
   ```

8. **Add members**: insert each member's Google email into `members`
   (Table Editor or SQL). Matching is case-insensitive. Removing a row
   revokes access on their next visit. (No new Supabase redirect URLs
   are needed — sign-in happens on `/dashboard`, which is already
   allowlisted.)
9. **Harden the video proxy** (do this as part of launch, not later):
   Vercel → Project → Settings → Environment Variables → add
   `GALLERY_VIEW_TOKEN` with the same value as `VIEW_TOKEN`, then
   redeploy. With it set, `/api/video` only answers requests carrying
   the member view token (the dashboard already sends it — zero client
   changes). Without it the proxy still works but falls back to a
   same-site Referer check, which any script can spoof — acceptable
   briefly, since the gate guards bandwidth, not secrecy (the Drive
   files are link-shared anyway). If you rotate the token, rotate all
   three copies together (Apps Script, Supabase, Vercel).

Until steps 5–7 are done the page shows sign-in but members see errors.

### Day-to-day

- **Adding photos**: `+ ADD PHOTOS` on the page (members only — no code
  to remember; pick an album or create a new one), or drop files straight
  into the Drive folder / Drive app. Page uploads appear immediately;
  files added directly in Drive show up within ~5 minutes (the script
  caches its listing for 5 minutes; page uploads bust the cache).
- **Adding / removing a member**: insert or delete their Google email in
  the Supabase `members` table. That's the whole membership system.
- **Rotating the view token**: update `view_token` in `gallery_access`
  AND `VIEW_TOKEN` in the Apps Script (publish a new version) — they
  must match.
- **Albums** are subfolders of the photo folder, one level deep. Files in
  the folder root appear under ALL only.
- **Videos** play in the lightbox in the site's own player, streamed
  through `/api/video` (with Drive's transcoding player as an automatic
  fallback). The in-page form accepts files up to ~40MB (Apps Script
  POST limit) — bigger videos go straight into the Drive folder.
- **Quality**: uploads are stored byte-for-byte — no client-side
  recompression, that's the point of using Drive.
- **Changing the script**: edit in the Apps Script editor, then Deploy →
  **Manage deployments** → pencil → Version: **New version**. Editing
  alone doesn't ship, and a brand-new deployment would mint a different
  `/exec` URL.

### Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Error 400: invalid_scope` when authorizing | A hand-edited `oauthScopes` list in the manifest got mangled (use the repo manifest — it has none; scopes auto-infer), or a Workspace admin blocks the Drive scope for unverified apps — deploy from the personal/club Gmail that owns the folder instead. |
| "Backend answered with something that isn't JSON" | Web app not deployed with access **Anyone** (it's returning a Google sign-in page). Redeploy with the right access. |
| Broken / blank tiles | Folder isn't shared *Anyone with the link · Viewer*. |
| Member sees "NOT ON THE LIST YET" after sign-in | Their Google email isn't in `members` (matching is case-insensitive), or the gallery SQL from setup step 7 hasn't been run. |
| "COULDN'T LOAD… unauthorized" or upload `UNAUTHORIZED` | `view_token` in Supabase's `gallery_access` ≠ `VIEW_TOKEN` in the *deployed* script version. Fix one, publish a new version if the script changed. |
| New Drive uploads not on the site | Listing cache — up to 5 min. Page uploads bust it instantly. |
| Script edits have no effect | Publish a **new version** via Manage deployments — saving the editor isn't deploying. |
| Videos open in Drive's player (doubled controls on iOS) instead of the site's | The `<video>` errored and fell back to the `/preview` iframe: `/api/video` isn't deployed (did `api/video.js` make it into the repo?), `GALLERY_VIEW_TOKEN` in Vercel doesn't match the member `view_token`, or the file's codec can't play on that device (the fallback is then correct — Drive transcodes it). |

## Local Development

```bash
npx serve .          # http://localhost:3000
# or
python -m http.server 3000
```

Visit pages by their `.html` filename locally — Vercel's clean-URL rewrites
don't apply to plain file servers.

## Deployment

Push to `main`. Vercel builds and deploys automatically. No build step; static
files plus the zero-config Node serverless function under `/api`
([`api/video.js`](api/video.js) — dependency-free, no `package.json`).

---

# Dashboard (`/dashboard`)

Authenticated member dashboard at `/dashboard` (Google sign-in). It has three
tabs (the nav's CLUB menu deep-links to them via `#PARTNERS` / `#gallery`):

- **Personal Records** (default) — log PRs across 16 events (below).
- **Partners** — member discount codes / perks, loaded from the Supabase
  `promotions` table (see [Promotions](#promotions) below). Visible only to
  signed-in users; the codes are not committed to this public repo.
- **Gallery** — the members-only club photo gallery (see
  [Photo gallery](#photo-gallery-google-drive) above; requires an email on
  the `members` allowlist).

The old `/pr` route 301-redirects to `/dashboard`.

## Personal Records tab

Members log PRs across 16 events:

**Run / distance** (stored as seconds): `100m`, `200m`, `400m`, `1mile`, `5K`,
`halfmarathon`, `marathon`.
**Lifts** (stored as pounds + sets + reps): `bench`, `deadlift`, `squat`,
`hangclean`, `pullups` (pull-ups allow 0 lbs = bodyweight; all other lifts
require a positive weight).
**Performance metrics** (stored as a single number in `value_metric`):
`verticaljump` (inches), `rsi` (unitless reactive strength index),
`peakpower` (CMJ, watts), `groundcontact` (seconds — only metric where
LOWER is better for the BEST badge).

Every entry can optionally include a free-form **note** (≤ 280 chars). The
"best PR" badge per event is computed client-side (min time / max weight).

Row Level Security restricts every read/write to `auth.uid() = user_id`.

## One-time setup

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) → New project.
- After it provisions, open **Project Settings → API** and copy the
  **Project URL** and **anon public** key.

### 2. Fill in `js/supabase-config.js`

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

The anon key is safe to commit publicly — access is constrained entirely by
the Row Level Security policies below.

### 3. Run the schema

Open **SQL Editor → New query** in the Supabase dashboard and run:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.prs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  event         text not null,
  value_seconds numeric(10,3),
  value_pounds  numeric(10,2),
  value_metric  numeric(10,3),
  sets          int,
  reps          int,
  notes         text,
  achieved_on   date not null,
  created_at    timestamptz not null default now()
);

alter table public.prs add constraint prs_event_check check (event in (
  '100m','200m','400m','1mile','5K','halfmarathon','marathon',
  'bench','deadlift','squat','hangclean','pullups',
  'verticaljump','rsi','peakpower','groundcontact'
));

alter table public.prs add constraint value_matches_event check (
  (event in ('100m','200m','400m','1mile','5K','halfmarathon','marathon')
    and value_seconds is not null and value_pounds is null
    and value_seconds > 0 and sets is null and reps is null)
  or
  (event in ('bench','deadlift','squat','hangclean')
    and value_pounds is not null and value_seconds is null
    and value_pounds > 0)
  or
  (event = 'pullups'
    and value_pounds is not null and value_seconds is null
    and value_pounds >= 0)
  or
  (event in ('verticaljump','rsi','peakpower','groundcontact')
    and value_metric is not null
    and value_seconds is null and value_pounds is null
    and sets is null and reps is null
    and value_metric > 0)
);

alter table public.prs add constraint notes_length check (notes is null or length(notes) <= 280);
alter table public.prs add constraint sets_positive  check (sets is null or sets > 0);
alter table public.prs add constraint reps_positive  check (reps is null or reps > 0);

create index if not exists prs_user_event_idx
  on public.prs (user_id, event, achieved_on desc);

alter table public.prs enable row level security;
grant select, insert, update, delete on public.prs to authenticated;

create policy "prs_select_own" on public.prs for select using (auth.uid() = user_id);
create policy "prs_insert_own" on public.prs for insert with check (auth.uid() = user_id);
create policy "prs_update_own" on public.prs for update using (auth.uid() = user_id);
create policy "prs_delete_own" on public.prs for delete using (auth.uid() = user_id);
```

### 3b. Promotions table (Dashboard → Promotions tab)

Member promotions are stored in Supabase — **not** in this public repo — so the
codes stay behind the sign-in wall. Run this once in the SQL editor. Read access
is granted to the `authenticated` role only (any signed-in user), so the anon
key alone can't read the codes.

```sql
create table if not exists public.promotions (
  id          uuid primary key default gen_random_uuid(),
  partner     text not null,          -- e.g. "Example Partner"
  offer       text not null,          -- "15% off"
  details     text,                   -- supporting line under the offer
  code        text,                   -- discount code, e.g. "PARTNERXX" (nullable; real codes live only in Supabase)
  redemption  text,                   -- how to redeem
  location    text,                   -- address or display text for the WHERE line
  url         text,                   -- optional link for the WHERE line (maps / website)
  logo        text,                   -- asset path under /promos, e.g. "/promos/example.png" (use raster: PNG/WEBP/JPG)
  logo_bg     text,                   -- optional CSS color for the logo tile (dark logos need a light tile)
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.promotions enable row level security;
grant select on public.promotions to authenticated;
create policy "promotions_select_auth" on public.promotions
  for select to authenticated using (active);

-- ⚠️  Do NOT paste real promotions into this file. This repo is PUBLIC, so any
-- codes/offers/terms committed here are world-readable on GitHub — which defeats
-- the whole point of gating promotions behind sign-in. Keep the real INSERT in a
-- private place (password manager / internal doc) and run it ONLY in the Supabase
-- SQL editor. `sort_order` controls display order (ascending).
--
-- Format (placeholder data — replace before running, do not commit real values):
insert into public.promotions (partner, offer, details, code, redemption, location, url, logo, logo_bg, sort_order) values
  ('Example Partner', '10% off',
   'When you mention you''re with TRACKRAT Sprint Club.',
   'PARTNERXX', 'Show this code / mention the club at checkout.',
   '123 Example St, Austin, TX', 'https://example.com',
   '/promos/example.svg', '#FFFFFF', 1);
```

To add/edit a promotion: `insert`/`update` a row in the Supabase dashboard (set
`active = false` to hide one) — **never commit real codes/offers to this repo.**
If it has a logo, commit the image under `/promos/` (logo files are inherently
public on the deployed site) and point `logo` at it. **Use a raster format
(PNG/WEBP/JPG), not SVG** — SVGs used as `<img>` can fail to size/render in some
browsers (notably iOS Safari) and show as blank. Dark logos that need to sit on
the dark dashboard get a matching dark `logo_bg` (e.g. WellSport uses `#080808`);
logos meant for a light background get `logo_bg: '#FFFFFF'`.

### 3c. Waivers tables (Dashboard → Waiver tab, `/waiver`)

Two tables. `waiver_documents` registers each published version of the waiver;
`waivers` is the append-only signature log.

**The signature log is immutable from the client, by construction.** There is no
`update` and no `delete` policy, and the client is granted only `select` and a
*column-level* `insert`. Both layers matter, and they fail differently:

| | What happens on an `update`/`delete` |
|---|---|
| Grant omitted | dies at the privilege check, `42501 permission denied`, **before** RLS runs |
| Policy absent, grant present | RLS finds zero rows to update: **succeeds, affects 0 rows, returns 204** |

The second is an observability hole, not a data hole, but it is a landmine: the
day someone adds a permissive `UPDATE` policy, or opens the table in Supabase's
**Table Editor UI (which auto-grants `all`)**, edits start working silently.
Keep both layers.

Note also that the **table owner (the SQL editor) bypasses RLS**. The guarantee
is against the client, not against your own fat fingers. The optional trigger at
the end is the only thing that closes that.

```sql
-- Registry of published waiver documents. The blank PDF is committed at a
-- version-stamped path under /waiver-docs and NEVER overwritten, so a signed
-- waiver can always be re-derived if Storage is ever lost.
--   shasum -a 256 waiver-docs/trackrat-waiver-v1-2026.pdf
create table if not exists public.waiver_documents (
  version      text primary key,               -- 'v1-2026'; bump only when the legal text changes
  sha256       text not null,                  -- lowercase hex of the PDF's exact bytes
  pdf_path     text not null,                  -- '/waiver-docs/trackrat-waiver-v1-2026.pdf'
  title        text not null,
  effective_on date not null,
  is_current   boolean not null default false, -- exactly one true row (partial unique index below)
  created_at   timestamptz not null default now(),
  unique (version, sha256)                     -- target of the composite FK from public.waivers
);

alter table public.waiver_documents add constraint waiver_documents_sha256_hex
  check (sha256 ~ '^[0-9a-f]{64}$');
alter table public.waiver_documents add constraint waiver_documents_version_clean
  check (version = lower(btrim(version)) and length(version) between 2 and 32);

-- At most one current version: a partial unique index, so only true rows collide.
create unique index if not exists waiver_documents_one_current_idx
  on public.waiver_documents (is_current) where is_current;

alter table public.waiver_documents enable row level security;
grant select on public.waiver_documents to authenticated;
create policy "waiver_documents_select_auth" on public.waiver_documents
  for select to authenticated using (true);

-- Signed waivers. APPEND ONLY.
-- Deliberately NOT gated on public.is_member(): a first-timer is not on the
-- allowlist yet, and signing is the prerequisite to showing up, not a perk.
create table if not exists public.waivers (
  id                    uuid primary key default gen_random_uuid(),  -- client-generated; also names the Storage object
  user_id               uuid not null default auth.uid(),            -- no FK to auth.users ON PURPOSE, see below
  signer_email          text default lower(auth.jwt() ->> 'email'),
  waiver_version        text not null,
  waiver_sha256         text not null,                               -- verified by the composite FK below
  legal_name            text not null,                               -- full legal name of the ATHLETE
  date_of_birth         date not null,                               -- of the athlete; drives the guardian rule
  signed_by             text not null,                               -- 'self' | 'guardian'
  guardian_name         text,                                        -- required iff the athlete is a minor
  guardian_relationship text,
  signature_png         text not null,                               -- drawn signature, PNG data URL
  conduct_version       text not null,                               -- code of conduct agreed to, e.g. 'conduct-v1-2026'
  conduct_sha256        text not null,                               -- hash of the conduct document as displayed
  attested_conduct      boolean not null,                            -- "I agree to follow the club rules"
  attested_waiver       boolean not null,                            -- "I agree to the waiver"
  attested_capacity     boolean not null,                            -- 18+, or guardian with authority
  signed_pdf_path       text,                                        -- '{user_id}/{id}.pdf'; null if generation failed
  user_agent            text default ((nullif(current_setting('request.headers', true), ''))::json ->> 'user-agent'),
  signer_ip             text default coalesce(
                          (nullif(current_setting('request.headers', true), ''))::json ->> 'cf-connecting-ip',
                          (nullif(current_setting('request.headers', true), ''))::json ->> 'x-forwarded-for'
                        ),                                           -- advisory only: XFF is client-appendable
  signed_at             timestamptz not null default now(),          -- NOT client-insertable (see the column grant)
  unique (user_id, waiver_version)                                   -- one signature per version; client treats 23505 as success
);

-- Pins each signature to the exact document bytes. Replace the PDF without
-- registering it and the next insert fails 23503 instead of silently recording
-- new bytes: fail closed. RESTRICT also blocks retro-editing a signed version.
alter table public.waivers add constraint waivers_document_fkey
  foreign key (waiver_version, waiver_sha256)
  references public.waiver_documents (version, sha256)
  on update restrict on delete restrict;

alter table public.waivers add constraint waivers_signed_by_check
  check (signed_by in ('self', 'guardian'));

-- Minority is DERIVED from date_of_birth, never client-asserted: a client-supplied
-- is_minor flag would make the guardian requirement decorative. timezone(text,
-- timestamptz) and date + interval are both IMMUTABLE, so this is legal in a CHECK
-- where anything calling now() would be rejected outright. Leap-day birthdays clamp
-- to Feb 28, i.e. adult one day early (~1 person-day per 1460 signers), which is
-- preferred over '18 years 1 day' giving every 18-year-old a guardian prompt on
-- their actual birthday.
alter table public.waivers add constraint waivers_guardian_when_minor check (
  case
    when (date_of_birth + interval '18 years') > timezone('America/Chicago', signed_at)
      then signed_by = 'guardian'
           and guardian_name is not null and length(btrim(guardian_name)) > 0
           and guardian_relationship is not null
    else signed_by = 'self'
         and guardian_name is null
         and guardian_relationship is null
  end
);

-- All three agreements are required, so the only legal value is true. Storing
-- them keeps the row self-describing: it shows what was actually affirmed.
-- They are three SEPARATE columns because RRCA guidance requires the code of
-- conduct to be its own agreement, not folded into the liability waiver.
alter table public.waivers add constraint waivers_attested
  check (attested_conduct and attested_waiver and attested_capacity);

alter table public.waivers add constraint waivers_dob_sane
  check (date_of_birth > date '1900-01-01'
         and date_of_birth <= timezone('America/Chicago', signed_at)::date);
alter table public.waivers add constraint waivers_signature_png_shape
  check (signature_png like 'data:image/png;base64,%' and length(signature_png) <= 200000);
alter table public.waivers add constraint waivers_name_lengths
  check (length(btrim(legal_name)) between 2 and 120
         and (guardian_name is null or length(guardian_name) <= 120)
         and (guardian_relationship is null or length(guardian_relationship) <= 60));
alter table public.waivers add constraint waivers_pdf_path_own
  check (signed_pdf_path is null or signed_pdf_path like user_id::text || '/%');

create index if not exists waivers_signed_at_idx on public.waivers (signed_at desc);

alter table public.waivers enable row level security;
grant select on public.waivers to authenticated;
-- COLUMN-level insert. This is what makes signed_at, user_id, signer_email,
-- user_agent and signer_ip unforgeable rather than merely conventional: a
-- column default applies only when the column is OMITTED, and PostgREST will
-- happily forward an explicit signed_at from devtools. A CHECK cannot help
-- (check (signed_at <= now()) is rejected: CHECK must be IMMUTABLE).
-- Keep this list in exact sync with the client's insert payload. A violation
-- reports "permission denied for table waivers" and does NOT name the column.
grant insert (id, waiver_version, waiver_sha256, legal_name, date_of_birth,
              signed_by, guardian_name, guardian_relationship, signature_png,
              conduct_version, conduct_sha256, attested_conduct,
              attested_waiver, attested_capacity, signed_pdf_path)
  on public.waivers to authenticated;

create policy "waivers_select_own" on public.waivers
  for select to authenticated using (auth.uid() = user_id);
create policy "waivers_insert_own" on public.waivers
  for insert to authenticated with check (auth.uid() = user_id);
-- No update policy and no delete policy: rows are immutable from the client.

-- Private bucket for the generated signed PDFs and signature images.
-- Do NOT grant on storage.objects and do NOT enable RLS on it: the storage
-- schema is owned by supabase_storage_admin, RLS is already on, and
-- `authenticated` already holds the table privileges. (The "Supabase doesn't
-- auto-grant" rule above does not apply here.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('waivers', 'waivers', false, 5242880,
          array['application/pdf', 'image/png'])
  on conflict (id) do nothing;

create policy "waivers_object_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'waivers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "waivers_object_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'waivers' and (storage.foldername(name))[1] = auth.uid()::text);
-- No update policy: that is what blocks an upsert from overwriting a signed PDF.

-- ⚠️  Replace the hash with the real one before running. Never commit signed
-- waiver data to this PUBLIC repo (same rule as the promotions block above).
insert into public.waiver_documents (version, sha256, pdf_path, title, effective_on, is_current)
  values ('v1-2026', 'REPLACE-WITH-shasum-a-256-OF-THE-COMMITTED-PDF',
          '/waiver-docs/trackrat-waiver-v1-2026.pdf',
          'TRACKRAT Waiver and Release of Liability', '2026-09-07', true)
  on conflict (version) do nothing;
```

**Why there is no foreign key to `auth.users`.** `on delete cascade` would
delete the liability evidence along with the account; `restrict` would block
account deletion entirely; `set null` would hide the row from its own RLS
policy. Dropping the FK is standard for an append-only audit log and costs
nothing, because `with check (auth.uid() = user_id)` already prevents a bogus
uid (the uid comes from a signed JWT). This is a deliberate deviation from the
`prs` table above; do not "fix" it. The `signer_email` snapshot keeps the row
self-identifying without joining `auth.users`.

**Optional hardening.** The block above is complete against the client, but the
SQL editor runs as the table owner and bypasses RLS. For an evidence table that
is worth closing:

```sql
create or replace function public.waivers_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'public.waivers is append-only (attempted % on %)', tg_op, old.id;
end;
$$;
create trigger waivers_no_change
  before update or delete on public.waivers
  for each row execute function public.waivers_immutable();
```

Escape hatch when you legitimately need to remove a botched row:
`alter table public.waivers disable trigger waivers_no_change;`, then re-enable
it. This works cleanly *because* there is no `auth.users` FK; with
`on delete cascade` still in place the trigger would make deleting an auth user
fail outright.

**Storage note.** Objects are written at `{user_id}/{waiver_id}.pdf` and
`{user_id}/{waiver_id}-signature.png`. The client uploads *before* inserting the
row: an orphaned object is inert and cleanable, whereas a row pointing at a
missing file is a broken link that looks like data loss. Signed URLs are minted
at view time with `createSignedUrl` and never stored.

### Adding a new waiver or code-of-conduct version

Both documents are version-pinned and never overwritten, because signed rows are
tied to their exact bytes.

1. Edit the source text and rebuild both the PDF and its HTML transcript from it
   (they are generated together so the transcript cannot drift from the PDF).
   Commit them under `/waiver-docs/` with a **new** filename.
2. `shasum -a 256 waiver-docs/<new file>`
3. Insert the `public.waiver_documents` row and flip `is_current`.
4. Add the entry to `js/waiver-config.js` and bump `CURRENT_WAIVER_VERSION`
   (or `CURRENT_CONDUCT_VERSION`), including the new hash and the stamp
   coordinates. Load `/waiver?stamp=debug` to tune coordinates against the new
   PDF without touching code.

Existing signatures stay valid and stay visible on the dashboard; members are
prompted to sign the new version.

### 4. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com):

- Pick or create a project. Open **APIs & Services → OAuth consent screen**
  and fill in the basics (app name, support email). External user type.
- **APIs & Services → Credentials → Create credentials → OAuth client ID →
  Web application**.
- **Authorized JavaScript origins**:
  - `https://trackratsprint.club`
  - `https://www.trackratsprint.club`
  - `http://localhost:3000` (for local dev)
- **Authorized redirect URIs**:
  - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
- Copy the **Client ID** and **Client secret**.

In Supabase:

- **Authentication → Providers → Google** — toggle on, paste Client ID +
  secret, save.
- **Authentication → URL Configuration**:
  - **Site URL**: `https://www.trackratsprint.club`
  - **Redirect URLs** (add each):
    - `https://www.trackratsprint.club/dashboard`
    - `https://trackratsprint.club/dashboard`
    - `http://localhost:3000/dashboard`

  > Sign-in redirects to `/dashboard` (`redirectTo` in `dashboard.html`). If
  > these `/dashboard` URLs aren't in the allowlist, Google sign-in falls back
  > to the Site URL instead of returning to the dashboard.

### 5. Deploy

Push to `main`. Vercel serves `/dashboard` from `dashboard.html` via
`cleanUrls`, and 301-redirects the legacy `/pr` and `/prs` to `/dashboard`.

## Adding a new event

Three places to update — keep them in sync:

1. **SQL** — extend the `prs_event_check` and `value_matches_event` constraints
   in your Supabase database (write an `alter table ... drop constraint ... add
   constraint ...` migration in the SQL editor).
2. **`dashboard.html`** — add to `RUN_EVENTS` or `LIFT_EVENTS`, plus
   `EVENT_LABELS` and `EVENT_ORDER`.
3. **`dashboard.html`** — add a chip button to the `#eventGrid` markup.

## Why is the anon key in a public repo OK?

Supabase's anon key is *designed* to be public — it's the same model as
Firebase config keys or Stripe publishable keys. Security comes from the RLS
policies above, not from key secrecy. The only key that must never ship to
the client is `service_role`, which bypasses RLS. We don't use it anywhere
in this repo.
