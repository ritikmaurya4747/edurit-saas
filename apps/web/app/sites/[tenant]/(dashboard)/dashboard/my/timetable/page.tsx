import type { Metadata } from "next";
import MyTimetablePage from "./components/MyTimetablePage";

export const metadata: Metadata = { title: "My Timetable" };

const page = () => <MyTimetablePage />;

export default page;
