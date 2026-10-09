import type { Metadata } from "next";
import MyHomeworkPage from "./components/MyHomeworkPage";

export const metadata: Metadata = { title: "My Homework" };

const page = () => <MyHomeworkPage />;

export default page;
