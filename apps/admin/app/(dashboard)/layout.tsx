import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import DashboardLayout from "../../components/layouts/Dashboard/DashboardLayout";
import Provider from "@/components/layouts/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduRit | Admin",
  description: "Made with ❤️ by EduRit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </Provider>
      </body>
    </html>
  );
}
