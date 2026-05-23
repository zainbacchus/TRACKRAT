# Claude.md — TRACKRAT Project Guide

Context for AI assistants working on the TRACKRAT codebase.

## Project Overview

TRACKRAT is a static multi-page marketing site for the TRACKRAT Sprint Club
(Austin, TX) at **trackratsprint.club**, plus a small authenticated PR
("personal record") tracking dashboard.

Pages:

- `/` — landing
- `/schedule` — weekly schedule with .ics calendar export
- `/brand` — brand guide
- `/2026-invitational` — event placeholder
- `/prs` — personal record tracker (Google sign-in, per-user data via Supabase)

## Architecture

| Concern | Choice |
|---|---|
| Hosting | Vercel (static + edge runtime for `api/`) |
| Pages | One self-contained HTML file per route (inline CSS + JS) |
| Auth | Supabase Auth (Google OAuth provider) |
| Database | Supabase Postgres with Row Level Security |
| Build step | None — plain HTML/CSS/JS, ES modules from esm.sh |

There is intentionally no framework, bundler, or package.json. Each page
holds its own styles and scripts so it can be read top-to-bottom without
chasing imports. The only shared module is the Supabase client.

## File Structure

```
TRACKRAT/
├── index.html              # /            — landing
├── schedule.html           # /schedule    — weekly schedule + .ics export
├── brand.html              # /brand       — brand guide
├── invitational.html       # /2026-invitational
├── prs.html                # /prs         — PR tracker (Google sign-in)
├── api/
│   └── next-event.js       # Edge function: returns the next upcoming event
├── js/
│   └── supabase-config.js  # Shared Supabase client (URL + anon key)
├── supabase-schema.sql     # `prs` table + RLS policies (run once)
├── middleware.js           # Vercel middleware (if any rewrites/headers)
├── vercel.json             # Rewrites for clean URLs
├── robots.txt              # Disallows /prs from crawlers
├── sitemap.xml             # Public-page sitemap (excludes /prs)
├── llms.txt                # LLM-facing site description
├── favicon.ico
├── README.md               # User-facing setup docs
└── claude.md               # This file
```

## Routing

`vercel.json` rewrites clean URLs to the underlying `.html` files:

```json
{ "source": "/schedule", "destination": "/schedule.html" }
{ "source": "/brand", "destination": "/brand.html" }
{ "source": "/2026-invitational", "destination": "/invitational.html" }
{ "source": "/prs", "destination": "/prs.html" }
{ "source": "/(.*)", "destination": "/index.html" }
```

The fallback to `/index.html` is the SPA-style catch-all. Locally (no Vercel)
visit `*.html` paths directly.

## Shared Patterns Across Pages

Each marketing page follows the same skeleton — match it when adding pages.

### Design tokens (CSS variables)

```css
--orange: #FF4D1F;      /* primary brand */
--black:  #000000;
--white:  #FFFFFF;
--font:   'IBM Plex Mono', monospace;
--lane-color: rgba(255, 255, 255, 0.12);  /* track-lane background */
```

Typography pairs **Fugaz One** (display) with **IBM Plex Mono** (UI / body),
loaded from Google Fonts.

### Track-lane background

`schedule.html`, `brand.html`, and `prs.html` all use a fixed 8-lane track
backdrop:

```html
<div class="track-lanes">
  <div class="lane"></div> <!-- ×8 -->
</div>
```

`index.html` and `invitational.html` use the solid orange or black
backgrounds without lanes.

### Nav

Identical structure on every page. The auth slot is **not** state-aware —
`[ PRS ]` shows regardless of session. The `/prs` page itself handles the
signed-out vs signed-in view.

Desktop nav order: `HOME · SHOP · SCHEDULE · BRAND · 2026 INVITATIONAL · PRS`
Mobile menu has the same items, with staggered fade-in transitions on
`a:nth-child(1)…(7)`. When adding/removing nav items, update the stagger
delays so the animation stays consistent.

