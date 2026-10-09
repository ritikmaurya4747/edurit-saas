import type { Metadata } from "next";
import MyAttendancePage from "./components/MyAttendancePage";

export const metadata: Metadata = { title: "My Attendance" };

const page = () => <MyAttendancePage />;

export default page;
