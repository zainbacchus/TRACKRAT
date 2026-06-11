// TRACKRAT — Supabase configuration.
// These values are safe to expose: the anon key only grants what Row Level
// Security policies permit (the canonical schema lives in README.md).
//
// Fill these in after creating your Supabase project:
//   Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://mwrkoosfrhimlppdeljo.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmtvb3NmcmhpbWxwcGRlbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTk0MjUsImV4cCI6MjA5NTEzNTQyNX0.Gsh4He_LfhcqOwUosC_iEp73w7oi1hvSIGCROtjXAjo';

// Supabase JS SDK v2.45.4, vendored (self-hosted) in /js/vendor — a
// dependency-inlined ESM bundle, so no third-party CDN runs code on the
// authenticated /pr page. To upgrade: fetch a new bundle, replace the
// vendor file, and update the version in this path.
import { createClient } from '/js/vendor/supabase-js-2.45.4.bundle.mjs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
