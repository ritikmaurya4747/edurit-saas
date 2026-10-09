import type { Metadata } from "next";
import FrontOfficePage from "./components/FrontOfficePage";

export const metadata: Metadata = { title: "Front Office" };

const page = () => <FrontOfficePage />;

export default page;
