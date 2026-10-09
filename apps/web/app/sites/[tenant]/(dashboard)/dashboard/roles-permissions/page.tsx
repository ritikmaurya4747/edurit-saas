import type { Metadata } from "next";
import RolesPermissionsPage from "./components/RolesPermissionsPage";

export const metadata: Metadata = { title: "Roles & Permissions" };

const page = () => <RolesPermissionsPage />;

export default page;
