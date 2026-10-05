import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from './server/auth/session';

/**
 * ⚠️ NOTE ON SYSTEM ARCHITECTURE & SECURITY:
 * This Next.js middleware is exclusively for page-level navigation and UX redirection.
 * It does NOT replace or constitute server-side security. Real authorization and access
 * control are strictly enforced within the API Route Handlers and Service Layer
 * on every single data operation.
 */

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'apparelflow-development-fallback-secret-minimum-32-chars';
  return new TextEncoder().encode(secret);
}

const PUBLIC_PATHS = ['/login', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let API requests pass straight through to route handlers (where full RBAC security executes)
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let session: { role?: string; userId?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret(), {
        algorithms: ['HS256'],
      });
      session = payload as { role?: string; userId?: string };
    } catch {
      // Invalid or expired token
      session = null;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // If user is not authenticated and trying to access a protected dashboard route -> redirect to /login
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and hitting /login or / -> redirect to their role's workspace
  if (session && (isPublicPath || pathname === '/')) {
    let targetPath = '/cutting';
    if (session.role === 'cutting_verifier') {
      targetPath = '/verification';
    } else if (session.role === 'sewing_supervisor') {
      targetPath = '/sewing';
    }
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
