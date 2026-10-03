"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth/types";

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);