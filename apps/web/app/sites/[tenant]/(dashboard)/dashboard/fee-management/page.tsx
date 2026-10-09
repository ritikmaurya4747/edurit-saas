import type { Metadata } from "next";
import FeePage from "./components/FeePage";

export const metadata: Metadata = { title: "Fee Management" };

const page = () => <FeePage />;

export default page;
