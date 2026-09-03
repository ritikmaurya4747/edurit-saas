"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface LoginResponse {
  success: boolean;
  message?: string;
}

export async function loginAction(
  formData: { email: string; password: string }
): Promise<LoginResponse> {
  
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

    const apiResponse = await res.json();

    if (!res.ok || !apiResponse.success) {
      return {
        success: false,
        message: apiResponse.message || "Invalid credentials",
      };
    }

    // NESTED TOKEN FIX: accessToken data.data ke andar hai
    const token = apiResponse.data?.accessToken;

    if (!token) {
      return {
        success: false,
        message: "Server error: Token missing",
      };
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("hq_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

  } catch (error) {
    return {
      success: false,
      message: "Something went wrong while communicating with server",
    };
  }
  redirect("/dashboard");
}


export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Clear the secure HTTP-only cookie
  cookieStore.delete("hq_access_token");
  
  // Redirect to login page after logout
  redirect("/login");
}