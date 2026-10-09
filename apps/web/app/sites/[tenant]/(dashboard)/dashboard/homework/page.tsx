import type { Metadata } from "next";
import HomeworkPage from "./components/HomeworkPage";

export const metadata: Metadata = { title: "Homework" };

const page = () => <HomeworkPage />;

export default page;
