import type { Metadata } from "next";
import TimetablePage from "./components/TimetablePage";

export const metadata: Metadata = { title: "Timetable" };

const page = () => <TimetablePage />;

export default page;
