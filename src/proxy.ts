import { NextResponse, type NextRequest } from 'next/server';

// UX-only redirect for visitors without a session cookie. Real authorization happens
// in every API route and page (session looked up in the database), never here.
export function proxy(req: NextRequest) {
  if (!req.cookies.has('rc_session')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/staff/:path*', '/resident/:path*', '/worker/:path*'],
};
