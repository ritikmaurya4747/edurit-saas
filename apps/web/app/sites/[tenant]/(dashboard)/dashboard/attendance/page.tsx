import type { Metadata } from "next";
import AttendancePage from "./components/AttendancePage";

export const metadata: Metadata = { title: "Attendance" };

const page = () => <AttendancePage />;

export default page;
