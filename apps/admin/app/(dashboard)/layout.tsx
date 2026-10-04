import Provider from "@/components/layouts/Providers";
import { getCurrentUser } from "@/lib/session";
import { UserProvider } from "@/providers/user-provider";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import DashboardLayout from "../../components/layouts/Dashboard/DashboardLayout";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EduRit | Admin",
  description: "Made with ❤️ by EduRit",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable}`}>
        <Provider>
          <UserProvider user={user}>
            <DashboardLayout>{children}</DashboardLayout>
          </UserProvider>
        </Provider>
      </body>
    </html>
  );
}
