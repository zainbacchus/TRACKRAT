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
- `/invitational` — 2026 Invitational event page (RSVP via Sweatpals)
- `/pr` — personal record tracker (Google sign-in, per-user data via Supabase)

> Note: the PR page is `/pr` (singular). Earlier versions used `/prs` — if you
> see that anywhere in the codebase, it's stale and should be `/pr`.

## Architecture

| Concern | Choice |
|---|---|
| Hosting | Vercel (static + edge runtime for `api/`) |
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
├── invitational.html       # /invitational          — 2026 Invitational (Sweatpals RSVP)
├── pr.html                 # /pr                    — PR tracker (Google sign-in)
├── 404.html                # branded 404 (served automatically by Vercel)
├── api/
│   └── next-event.js       # Edge function: next upcoming event (public API; no page consumes it)
├── js/
│   ├── supabase-config.js  # Shared Supabase client (URL + anon key)
│   └── vendor/             # Vendored Supabase JS SDK (dep-inlined ESM bundle + node-*.mjs polyfills)
├── fonts/                  # Self-hosted webfonts (woff2, latin subset) + OFL licenses
│   ├── fugaz-one-latin.woff2
│   ├── ibm-plex-mono-{400,500,600,700}-latin.woff2
│   └── LICENSE-*.txt
├── og.png                  # 1200×630 Open Graph image (shared by all pages)
├── vercel.json             # cleanUrls, security headers, redirects, cache headers
├── robots.txt              # Crawl rules (/pr handled by noindex meta, NOT Disallow)
├── sitemap.xml             # Public-page sitemap (excludes /pr)
├── llms.txt                # LLM-facing site description
├── favicon.ico
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
`/2026-invitational` → `/invitational`, `/prs` → `/pr`.

