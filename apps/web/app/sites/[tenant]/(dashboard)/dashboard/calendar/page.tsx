import type { Metadata } from "next";
import CalendarPage from "./components/CalendarPage";

export const metadata: Metadata = { title: "Academic Calendar" };

const page = () => <CalendarPage />;

export default page;
