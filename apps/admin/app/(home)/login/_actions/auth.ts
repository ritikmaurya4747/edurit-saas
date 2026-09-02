"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export async function loginAction(formData: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const res = await fetch(`${apiUrl}platform/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Invalid credentials",
      };
    }

    // Set secure HTTP-only cookie for session security
    const cookieStore = await cookies();
    cookieStore.set("hq_access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days (matching your JWT expiration)
    });
  } catch (error) {
    return {
      success: false,
      // message: error?.message || "Something went wrong while communicating with server",
    };
  }
  redirect("/dashboard");
}