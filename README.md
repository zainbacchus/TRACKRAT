# TRACKRAT

A minimal, responsive single-page web app for TRACKRAT.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Document structure and semantic markup |
| CSS3 | Responsive styling with viewport units |
| SVG | Vector graphics for scalable brand visual |
| Vercel | Static hosting and global CDN distribution |

## Project Structure

```
TRACKRAT/
├── index.html              # Home
├── schedule.html           # Schedule
├── brand.html              # Brand guide
├── invitational.html       # 2026 Invitational
├── prs.html                # Personal records (Google sign-in)
├── api/                    # Vercel serverless functions
│   └── next-event.js
├── js/
│   └── supabase-config.js  # Supabase client (fill in URL + anon key)
├── supabase-schema.sql     # PR table + RLS policies (run once)
├── vercel.json             # Deployment + routing
├── favicon.ico
└── README.md
```

## Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TRACKRAT
   ```

2. Open in browser:
   ```bash
   # Simply open index.html in your browser
   open index.html
   # or use a local server
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000` in your browser

### Deployment

The project is configured for automatic deployment on Vercel:

1. Push changes to the repository
2. Vercel automatically builds and deploys
3. Changes are live on the CDN within seconds

**Manual Deployment:**
- Upload `index.html` and favicon files to any static hosting service
- No build process required


## Development

### Making Changes

All code is contained in `index.html`:

1. **Update Content**: Edit the SVG section (starting ~line 50)
2. **Modify Styles**: Edit the `<style>` section in the `<head>`

### Testing

Test responsive behavior across different viewports:

```bash
# Desktop: Resize browser window to various sizes
# Mobile: Use browser DevTools device emulation
# Tablet: Test both portrait and landscape orientations
```


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across different devices and browsers
5. Submit a pull request

## Personal Records (/prs)

The `/prs` page lets athletes sign in with Google and log PRs for eight events:
`100m`, `200m`, `400m`, `1mile`, `5K`, `bench`, `deadlift`, `squat`. Sprint and
distance events store time (in seconds, decimal); lifts store pounds. Row Level
Security ensures each user only sees and edits their own rows.

### One-time setup

**1. Create a Supabase project**

- Go to [supabase.com](https://supabase.com) → New project.
- Once it's provisioned, open **Project Settings → API** and copy the
  **Project URL** and **anon public** key.

**2. Fill in `js/supabase-config.js`**

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

The anon key is safe to ship in the client; access is constrained by the RLS
policies in `supabase-schema.sql`.

**3. Run the schema**

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents
of [`supabase-schema.sql`](supabase-schema.sql), and run it. This creates the
`prs` table, indexes, and policies.

**4. Set up Google OAuth**

In [Google Cloud Console](https://console.cloud.google.com):

- Create (or use) a project. Open **APIs & Services → Credentials**.
- **Create credentials → OAuth client ID → Web application**.
- Authorized JavaScript origins:
  - `https://trackratsprint.club`
  - `https://www.trackratsprint.club`
  - `http://localhost:3000` (or whatever you use for local dev)
- Authorized redirect URIs:
  - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
- Copy the **Client ID** and **Client secret**.

In Supabase:

- **Authentication → Providers → Google** → toggle on, paste the Client ID and
  secret, save.
- **Authentication → URL Configuration**:
  - **Site URL**: `https://trackratsprint.club`
  - **Redirect URLs** (add each):
    - `https://trackratsprint.club/prs`
    - `https://www.trackratsprint.club/prs`
    - `http://localhost:3000/prs`

**5. Deploy**

Push to `main` — Vercel picks up the new `/prs` rewrite from `vercel.json` and
serves `prs.html`.

### Local development

The site is fully static; serve it from any local web server so the `/prs`
rewrite and ES modules work:

```bash
npx serve .          # http://localhost:3000
# or
python -m http.server 3000
```

Then visit `http://localhost:3000/prs.html` (the rewrite to `/prs` only runs on
Vercel; locally use the file name).

