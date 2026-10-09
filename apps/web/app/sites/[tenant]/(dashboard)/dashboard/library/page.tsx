import type { Metadata } from "next";
import LibraryPage from "./components/LibraryPage";

export const metadata: Metadata = { title: "Library" };

const page = () => <LibraryPage />;

export default page;
