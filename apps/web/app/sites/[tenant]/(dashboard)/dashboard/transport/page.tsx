import type { Metadata } from "next";
import TransportPage from "./components/TransportPage";

export const metadata: Metadata = { title: "Transport" };

const page = () => <TransportPage />;

export default page;
