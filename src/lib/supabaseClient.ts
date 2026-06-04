import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Log configuration status in development
if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials are not fully configured in your environment system. " +
    "Please declare VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to activate real database operations."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
