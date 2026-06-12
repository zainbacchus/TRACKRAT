# Security Policy

TRACKRAT is a small community site, but the `/pr` dashboard is an
authenticated product backed by Supabase, so we take reports seriously.

## Reporting a vulnerability

- Preferred: use GitHub's **"Report a vulnerability"** (private advisory)
  on this repository.
- Alternatively, DM [@trackratsprintclub](https://instagram.com/trackratsprintclub)
  on Instagram with "SECURITY" in the message.

Please do not open a public issue for security reports.

## Scope notes

- The Supabase **anon key** committed in `js/supabase-config.js` is
  intentionally public. Authorization is enforced by Postgres Row Level
  Security; the anon role holds no table privileges. Reports that the key
  is "leaked" are not vulnerabilities. Reports of RLS bypasses, privilege
  escalation, or cross-user data access absolutely are — please send those.
- There is no bug bounty; we'll credit you in the commit/release notes
  if you'd like.
