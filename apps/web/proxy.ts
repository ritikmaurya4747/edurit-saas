import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname from request headers
  const hostname = req.headers.get('host') || ''; 

  // Remove port number to get a clean hostname (e.g., 'dps-rk-puram.localhost:3001' -> 'dps-rk-puram.localhost')
  const [cleanHostname = ''] = hostname.split(':');

  // Define the root domain using an environment variable (fallback to 'edurit.in')
  // This ensures the same code works across local, staging, and production environments.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'edurit.in';
  const isLocal = cleanHostname.includes('localhost');
  
  // Extract the tenant slug from the hostname
  let tenantSlug = '';
  if (isLocal) {
    tenantSlug = cleanHostname.replace('.localhost', '');
  } else {
    // Extract subdomain for production and strip 'www.' if the user included it
    tenantSlug = cleanHostname
      .replace(`.${rootDomain}`, '')
      .replace('www.', '');
  }

  // If the user visits the root domain directly (without a subdomain)
  if (tenantSlug === 'localhost' || tenantSlug === rootDomain || tenantSlug === '') {
    // Proceed to standard root pages (e.g., the main landing page)
    return NextResponse.next();
  }

  // If a valid subdomain exists, silently rewrite the request to the dynamic tenant directory
  return NextResponse.rewrite(
    new URL(`/sites/${tenantSlug}${url.pathname}${url.search}`, req.url)
  );
}

// Configure the proxy to run on all routes except static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};