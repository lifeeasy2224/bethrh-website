import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return res;
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
