import "server-only";
import { cache } from "react";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import { AuthUser } from "./auth/types";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const res = await axiosInstance.get("platform/auth/me");
    return res.data?.data ?? res.data;
  } catch (error) {
    // token nahi / expire / invalid
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    console.error(
      "getCurrentUser failed:",
      axios.isAxiosError(error) ? error.message : error,
    );
    throw error;
  }
});