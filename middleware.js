import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from './lib/auth';

const AREAS = ['client', 'provider', 'admin'];

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  const area = AREAS.find((a) => pathname === `/${a}` || pathname.startsWith(`/${a}/`));
  if (area) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
    if (user.role !== area) return NextResponse.redirect(new URL(`/${user.role}`, req.url));
  }

  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL(`/${user.role}`, req.url));
  }

  // Pass the path to server layouts (used for the provider approval gate)
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/client/:path*', '/provider/:path*', '/admin/:path*', '/login', '/signup'],
};
