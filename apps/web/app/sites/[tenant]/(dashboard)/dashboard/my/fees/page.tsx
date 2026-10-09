import type { Metadata } from "next";
import MyFeesPage from "./components/MyFeesPage";

export const metadata: Metadata = { title: "My Fees" };

const page = () => <MyFeesPage />;

export default page;
