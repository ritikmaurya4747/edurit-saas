import "server-only";
import { cache } from "react";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import type { SessionUser } from "./types";

export type { SessionUser };

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const res = await axiosInstance.get("auth/me");

    const payload = res.data?.data ?? res.data;
    const { user, tenant, roles = [], permissions = [], isAdmin = false, staffId = null } = payload;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl,
      role: roles[0]?.code,
      roleName: roles[0]?.name,
      roles,
      permissions,
      isAdmin,
      staffId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      logoUrl: tenant.logoUrl,
      currency: tenant.currency ?? "INR",
      timezone: tenant.timezone ?? "Asia/Kolkata",
    };
  } catch (error) {
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
