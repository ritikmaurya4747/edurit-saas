import type { Metadata } from "next";
import AcademicSetupPage from "./components/AcademicSetupPage";

export const metadata: Metadata = { title: "Academic Setup" };

const page = () => <AcademicSetupPage />;

export default page;
