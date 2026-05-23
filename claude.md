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
- `/2026-invitational` — event placeholder
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
| Build step | None — plain HTML/CSS/JS, ES modules from esm.sh |

There is intentionally no framework, bundler, or `package.json`. Each page
holds its own styles and scripts so it can be read top-to-bottom without
chasing imports. The only shared module is the Supabase client.

## File Structure

```
TRACKRAT/
├── index.html              # /                      — landing
├── schedule.html           # /schedule              — weekly schedule + .ics
├── brand.html              # /brand                 — brand guide
├── invitational.html       # /2026-invitational
├── pr.html                 # /pr                    — PR tracker (Google sign-in)
├── api/
│   └── next-event.js       # Edge function: returns the next upcoming event
├── js/
│   └── supabase-config.js  # Shared Supabase client (URL + anon key)
├── og.png                  # 1200×630 Open Graph image (shared by all pages)
├── middleware.js           # Vercel middleware
├── vercel.json             # Clean-URL rewrites
├── robots.txt              # Disallows /pr from crawlers
├── sitemap.xml             # Public-page sitemap (excludes /pr)
├── llms.txt                # LLM-facing site description
├── favicon.ico
├── README.md               # User-facing setup docs
└── CLAUDE.md               # This file
```

`supabase-schema.sql` was removed from the repo intentionally — the production
DB is already provisioned. The canonical schema lives in the **Run the
schema** section of `README.md`. If you make DB changes, update that block
*and* write a migration snippet in your PR description.

## Routing

`vercel.json` rewrites clean URLs to the underlying `.html` files:

```json
{ "source": "/schedule",          "destination": "/schedule.html" }
{ "source": "/brand",             "destination": "/brand.html" }
{ "source": "/2026-invitational", "destination": "/invitational.html" }
{ "source": "/pr",                "destination": "/pr.html" }
{ "source": "/(.*)",              "destination": "/index.html" }
```

The fallback to `/index.html` is the SPA-style catch-all. Locally (no Vercel)
visit `*.html` paths directly.

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
- A `SportsClub` JSON-LD block. **The meet-up street address is intentionally
  omitted from JSON-LD.** It lives only in human-visible copy on `/schedule`.
- A `FAQPage` JSON-LD block with 6 questions — high signal for Google AI
  Overviews, ChatGPT Search, Perplexity, etc.

`pr.html` carries `noindex, follow`; it's a private dashboard. Also
disallowed in `robots.txt`.

The OG image is currently rendered programmatically from brand parameters
(orange `#FF4D1F` background, black wordmark, Impact as a proxy for Fugaz
One since Fugaz One isn't installed on the build host). To replace with a
properly-rendered version, save a 1200×630 PNG over `og.png` at the repo
root.

## Shared Patterns Across Pages

### Design tokens

```css
--orange: #FF4D1F;       /* primary brand */
--black:  #000000;
--white:  #FFFFFF;
--font:   'IBM Plex Mono', monospace;
--lane-color: rgba(255, 255, 255, 0.12);  /* track-lane background */
```

Typography pairs **Fugaz One** (display) with **IBM Plex Mono** (UI / body),
loaded from Google Fonts.

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

Identical structure on every page. The auth slot is **not** state-aware —
`[ PERSONAL RECORDS ]` (or `[ PRS ]` / `[ PR ]` in older copies) shows
regardless of session. The `/pr` page itself handles signed-out vs signed-in.

Desktop order: `HOME · SHOP · SCHEDULE · BRAND · 2026 INVITATIONAL · PERSONAL RECORDS`

Mobile menu has the same items with staggered fade-in transitions on
`a:nth-child(1)…(7)`. When adding or removing nav items, update the stagger
delays so the animation stays consistent.

### Mobile menu toggle

Hamburger → close (×) animation via three rotating `<span>`s. The toggle
script is duplicated per page; it's small enough that DRYing it isn't worth
the indirection.

## Personal Records (`/pr`)

Authenticated dashboard backed by Supabase.

### Events

**Run / distance** (stored as seconds, `numeric(10,3)`):
`100m`, `200m`, `400m`, `1mile`, `5K`, `halfmarathon`, `marathon`.

**Lifts** (stored as pounds + sets + reps):
`bench`, `deadlift`, `squat`, `hangclean`.

### Data model

Single `prs` table:

```
prs (
  id            uuid pk,
  user_id       uuid references auth.users on delete cascade,
  event         text,                  -- check: whitelist above
  value_seconds numeric(10,3),         -- run events
  value_pounds  numeric(10,2),         -- lift events
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
   menu, track lanes if applicable, **full SEO meta block**).
2. Add a `/newpage` rewrite to `vercel.json`.
3. Add the link to **every** page's nav (desktop `.nav-center` and mobile
   `.mobile-menu`) — and update the `.mobile-menu.is-open a:nth-child(N)`
   stagger delays accordingly.
4. If indexable, add to `sitemap.xml` with a `<lastmod>`. If user-private,
   add to `robots.txt` as `Disallow:` *and* set `<meta name="robots"
   content="noindex, follow">` in the page head.

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
9. **The meet-up street address is intentionally not in JSON-LD or
   `llms.txt`.** It lives only on the human-visible `/schedule` page. Keep
   it that way unless the brand owner says otherwise.
