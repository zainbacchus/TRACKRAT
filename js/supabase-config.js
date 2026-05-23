// TRACKRAT — Supabase configuration.
// These values are safe to expose: the anon key only grants what Row Level
// Security policies permit (see supabase-schema.sql).
//
// Fill these in after creating your Supabase project:
//   Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://mwrkoosfrhimlppdeljo.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmtvb3NmcmhpbWxwcGRlbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTk0MjUsImV4cCI6MjA5NTEzNTQyNX0.Gsh4He_LfhcqOwUosC_iEp73w7oi1hvSIGCROtjXAjo';

// Loaded from the official Supabase JS SDK CDN.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
