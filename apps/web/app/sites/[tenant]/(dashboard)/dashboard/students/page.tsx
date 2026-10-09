import type { Metadata } from "next";
import StudentsPage from "./components/StudentsPage";

export const metadata: Metadata = { title: "Students" };

const page = () => <StudentsPage />;

export default page;
