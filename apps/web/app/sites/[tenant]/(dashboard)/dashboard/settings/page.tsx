import type { Metadata } from "next";
import SettingsPage from "./components/SettingsPage";

export const metadata: Metadata = { title: "Settings" };

const page = () => <SettingsPage />;

export default page;
