"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface TenantLoginResponse {
  success: boolean;
  message?: string;
}

export async function tenantLoginAction(
  formData: { email: string; password: string; tenantSlug: string }
): Promise<TenantLoginResponse> {
  try {
    const apiUrl = process.env.API_BASE_URL || "http://localhost:4000/v1/";

    // 1. Authenticate against the centralized backend using the tenant login endpoint
    const res = await fetch(`${apiUrl}auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      cache: "no-store",
    });

    const apiResponse = await res.json();

    // 2. Handle unauthorized or failed responses
    if (!res.ok || apiResponse.statusCode >= 400) {
      return {
        success: false,
        message: apiResponse.message || "Invalid credentials for this school",
      };
    }

    // 3. Extract token from the NestJS response
    // NestJS default return structure me token seedha object me hota hai (e.g., { accessToken: "..." })
    const token = apiResponse.accessToken || apiResponse.data?.accessToken;

    if (!token) {
      return {
        success: false,
        message: "Server error: Token missing from response payload",
      };
    }

    // 4. Establish a secure session using HTTP-only cookies
    const cookieStore = await cookies();
    // Cookie ka naam alag rakha hai taaki HQ aur Tenant session clash na karein
    cookieStore.set("tenant_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", 
      maxAge: 60 * 60 * 24 * 7,
    });

  } catch (error) {
    console.log("Tenant login action error:", error);
    return {
      success: false,
      message: "Something went wrong while communicating with the server",
    };
  }
  
  // 5. Redirect to the tenant's root dashboard
  redirect("/dashboard");
}

export async function tenantLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("tenant_access_token");
  redirect("/login");
}