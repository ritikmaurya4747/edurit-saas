import type { Metadata } from "next";
import CertificatesPage from "./components/CertificatesPage";

export const metadata: Metadata = { title: "Certificates & ID Cards" };

const page = () => <CertificatesPage />;

export default page;
