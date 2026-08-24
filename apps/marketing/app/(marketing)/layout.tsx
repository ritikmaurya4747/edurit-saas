import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "../components/layout/header/Header";
import Footer from "../components/layout/footer/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


// TODO: agar future me domain change ho to sirf yahan update karo
const siteUrl = "https://edurit.ritikmaurya.in";
 
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
 
  title: {
    default: "EduRit ERP - School Management System",
    template: "%s | EduRit ERP",
  },
 
  description:
    "EduRit ek complete school management ERP hai — admissions, attendance, fees, exams, timetable aur parent-teacher communication, sab ek hi platform par.",
 
  keywords: [
    "school management system",
    "school erp software",
    "school erp india",
    "edurit",
    "student management system",
    "fee management software",
    "attendance management system",
    "online school erp",
    "fedena alternative",
  ],
 
  authors: [{ name: "Ritik Maurya", url: siteUrl }],
  creator: "Ritik Maurya",
  publisher: "EduRit",
  applicationName: "EduRit ERP",
  category: "Education Technology",
 
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "EduRit ERP",
    title: "EduRit ERP - School Management System",
    description:
      "Complete school management ERP — admissions, attendance, fees, exams aur communication, sab kuch ek jagah.",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "EduRit - School Management ERP",
      },
    ],
  },
 
  twitter: {
    card: "summary_large_image",
    title: "EduRit ERP - School Management System",
    description:
      "Complete school management ERP — admissions, attendance, fees, exams aur communication, sab kuch ek jagah.",
    images: ["/og-image.png"],
  },
 
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
 
  alternates: {
    canonical: siteUrl,
  },
 
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
 
  verification: {
    google: "your-google-search-console-verification-code",
  },
};
 
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};
 
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EduRit ERP",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description:
    "EduRit is a school management ERP system for admissions, attendance, fees, exams and communication.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer/>
      </body>
    </html>
  );
}
