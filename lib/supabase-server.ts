import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Apenas para Server Components e Route Handlers.
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function serverDb() {
  if (!url() || !key()) return null;
  const store = await cookies();
  return createServerClient(url(), key(), {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(values: { name: string; value: string; options: CookieOptions }[]) {
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components são read-only; middleware atualiza os cookies.
        }
      },
    },
  });
}

export function adminDb() {
  if (!url() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createAdminClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function currentUser() {
  const db = await serverDb();
  if (!db) return null;
  const { data: { user }, error } = await db.auth.getUser();
  return error ? null : user;
}

export async function isAdmin() {
  const user = await currentUser();
  const admin = adminDb();
  if (!user || !admin) return false;
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return data?.role === 'admin';
}
