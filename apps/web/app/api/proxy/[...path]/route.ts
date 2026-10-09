import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Backend-for-frontend proxy: the browser calls /api/proxy/<path> and this
// handler forwards to the Nest API with the httpOnly tenant token attached,
// so the JWT never reaches client-side JavaScript.

const TOKEN_COOKIE = "tenant_access_token";
const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

const apiBase = () => {
  const base = process.env.API_BASE_URL || "http://localhost:4000/v1/";
  return base.endsWith("/") ? base : `${base}/`;
};

const errorResponse = (status: number, message: string) =>
  NextResponse.json({ success: false, statusCode: status, message, errors: [message] }, { status });

type RouteContext = { params: Promise<{ path?: string[] }> };

async function forward(req: NextRequest, { params }: RouteContext) {
  const { path = [] } = await params;

  // Only plain path segments: blocks "..", absolute URLs and host injection.
  if (!path.length || path.some((s) => !SAFE_SEGMENT.test(s) || s === "." || s === "..")) {
    return errorResponse(400, "Invalid API path");
  }

  // CSRF: state-changing calls must come from this same host. Sibling school
  // subdomains are "same-site", so SameSite=Lax alone is not enough.
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) {
      return errorResponse(403, "Cross-origin request blocked");
    }
  }

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return errorResponse(401, "Your session has expired. Please sign in again.");

  const target = new URL(path.join("/") + req.nextUrl.search, apiBase());
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  const userAgent = req.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;

  const hasBody = !["GET", "HEAD", "DELETE"].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("API proxy error:", error instanceof Error ? error.message : error);
    return errorResponse(502, "Unable to reach the server. Please try again.");
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
  // Token rejected (expired / membership revoked): drop the dead cookie.
  if (upstream.status === 401) response.cookies.delete(TOKEN_COOKIE);
  return response;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
