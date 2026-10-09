import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { SLUG_PATTERN, type AdmissionFormInfo } from "./types";

export const apiBase = () => {
  const base = process.env.API_BASE_URL || "http://localhost:4000/v1/";
  return base.endsWith("/") ? base : `${base}/`;
};

// Forward the visitor's IP so the API rate-limits per parent, not per web server.
export async function forwardedHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const out: Record<string, string> = { Accept: "application/json" };
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  if (ip) out["X-Forwarded-For"] = ip;
  const userAgent = h.get("user-agent");
  if (userAgent) out["User-Agent"] = userAgent;
  return out;
}

export type FormLoad =
  | { kind: "ok"; data: AdmissionFormInfo }
  | { kind: "not-found" }
  | { kind: "error" };

// Cached per request so generateMetadata and the page share one API call.
export const loadAdmissionForm = cache(async (rawSlug: string): Promise<FormLoad> => {
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return { kind: "not-found" };
  try {
    const res = await fetch(`${apiBase()}public/schools/${slug}/admission-form`, {
      headers: await forwardedHeaders(),
      cache: "no-store",
    });
    if (res.status === 404) return { kind: "not-found" };
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as { data?: AdmissionFormInfo };
    return json.data ? { kind: "ok", data: json.data } : { kind: "error" };
  } catch (error) {
    console.error("Admission form load failed:", error instanceof Error ? error.message : error);
    return { kind: "error" };
  }
});
