import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;
  // Fallback: use env vars (standalone/demo mode)
  return createSupabaseClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
}

export function setSupabaseClient(url: string, anonKey: string): void {
  _client = createSupabaseClient<Database>(url, anonKey);
}

export function resetSupabaseClient(): void {
  _client = null;
}
