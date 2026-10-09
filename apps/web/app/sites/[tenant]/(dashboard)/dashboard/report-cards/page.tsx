import type { Metadata } from "next";
import ReportCardsPage from "./components/ReportCardsPage";

export const metadata: Metadata = { title: "Report Cards" };

const page = () => <ReportCardsPage />;

export default page;
