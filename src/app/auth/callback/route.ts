import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/server/db';
import { createSession } from '@/server/auth';
import { PKCE_COOKIE, exchangeCode, googleConfig } from '@/server/google-auth';

export async function GET(req: NextRequest) {
  const cfg = googleConfig();
  if (!cfg) return NextResponse.redirect(new URL('/login', req.url));

  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${cfg.appUrl}/login?error=${reason}`);
    res.cookies.delete({ name: PKCE_COOKIE, path: '/auth/callback' });
    return res;
  };

  const code = req.nextUrl.searchParams.get('code');
  const verifier = req.cookies.get(PKCE_COOKIE)?.value;
  if (!code || !verifier) return fail('google_failed');

  const identity = await exchangeCode(cfg, code, verifier).catch(() => null);
  if (!identity) return fail('google_failed');

  // Only accounts the admin registered (e.g. as a buyer/resident with this Gmail) may sign in.
  const user = await prisma.user.findUnique({ where: { email: identity.email } });
  if (!user || !user.isActive) return fail('not_registered');

  if (!user.avatarUrl && identity.avatarUrl) {
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: identity.avatarUrl } });
  }
  await createSession(user.id);
  const res = NextResponse.redirect(`${cfg.appUrl}/`);
  res.cookies.delete({ name: PKCE_COOKIE, path: '/auth/callback' });
  return res;
}
