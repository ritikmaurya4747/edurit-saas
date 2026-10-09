import type { Metadata } from "next";
import DashboardHome from "./components/DashboardHome";
import PortalSwitch from "./my/components/PortalSwitch";

export const metadata: Metadata = { title: "Dashboard" };

// Students/parents see the self-service portal home; staff the ERP dashboard.
const page = () => <PortalSwitch staff={<DashboardHome />} />;

export default page;
