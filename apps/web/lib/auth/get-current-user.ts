import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export interface TenantUser {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  tenantName?: string;
  exp?: number;
}

export const getCurrentUser = cache(async (): Promise<TenantUser | null> => {
  const token = (await cookies()).get("tenant_access_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwtDecode<TenantUser>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
});