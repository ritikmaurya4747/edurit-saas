"use client";

import type { ReactNode } from "react";
import { useIsPortalUser } from "@/lib/auth/permissions";
import PortalHome from "./PortalHome";

// /dashboard: students and parents get the portal home, everyone else the
// staff dashboard passed in as `staff` (only mounted when used).
export default function PortalSwitch({ staff }: { staff: ReactNode }) {
  const isPortalUser = useIsPortalUser();
  return isPortalUser ? <PortalHome /> : <>{staff}</>;
}
