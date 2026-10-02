import { createHash, randomBytes } from 'node:crypto';

// Google sign-in through Supabase Auth (OAuth + PKCE). Supabase only proves who the
// person is; access is granted solely to accounts the admin already created.

export const PKCE_COOKIE = 'rc_pkce';

export function googleConfig() {
  const env = process.env;
  const supabaseUrl = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '');
  const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // On Vercel, fall back to the project's production domain when APP_URL is not set.
  const vercelUrl = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  const appUrl = (env.APP_URL || vercelUrl)?.replace(/\/+$/, '');
  if (!supabaseUrl || !anonKey || !appUrl) return null;
  return { supabaseUrl, anonKey, appUrl };
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function authorizeUrl(cfg: NonNullable<ReturnType<typeof googleConfig>>, challenge: string) {
  const url = new URL(`${cfg.supabaseUrl}/auth/v1/authorize`);
  url.searchParams.set('provider', 'google');
  url.searchParams.set('redirect_to', `${cfg.appUrl}/auth/callback`);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 's256');
  return url.toString();
}

export interface GoogleIdentity {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

// Exchanges the one-time code for the Supabase user; returns null if Supabase rejects it.
export async function exchangeCode(
  cfg: NonNullable<ReturnType<typeof googleConfig>>,
  code: string,
  verifier: string,
): Promise<GoogleIdentity | null> {
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    user?: { email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> };
  };
  const u = data.user;
  if (!u?.email || !u.email_confirmed_at) return null;
  const meta = u.user_metadata ?? {};
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    email: u.email.trim().toLowerCase(),
    fullName: str(meta.full_name) ?? str(meta.name),
    avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
  };
}
