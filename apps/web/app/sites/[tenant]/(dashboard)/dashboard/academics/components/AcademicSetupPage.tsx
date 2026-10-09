"use client";

import { useState } from "react";
import { PageHeader, Tabs } from "@/components/ui";
import { useClasses, useSubjects, useAcademicYears, useBranches } from "@/lib/api/lookups";
import ClassesTab from "./ClassesTab";
import SubjectsTab from "./SubjectsTab";
import YearsTab from "./YearsTab";
import BranchesTab from "./BranchesTab";

type TabId = "classes" | "subjects" | "years" | "branches";

const AcademicSetupPage = () => {
  const [tab, setTab] = useState<TabId>("classes");
  const classes = useClasses();
  const subjects = useSubjects();
  const years = useAcademicYears();
  const branches = useBranches();

  return (
    <div>
      <PageHeader
        title="Academic Setup"
        description="Configure academic sessions, classes, sections, subjects and campuses for your school"
      />

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "classes", label: "Classes & Sections", count: classes.data?.length },
          { id: "subjects", label: "Subjects", count: subjects.data?.length },
          { id: "years", label: "Academic Years", count: years.data?.length },
          { id: "branches", label: "Branches", count: branches.data?.length },
        ]}
      />

      {tab === "classes" && <ClassesTab />}
      {tab === "subjects" && <SubjectsTab />}
      {tab === "years" && <YearsTab />}
      {tab === "branches" && <BranchesTab />}
    </div>
  );
};

export default AcademicSetupPage;