### Mobile menu toggle

Hamburger → close (×) animation via three rotating `<span>`s. The toggle
script is duplicated per page; it's small enough that DRYing it isn't worth
the indirection.

## Personal Records (/prs)

Authenticated dashboard backed by Supabase.

### Data model (`supabase-schema.sql`)

Single `prs` table:

```sql
prs (
  id           uuid pk,
  user_id      uuid references auth.users on delete cascade,
  event        text check (event in (
                 '100m','200m','400m','1mile','5K',
                 'bench','deadlift','squat')),
  value_seconds numeric,  -- run events
  value_pounds  numeric,  -- lift events
  achieved_on   date,
  created_at    timestamptz default now()
)
```

A check constraint enforces that **exactly one** of `value_seconds` /
`value_pounds` is populated, matching the event category.

RLS is enabled with four policies (`select`, `insert`, `update`, `delete`)
each scoped to `auth.uid() = user_id`. The anon key shipped to the client
can only see/touch rows owned by the signed-in user.

### Why the anon key is safe to commit

Supabase's anon key is *designed* to be public. Security is enforced by the
RLS policies above — not by key secrecy. The only key that must never ship
to the client is `service_role`, which bypasses RLS. We don't use it.

### Client flow (`prs.html`)

1. Import shared client: `import { supabase } from '/js/supabase-config.js'`.
2. On load, call `supabase.auth.getSession()`.
   - No session → show the sign-in card.
   - Session → show the user strip, PR form, and history list.
3. `signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/prs }})`.
4. `onAuthStateChange` keeps the UI in sync after sign-in/sign-out.
5. CRUD calls go straight to `supabase.from('prs')…` — RLS handles authorization.

The form has three modes shown conditionally based on the selected event:

- Sprint / distance events → hours / minutes / seconds inputs → stored as
  total seconds (`numeric(10,3)`).
- Lift events → single pounds input.
- Date picker → month / day / year selects (independent of event type).

The "current PR" badge on each event section is computed client-side
(`Math.min` of times, `Math.max` of weights) so we don't have to maintain a
"best" flag in the DB.

## API: `api/next-event.js`

Edge runtime function (`export const config = { runtime: 'edge' }`) that
returns the next upcoming Sunday/Thursday event for use by the home page.
Stateless, no DB access. America/Chicago timezone is hard-coded.

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

1. Create `newpage.html` mirroring an existing page's skeleton (nav,
   mobile menu, track lanes if applicable).
2. Add a `/newpage` rewrite to `vercel.json`.
3. Add the link to **every** page's nav (desktop `.nav-center` and mobile
   `.mobile-menu`) — and update the `.mobile-menu.is-open a:nth-child(N)`
   stagger delays accordingly.
4. If indexable, add to `sitemap.xml`. If user-private, add to `robots.txt`
   as `Disallow:`.

### Editing the PR dashboard

- All UI logic lives in `prs.html`. Don't try to extract components.
- Database changes: update `supabase-schema.sql` and run the new SQL in the
  Supabase dashboard. Migrations are manual — there's no migration tool.
- When adding a new event, update **three** places: the SQL `check`
  constraint, the `EVENT_LABELS`/`EVENT_ORDER`/`RUN_EVENTS`/`LIFT_EVENTS`
  constants in `prs.html`, and the chip button grid markup.

### Deployment

Pushing to the default branch triggers an automatic Vercel deploy. No build
step. Static files + edge functions only.

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
4. **Match the existing style.** Black background, orange accent,
   Fugaz One + IBM Plex Mono, ALL-CAPS labels with letter-spacing on UI
   chrome, track lanes for dashboard-style pages.
5. **Keep the nav in lockstep across all five pages.** A change to nav
   markup or stagger delays must be applied everywhere or pages will drift.
6. **For PR features, trust RLS.** Don't add server-side authorization
   logic — it's already in Postgres. The client talks to Supabase directly.
7. **Mobile-first.** Test at 375px before declaring done.
