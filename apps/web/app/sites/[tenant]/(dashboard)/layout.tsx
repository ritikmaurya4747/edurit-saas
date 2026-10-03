import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layouts/Dashboard/DashboardLayout";
import { UserProvider } from "@/providers/user-provider";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  const school = user?.tenantName ?? "EduRit";

  return {
    title: {
      default: school,
      template: `%s | ${school}`,
    },
    description: `${school} - School ERP powered by EduRit`,
  };
}

export default async function TenantDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <UserProvider user={user}>
      <DashboardLayout>{children}</DashboardLayout>
    </UserProvider>
  );
}