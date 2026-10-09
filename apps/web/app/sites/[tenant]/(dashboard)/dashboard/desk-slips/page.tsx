import type { Metadata } from "next";
import DeskSlipsPage from "./components/DeskSlipsPage";

export const metadata: Metadata = { title: "Desk Slips" };

const page = () => <DeskSlipsPage />;

export default page;
