import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Check if the route needs protection
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // 2. Read the secure HTTP-only cookie
  const token = request.cookies.get('hq_access_token')?.value;

  // 3. Logic: No token + Protected Route = Kick back to Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Logic: Has token + Tries to access Login = Auto-forward to Dashboard
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed normally
  return NextResponse.next();
}

// 5. Matcher config to ensure the proxy only runs on specific routes
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/login'
  ],
};