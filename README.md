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
| Fonts | Self-hosted Fugaz One (display) + IBM Plex Mono (UI), latin subset, woff2 in `/fonts` |
| Build step | None |

## Project Structure

```
TRACKRAT/
├── index.html              # /                      — landing (with SEO/AEO content + JSON-LD)
├── schedule.html           # /schedule              — weekly schedule + .ics export + Event JSON-LD
├── brand.html              # /brand                 — brand guide
├── invitational.html       # /invitational          — 2026 Invitational (Sweatpals RSVP)
├── pr.html                 # /pr                    — Personal Records (Google sign-in)
├── 404.html                # branded not-found page (Vercel serves it with status 404)
├── api/
│   └── next-event.js       # Edge function: next upcoming event as JSON (public API, see llms.txt)
├── js/
│   ├── supabase-config.js  # Shared Supabase client (URL + anon key)
│   └── vendor/             # Vendored (self-hosted) Supabase JS SDK bundle
├── fonts/                  # Self-hosted webfonts (woff2, latin subset) + OFL license texts
│   ├── fugaz-one-latin.woff2
│   ├── ibm-plex-mono-{400,500,600,700}-latin.woff2
│   └── LICENSE-*.txt       # SIL OFL 1.1 notices for both font families
├── vercel.json             # cleanUrls, security headers, redirects, cache headers
├── og.png                  # 1200×630 Open Graph image (shared across all pages)
├── robots.txt              # Crawl rules (/pr is noindexed via meta, not Disallowed)
├── sitemap.xml             # Public-page sitemap
├── llms.txt                # LLM-facing site description
├── favicon.ico
├── LICENSE                 # MIT for code; brand assets excluded (all rights reserved)
├── SECURITY.md             # Vulnerability disclosure policy
├── README.md               # This file
└── CLAUDE.md               # Project context for AI assistants
```

## SEO / AEO

Each public page ships with:

- A specific `<title>` and meta description (e.g. *"TRACKRAT — Austin Sprint Club"*).
- A canonical link to the `www.trackratsprint.club` host.
- Open Graph + Twitter Card tags pointing at `/og.png` (the shared 1200×630
  brand image).
- Geo meta (`US-TX`, `Austin`).

The home page (`index.html`) additionally has:

- An actual content section below the splash hero with location, schedule, and
  audience copy (so crawlers and answer engines have substantive text to read).
- A `SportsClub` JSON-LD block with `openingHoursSpecification`, `areaServed`,
  the full Sunday meet location (4401 Tilley St — also on Google Business
  Profile), and `sameAs` links covering Instagram/Discord/X/shop/GBP.
- A `FAQPage` JSON-LD block (high signal for Google AI Overviews, ChatGPT
  Search, Perplexity). Every FAQ answer is grounded in visible page copy.

`pr.html` carries `noindex, follow` since it's an authenticated dashboard.
(It is deliberately NOT `Disallow`ed in `robots.txt` — Google must be able
to crawl the page to see the noindex.)

`schedule.html` ships `Event` JSON-LD for both weekly sessions
(`eventSchedule` with weekly recurrence). The Sunday session carries the
full street address (fixed location, already public, matches Google
Business Profile — required for Google's local/event surfaces). Thursday
stays city-level because its location genuinely varies week to week.

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
- `/prs` → `/pr` (legacy URL)

Headers: security baseline on every response (`X-Content-Type-Options`,
`X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`, `Referrer-Policy`,
`Permissions-Policy`), immutable year-long cache on `/fonts/*` and
`/js/vendor/*`, daily cache on `og.png`/`favicon.ico`.

## Supabase SDK (vendored)

The Supabase JS SDK (currently **2.108.1**) is **self-hosted** at
`js/vendor/supabase-js-<version>.bundle.mjs` — a dependency-inlined ESM
bundle plus its Node polyfills (`node-buffer.mjs`, `node-process.mjs`,
`node-events.mjs`, `node-tty.mjs`, `node-async_hooks.mjs`) — so no
third-party CDN executes code on the authenticated `/pr` page. Auth uses
the PKCE flow (`flowType: 'pkce'` in `js/supabase-config.js`).

To upgrade: fetch `https://esm.sh/@supabase/supabase-js@<ver>?bundle-deps&target=es2020`,
follow its stub to the `.bundle.mjs` build, rewrite every `/node/*.mjs`
import (recursively — polyfills import each other) to the local
`./node-*.mjs` files, verify no absolute or bare module specifiers remain
(string literals inside error messages can false-positive a grep), update
the import path in `js/supabase-config.js`, and test sign-in + a PR save
on production before calling it done.

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
files + edge functions only.

---

# Personal Records (`/pr`)

Authenticated dashboard at `/pr` where members log PRs across 16 events:

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
    - `https://www.trackratsprint.club/pr`
    - `https://trackratsprint.club/pr`
    - `http://localhost:3000/pr`

### 5. Deploy

Push to `main`. Vercel picks up the `/pr` rewrite from `vercel.json` and
serves `pr.html`.

## Adding a new event

Three places to update — keep them in sync:

1. **SQL** — extend the `prs_event_check` and `value_matches_event` constraints
   in your Supabase database (write an `alter table ... drop constraint ... add
   constraint ...` migration in the SQL editor).
2. **`pr.html`** — add to `RUN_EVENTS` or `LIFT_EVENTS`, plus `EVENT_LABELS`
   and `EVENT_ORDER`.
3. **`pr.html`** — add a chip button to the `#eventGrid` markup.

## Why is the anon key in a public repo OK?

Supabase's anon key is *designed* to be public — it's the same model as
Firebase config keys or Stripe publishable keys. Security comes from the RLS
policies above, not from key secrecy. The only key that must never ship to
the client is `service_role`, which bypasses RLS. We don't use it anywhere
in this repo.
