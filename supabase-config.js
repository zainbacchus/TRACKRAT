// TRACKRAT — Supabase configuration.
// These values are safe to expose: the anon key only grants what Row Level
// Security policies permit (see supabase-schema.sql).
//
// Fill these in after creating your Supabase project:
//   Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

// Loaded from the official Supabase JS SDK CDN.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
