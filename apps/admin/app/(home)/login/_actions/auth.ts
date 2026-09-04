"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface LoginResponse {
  success: boolean;
  message?: string;
}

/**
 * Authenticates a platform user via the centralized NestJS API and establishes a secure session.
 * 
 * @param {Object} formData - The user credentials.
 * @param {string} formData.email - The registered email address of the platform admin.
 * @param {string} formData.password - The secure password.
 * @returns {Promise<LoginResponse>} Returns an object indicating success or failure with a message.
 * 
 * @description
 * This server action performs the following:
 * 1. Calls the backend authentication endpoint.
 * 2. Parses the enterprise response wrapper to extract the JWT token.
 * 3. Sets an HTTP-only, secure cookie to manage the user session safely against XSS attacks.
 * 4. Redirects the user to the HQ Dashboard upon successful authentication.
 */
export async function loginAction(
  formData: { email: string; password: string }
): Promise<LoginResponse> {
  
  try {
    // Resolve the appropriate API URL based on the environment
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/";

    // 1. Authenticate against the centralized backend
    const res = await fetch(`${apiUrl}platform/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      cache: "no-store",
    });

    const apiResponse = await res.json();

    // 2. Handle unauthorized or failed responses
    if (!res.ok || !apiResponse.success) {
      return {
        success: false,
        message: apiResponse.message || "Invalid credentials",
      };
    }

    // 3. Extract token from the nested backend response structure
    const token = apiResponse.data?.accessToken;

    if (!token) {
      return {
        success: false,
        message: "Server error: Token missing from response payload",
      };
    }

    // 4. Establish a secure session using HTTP-only cookies
    const cookieStore = await cookies();
    cookieStore.set("hq_access_token", token, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie (XSS protection)
      secure: process.env.NODE_ENV === "production", // Mandates HTTPS in production
      sameSite: "lax", // Protects against CSRF attacks
      path: "/", // Makes the cookie accessible across the entire application
      maxAge: 60 * 60 * 24 * 7, // Token expiration set to 7 days
    });

  } catch (error) {
    // Handle network or unexpected server errors
    console.log("Login action error:", error)
    return {
      success: false,
      message: "Something went wrong while communicating with the server",
    };
  }
  
  // 5. Redirect the user (Must be placed outside the try-catch block in Next.js)
  redirect("/dashboard");
}


/**
 * Terminates the current user session and redirects to the login screen.
 * 
 * @description
 * This server action securely destroys the authentication token stored in the client's cookies
 * and triggers a hard redirect to ensure the middleware successfully locks down protected routes.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  
  // 1. Destroy the session cookie
  cookieStore.delete("hq_access_token");
  
  // 2. Redirect back to the authentication portal
  redirect("/login");
}