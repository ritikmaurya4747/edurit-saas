import type { Metadata } from "next";
import MyServicesPage from "./components/MyServicesPage";

export const metadata: Metadata = { title: "Library & Transport" };

const page = () => <MyServicesPage />;

export default page;
