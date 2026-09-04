"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

interface CreateTenantPayload {
  slug: string;
  name: string;
  legalName: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminInitialPassword?: string;
  planCode: string;
  currency: string;
  timezone: string;
}

export const createTenants = async (payload: CreateTenantPayload) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hq_access_token")?.value;

    if (!token) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    // Resolving API URL (Ensure it points to your Fastify/NestJS v1 endpoint)
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000/api/v1/";

    const response = await fetch(`${apiUrl}platform/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message:
          data.message || data.errorCode || "Failed to provision school.",
      };
    }

    // Refresh the tenants list data
    revalidatePath("/dashboard/tenants");

    return { success: true, message: "School provisioned successfully!" };
  } catch (error) {
    console.error("Action Error:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
};
