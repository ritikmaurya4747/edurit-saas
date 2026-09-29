"use server";

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export interface AuthUser {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("hq_access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<AuthUser>(token);

    return decoded;
  } catch (error) {
    console.error("Failed to decode auth token:", error);
    return null;
  }
};
