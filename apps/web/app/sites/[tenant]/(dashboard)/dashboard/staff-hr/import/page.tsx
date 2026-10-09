import type { Metadata } from "next";
import StaffImportPage from "./components/StaffImportPage";

export const metadata: Metadata = { title: "Import Staff" };

const page = () => <StaffImportPage />;

export default page;
