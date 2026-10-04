"use server"
import { axiosInstance } from "@/lib/axiosInstance";
import axios from "axios";

const getTenants = async () => {
  try {
    const response = await axiosInstance.get("platform/tenants");
    return {
      success: true,
      data: response.data.data || [],
    };
  } catch (error: unknown) {
    let errorMessage = "Failed to fetch tenants";

    if (axios.isAxiosError(error)) {
      console.error(
        "Fetch Tenants Error:",
        error.response?.data || error.message,
      );
      errorMessage = error.response?.data?.message || errorMessage;
    } else if (error instanceof Error) {
      console.error("Fetch Tenants Error:", error.message);
      errorMessage = error.message;
    } else {
      console.error("Fetch Tenants Error:", error);
    }

    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }
};

export default getTenants;