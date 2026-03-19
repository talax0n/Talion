import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Singleton for browser usage
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getClient() {
  if (!client) client = createBrowserClient();
  return client;
}
