import type { Metadata } from "next";
import MyResultsPage from "./components/MyResultsPage";

export const metadata: Metadata = { title: "My Results" };

const page = () => <MyResultsPage />;

export default page;
