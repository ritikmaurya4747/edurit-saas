import type { Metadata } from "next";
import BulkLoginsPage from "./components/BulkLoginsPage";

export const metadata: Metadata = { title: "Student & Parent Logins" };

const page = () => <BulkLoginsPage />;

export default page;
