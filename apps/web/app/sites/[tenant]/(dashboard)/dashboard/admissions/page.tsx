import type { Metadata } from "next";
import AdmissionsPage from "./components/AdmissionsPage";

export const metadata: Metadata = { title: "Admissions" };

const page = () => <AdmissionsPage />;

export default page;
