import { createBrowserClient } from '@supabase/ssr';

// Apenas funções que podem ser importadas por Client Components.
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const configured = () => Boolean(url() && key());

export function browserDb() {
  if (!configured()) return null;
  return createBrowserClient(url(), key());
}
