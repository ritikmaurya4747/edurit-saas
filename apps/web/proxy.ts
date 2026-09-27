import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  
  // 1. Get hostname and extract tenant slug
  const hostname = req.headers.get('host') || ''; 
  const [cleanHostname = ''] = hostname.split(':');
  
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'edurit.in';
  const isLocal = cleanHostname.includes('localhost');
  
  let tenantSlug = '';
  if (isLocal) {
    tenantSlug = cleanHostname.replace('.localhost', '');
  } else {
    tenantSlug = cleanHostname
      .replace(`.${rootDomain}`, '')
      .replace('www.', '');
  }

  // Agar bina subdomain ke visit kiya (e.g., edurit.in) toh normal pages dikhao
  if (tenantSlug === 'localhost' || tenantSlug === rootDomain || tenantSlug === '') {
    return NextResponse.next();
  }

  // ==========================================
  // AUTHENTICATION LOGIC (Admin-Style)
  // ==========================================
  
  // Read the secure HTTP-only cookie specific to the tenant
  const token = req.cookies.get('tenant_access_token')?.value;

  const isDashboardRoute = path.startsWith('/dashboard');
  const isLoginRoute = path.startsWith('/login');
  const isRootRoute = path === '/';

  // Rule A: No token + Protected Route (Dashboard) = Kick back to Login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Rule B: Has token + Tries to access Login = Auto-forward to Dashboard
  if (isLoginRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Rule C: Force root domain (/) to either Login or Dashboard based on Auth status
  if (isRootRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ==========================================
  // MULTI-TENANT REWRITE LOGIC
  // ==========================================
  
  // Agar auth checks pass ho gaye, toh silently Next.js ko tenant folder me bhej do
  return NextResponse.rewrite(
    new URL(`/sites/${tenantSlug}${url.pathname}${url.search}`, req.url)
  );
}

// Config to run proxy on all routes except static assets and APIs
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};