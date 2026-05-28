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
├── schedule.html           # /schedule              — weekly schedule + .ics export
├── brand.html              # /brand                 — brand guide
├── invitational.html       # /invitational     — event placeholder
├── pr.html                 # /pr                    — Personal Records (Google sign-in)
├── api/
│   └── next-event.js       # Edge function: next upcoming event as JSON
├── js/
│   └── supabase-config.js  # Shared Supabase client (URL + anon key)
├── fonts/                  # Self-hosted webfonts (woff2, latin subset)
│   ├── fugaz-one-latin.woff2
│   └── ibm-plex-mono-{400,500,600,700}-latin.woff2
├── vercel.json             # Clean-URL rewrites + /fonts/* long-cache headers
├── middleware.js           # Vercel middleware
├── og.png                  # 1200×630 Open Graph image (shared across all pages)
├── robots.txt              # Disallows /pr from crawlers
├── sitemap.xml             # Public-page sitemap
├── llms.txt                # LLM-facing site description
├── favicon.ico
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
  and `sameAs` links. **The specific meet-up street address is intentionally
  omitted from JSON-LD** — it lives only on the visible schedule page.
- A `FAQPage` JSON-LD block (high signal for Google AI Overviews, ChatGPT
  Search, Perplexity).

`pr.html` carries `noindex, follow` since it's an authenticated dashboard.
It's also disallowed in `robots.txt`.

The OG image (`og.png`) is currently rendered from brand parameters with
Impact (the closest condensed-display face available locally) standing in
for Fugaz One. Drop a properly-rendered version at the repo root to replace.

## Invitational RSVP (Luma)

The `/invitational` page wraps a [Luma](https://lu.ma) RSVP form in a
TRACKRAT-branded hero. Luma handles email confirmations, edit-by-link, and
the admin dashboard so we don't have to build that infra in-house for a
single annual event. *(Planned migration: build native RSVP in Supabase
for the 2027 event once we know what data + features matter.)*

### One-time Luma event setup

1. **Create the event** at <https://lu.ma/create>:
   - Name: `TRACKRAT 2026 Invitational`
   - Date: Saturday, October 10, 2026, morning *(exact time TBD — set a
     placeholder like 9:00 AM and note "time TBD" in the description)*
   - Location: in-person, Austin, TX *(specific address TBD)*
   - Visibility: Public
   - Cover image: upload `/og.png` from this repo
   - Description: short blurb about the event
2. **Event Questions** (Settings → Registration → Custom Questions):
   - Q1: "Are you competing or spectating?" — multiple choice, required
     - Options: `Competitor`, `Spectator`
   - Q2: "Which events?" — multi-select, required, **show only if
     Competitor**
     - Options: `100m (Men's)`, `100m (Women's)`, `200m (Men's)`,
       `200m (Women's)`, `400m (Men's)`, `400m (Women's)`,
       `4×100 Coed Relay`, `4×400 Coed Relay`
   - Q3: "Instagram handle" — short text, required, **show only if
     Competitor**
3. **Branding** (Settings → Appearance):
   - Accent color: `#FF4D1F` (TRACKRAT orange)
   - Theme: light (matches the white card on our orange page)
4. **Publish** the event.
5. **Copy the event ID** from the URL (`https://lu.ma/XYZ123` → the
   `XYZ123` part).

### Wire it into `/invitational`

Open `invitational.html`, find the `LUMA RSVP EMBED` comment block, and:

1. Uncomment the `<iframe>` element.
2. Replace `YOUR_LUMA_EVENT_ID` in the `src` URL with your event ID.
3. Delete the `<div class="rsvp-placeholder">…</div>` block right below it.
4. Commit, push, deploy.

That's it. The page above the fold stays 100% TRACKRAT-branded; the form
inside is Luma.

### Pulling RSVPs

Luma's dashboard has a built-in attendee list with filters and CSV export
(Event Page → Manage → Guests → Export). Use that to build heat sheets
before race day.

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

## Routing

`vercel.json` rewrites clean URLs to the underlying `.html` files:

```json
{ "source": "/schedule",          "destination": "/schedule.html" }
{ "source": "/brand",             "destination": "/brand.html" }
{ "source": "/invitational", "destination": "/invitational.html" }
{ "source": "/pr",                "destination": "/pr.html" }
```

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

Authenticated dashboard at `/pr` where members log PRs across 11 events:

**Run / distance** (stored as seconds): `100m`, `200m`, `400m`, `1mile`, `5K`,
`halfmarathon`, `marathon`.
**Lifts** (stored as pounds + sets + reps): `bench`, `deadlift`, `squat`,
`hangclean`.

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
  sets          int,
  reps          int,
  notes         text,
  achieved_on   date not null,
  created_at    timestamptz not null default now()
);

alter table public.prs add constraint prs_event_check check (event in (
  '100m','200m','400m','1mile','5K','halfmarathon','marathon',
  'bench','deadlift','squat','hangclean'
));

alter table public.prs add constraint value_matches_event check (
  (event in ('100m','200m','400m','1mile','5K','halfmarathon','marathon')
    and value_seconds is not null and value_pounds is null
    and value_seconds > 0 and sets is null and reps is null)
  or
  (event in ('bench','deadlift','squat','hangclean')
    and value_pounds is not null and value_seconds is null
    and value_pounds > 0)
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
