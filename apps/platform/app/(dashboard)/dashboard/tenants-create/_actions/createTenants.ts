"use server";

import { axiosInstance } from "@/lib/axiosInstance";
import { revalidatePath } from "next/cache";
import axios from "axios";

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
    const response = await axiosInstance.post("platform/tenants", payload);

    revalidatePath("/dashboard/tenants");

    return {
      success: true,
      message: "School provisioned successfully!",
      data: response.data.data,
    };
  } catch (error: unknown) {
    let message = "Failed to provision school.";

    if (axios.isAxiosError(error)) {
      message = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error("Create Tenant Error:", message);
    return { success: false, message };
  }
};