Headers: security baseline on `/(.*)`(nosniff, `X-Frame-Options: DENY`,
CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'none'`,
Referrer-Policy, Permissions-Policy); immutable year cache on `/fonts/*`
and `/js/vendor/*`; daily cache on `og.png` + `favicon.ico`. Don't add a
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
authenticated /pr page. To upgrade: fetch a dependency-inlined bundle of
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
- Open Graph + Twitter Card meta tags pointing at `/og.png`.
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

`pr.html` carries `noindex, follow`; it's a private dashboard. It is
deliberately NOT `Disallow`ed in robots.txt — blocking crawl would prevent
Google from ever seeing the noindex meta.

`schedule.html` ships `Event` JSON-LD for both weekly sessions
(`eventSchedule`, weekly recurrence). The **Sunday** session carries the
full street address (4401 Tilley St, Austin TX 78723) — it's a fixed,
already-public location and the address is required for Google's
local/event surfaces. The **Thursday** session stays city-level because
its location genuinely varies (accuracy beats completeness — don't give
it a fake fixed address).

The OG image is rendered in actual Fugaz One (black wordmark on brand
orange `#FF4D1F`, 1200×630, palette-optimized PNG).

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

`schedule.html`, `brand.html`, and `pr.html` use a fixed 8-lane track backdrop:

```html
<div class="track-lanes">
  <div class="lane"></div> <!-- ×8 -->
</div>
```

`index.html` and `invitational.html` use the solid orange / black backgrounds
without lanes.

### Nav

**Byte-identical across all pages** (intentionally duplicated — no framework).
There is **no HOME link** — the `TRACKRAT` wordmark on the left is the home
link everywhere. The auth slot is **not** state-aware: `[ PERSONAL RECORDS ]`
shows regardless of session; the `/pr` page handles signed-out vs signed-in.

Desktop order: `SHOP · SCHEDULE · BRAND · 2026 INVITATIONAL · PERSONAL RECORDS`

All nav items are flat links (no dropdowns). An "Events" dropdown grouping
existed briefly but was removed; `2026 INVITATIONAL` is a top-level link.

Mobile menu is a full-screen overlay with its own **header** — the TRACKRAT
wordmark (→ home) on the left and an explicit **close X** (`#menuClose`) on the
right. The X lives INSIDE the overlay on purpose: the old hamburger-morph X was
buried by a z-index stacking trap (nav's `z-index:100` context capped the
toggle below the `150` overlay). Don't move the close control back into `<nav>`.
The hamburger (`#menuToggle`) only opens; `#menuClose`, tapping a link, and
Escape all close. Focus moves to the X on open, back to the hamburger on close.
Stagger fade-ins run on `.mobile-menu-links > *:nth-child(1…5)`.

## Personal Records (`/pr`)

Authenticated dashboard backed by Supabase.

### Events

**Run / distance** (stored as seconds, `numeric(10,3)`):
`100m`, `200m`, `400m`, `1mile`, `5K`, `halfmarathon`, `marathon`.

**Lifts** (stored as pounds + sets + reps):
`bench`, `deadlift`, `squat`, `hangclean`, `pullups` (pull-ups allow
`value_pounds = 0` for bodyweight; every other lift requires > 0).

**Performance metrics** (single number in `value_metric`, configured in
the `METRIC_EVENTS` object in pr.html — unit label, input step,
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

### Client flow (`pr.html`)

1. Import shared client: `import { supabase } from '/js/supabase-config.js'`.
2. On load, call `supabase.auth.getSession()`.
   - No session → show the sign-in card.
   - Session → show the user strip, PR form, and history list.
3. `signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/pr }})`.
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
`innerHTML`. The helper is already defined in `pr.html`.

## API: `api/next-event.js`

Edge runtime function (`export const config = { runtime: 'edge' }`) that
returns the next upcoming Sunday/Thursday event for the home page. Stateless,
no DB access. America/Chicago timezone is hard-coded.

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
   menu, track lanes if applicable, **full SEO meta block**, **the two
   `<link rel="preload" as="font" ... crossorigin>` tags**, and **all five
   `@font-face` declarations** at the top of `<style>`).
2. Add a `/newpage` rewrite to `vercel.json`.
3. Add the link to **every** page's nav (desktop `.nav-center` and mobile
   `.mobile-menu`) — and update the `.mobile-menu.is-open a:nth-child(N)`
   stagger delays accordingly.
4. If indexable, add to `sitemap.xml` with a `<lastmod>`. If user-private,
   set `<meta name="robots" content="noindex, follow">` in the page head —
   and do NOT also `Disallow` it in robots.txt (a crawl block would stop
   Google from ever seeing the noindex).

### Adding a new PR event

Three places to keep in sync:

1. **SQL** — extend the `prs_event_check` and `value_matches_event`
   constraints in Supabase (write a migration as `alter table ... drop
   constraint ... add constraint ...`).
2. **`pr.html`** — add to `RUN_EVENTS` or `LIFT_EVENTS`, plus `EVENT_LABELS`
   and `EVENT_ORDER`.
3. **`pr.html`** — add a chip button to the `#eventGrid` markup.

### Editing the PR dashboard

- All UI logic lives in `pr.html`. Don't try to extract components.
- Database changes: write the migration in `README.md`'s schema section, run
  it in the Supabase SQL editor, and call it out in commit messages.
- Migrations are manual — there's no migration tool.

### Deployment

Push to the default branch (`main`) → Vercel auto-deploys. No build step.
Static files + edge functions only.

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
5. **Keep the nav in lockstep across all five pages.** A change to nav
   markup or stagger delays must be applied everywhere or pages will drift.
6. **For PR features, trust RLS.** Don't add server-side authorization logic
   — it's already in Postgres. The client talks to Supabase directly.
7. **Mobile-first.** Test at 375px before declaring done.
8. **SEO meta is not optional.** Every new public page needs a unique title,
   canonical, OG, Twitter card, and geo meta. Copy the head block from
   `schedule.html` as a starting point.
9. **Address policy: the fixed Sunday location (4401 Tilley St) IS
   published in JSON-LD, llms.txt, and visible copy** — it's already
   public (schedule page, .ics files, Google Business Profile) and the
   address is what makes the club eligible for Google's local/event
   surfaces. The Thursday location stays city-level everywhere because it
   genuinely varies week to week. Keep structured data, GBP, and visible
   copy consistent with each other (NAP consistency).
10. **Don't use `opacity` for "dim" text on the orange background.** Black
    at low opacity composites with `#FF4D1F` to a muddy mid-orange that
    fails WCAG AA contrast. On `index.html`, use the solid color
    `#1a0700` (or darker) instead — same visual feel, ~5.9:1 contrast.
    On the black-background pages (`schedule`/`brand`/`pr`) white text is
    fine.
11. **Don't reintroduce Google Fonts.** Fonts are self-hosted in `/fonts/`
    and preloaded per page. Reverting to `fonts.googleapis.com/css2?...`
    brings back render-blocking + a network-dependency chain that
    Lighthouse will flag. If you need a new weight, fetch the matching
    woff2 from Google with a modern UA and drop it in `/fonts/`.
