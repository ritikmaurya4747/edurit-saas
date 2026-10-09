import type { Metadata } from "next";
import StudentProfilePage from "../components/profile/StudentProfilePage";

export const metadata: Metadata = { title: "Student Profile" };

// The client component reads studentId with useParams().
const page = () => <StudentProfilePage />;

export default page;
