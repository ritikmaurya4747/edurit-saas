"use server";

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export interface TenantUser {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  tenantName?: string; // payload ke actual key ke hisaab se badlo
  exp?: number;
}

export const getCurrentUser = async (): Promise<TenantUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("tenant_access_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwtDecode<TenantUser>(token);

    // Expired token ho to null
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;

    return decoded;
  } catch (error) {
    console.error("Failed to decode auth token:", error);
    return null;
  }
};