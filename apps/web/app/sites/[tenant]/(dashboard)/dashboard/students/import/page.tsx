import type { Metadata } from "next";
import StudentImportPage from "./components/StudentImportPage";

export const metadata: Metadata = { title: "Import Students" };

const page = () => <StudentImportPage />;

export default page;
