import type { Metadata } from "next";
import ExamsPage from "./components/ExamsPage";

export const metadata: Metadata = { title: "Exams & Marks" };

const page = () => <ExamsPage />;

export default page;
