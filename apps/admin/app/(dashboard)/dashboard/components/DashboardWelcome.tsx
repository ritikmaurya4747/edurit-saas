"use client";

import { AuthUser, getCurrentUser } from "@/lib/auth";
import { useEffect, useState } from "react";

const DashboardWelcome = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const name = user?.name || user?.email || "User";
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="text-sm text-slate-500">Good morning,</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {isLoading ? "Loading..." : name}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your school today.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">
          Tuesday, 29 July 2026
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Academic Year 2026 - 2027
        </p>
      </div>
    </section>
  );
};

export default DashboardWelcome;
