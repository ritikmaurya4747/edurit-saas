import type { Metadata } from "next";
import DashboardHome from "./components/DashboardHome";

export const metadata: Metadata = { title: "Dashboard" };

const page = () => <DashboardHome />;

export default page;
