import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');
  const isAdminApiPath = pathname.startsWith('/api/admin');

  if (isAdminPath || isAdminApiPath) {
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    const enableAdminEnv = process.env.NEXT_PUBLIC_ENABLE_ADMIN?.trim() === 'true';
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'admin123';

    const secretParam = searchParams.get('secret');
    const cookieSecret = request.cookies.get('admin_secret_auth')?.value;

    // Secret URL parameter authentication: e.g. /admin?secret=YOUR_SECRET
    if (secretParam && secretParam === adminSecret) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.searchParams.delete('secret');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set('admin_secret_auth', adminSecret, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    const isAuthorized = isLocalhost || enableAdminEnv || (cookieSecret === adminSecret);

    if (!isAuthorized) {
      if (isAdminApiPath) {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied: Admin endpoints restricted.' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
      // For public users without authorization, show 404 Not Found
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
