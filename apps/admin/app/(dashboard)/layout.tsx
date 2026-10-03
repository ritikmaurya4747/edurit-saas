import { redirect } from "next/navigation";
import { UserProvider } from "@/providers/user-provider";
import DashboardLayout from "@/components/layouts/Dashboard/DashboardLayout";
import { getCurrentUser } from "@/lib/session";

export default async function PlatformDashboardLayout({
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