import type { Metadata } from "next";
import NoticeBoardPage from "./components/NoticeBoardPage";

export const metadata: Metadata = { title: "Notice Board" };

const page = () => <NoticeBoardPage />;

export default page;
