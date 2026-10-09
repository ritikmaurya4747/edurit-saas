import { NextRequest, NextResponse } from "next/server";

// A dashboard render found the token invalid (expired / revoked). Clear the
// cookie before going to /login, otherwise proxy.ts would bounce a request
// that still carries a cookie straight back to /dashboard (redirect loop).
export function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("tenant_access_token");
  return response;
}
