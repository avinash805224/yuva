// ============================================================================
// EcoPulse 360 — Supabase Client Configuration
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')) {
  console.warn(
    '⚠️ EcoPulse 360: Supabase not configured. Running in offline simulation mode.\n' +
    'To connect: copy .env.example → .env and add your Supabase credentials.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Check if Supabase is properly configured and available.
 * Returns false if running in offline/simulation mode.
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_PROJECT_ID') &&
    !supabaseAnonKey.includes('YOUR_KEY_HERE')
  );
}
