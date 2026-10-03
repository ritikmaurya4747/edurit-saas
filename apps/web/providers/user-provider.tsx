"use client";

import { createContext, useContext } from "react";
import { TenantUser } from "../lib/auth/session";

const UserContext = createContext<TenantUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: TenantUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);