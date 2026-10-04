import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "./lib/constants";
import { Navbar } from "./components/navigation/Navbar";
import { Footer } from "./components/footer/Footer";
import { EffectsBoot } from "./components/ui/EffectsBoot";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "EduRit ERP - School Management System",
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: SITE.keywords,
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  applicationName: "EduRit ERP",
  category: "Education Technology",
  openGraph: {
    title: `${SITE.name} — School management platform`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — School management platform`,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <EffectsBoot />
      </body>
    </html>
  );
}
