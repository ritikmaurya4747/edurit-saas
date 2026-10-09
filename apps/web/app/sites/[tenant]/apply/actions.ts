"use server";

import { apiBase, forwardedHeaders } from "./data";
import { ENQUIRY_FIELDS, SLUG_PATTERN, type EnquiryInput, type SubmitResult } from "./types";

// Public server action behind the /apply form. The API validates everything
// again; this only forwards a clean payload plus the visitor's IP (rate limit).
export async function submitAdmissionEnquiry(rawSlug: string, input: EnquiryInput): Promise<SubmitResult> {
  const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";
  if (!SLUG_PATTERN.test(slug)) return { ok: false, message: "School not found. Please check the link." };

  // Only known string fields; drop empty optional ones.
  const body: Partial<Record<keyof EnquiryInput, string>> = {};
  for (const key of ENQUIRY_FIELDS) {
    const value = input?.[key];
    if (typeof value === "string" && value.trim() !== "") body[key] = value.slice(0, 2000);
  }

  let res: Response;
  try {
    res = await fetch(`${apiBase()}public/schools/${slug}/admission-enquiries`, {
      method: "POST",
      headers: { ...(await forwardedHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Admission enquiry submit failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "We could not reach the school's server. Please check your internet and try again." };
  }

  const json = (await res.json().catch(() => null)) as { data?: { reference?: string }; message?: string } | null;

  if (res.ok && json?.data?.reference) return { ok: true, reference: json.data.reference };
  if (res.status === 429) {
    return { ok: false, message: "Too many submissions from your network. Please wait a few minutes and try again." };
  }
  return {
    ok: false,
    message: (typeof json?.message === "string" && json.message) || "Something went wrong. Please try again.",
  };
}
