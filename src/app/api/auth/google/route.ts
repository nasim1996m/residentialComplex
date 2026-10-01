import { NextResponse } from 'next/server';
import { PKCE_COOKIE, authorizeUrl, createPkcePair, googleConfig } from '@/server/google-auth';

export async function GET() {
  const cfg = googleConfig();
  if (!cfg) return NextResponse.json({ error: 'تسجيل الدخول بـ Google غير مفعّل' }, { status: 404 });

  const { verifier, challenge } = createPkcePair();
  const res = NextResponse.redirect(authorizeUrl(cfg, challenge));
  res.cookies.set(PKCE_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/callback',
    maxAge: 600,
  });
  return res;
}
