import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined in .env.local");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
