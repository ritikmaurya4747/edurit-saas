"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "@/lib/auth/types";

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export const usePlatformUser = () => useContext(UserContext);