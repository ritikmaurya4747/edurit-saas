"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Archive, ArrowRightLeft, Pencil } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, ErrorState, LoadingState, Tabs } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { getInitials, humanize } from "@/lib/utils/format";
import { STATUS_TONE, type StudentProfile } from "../../types";
import EditStudentModal from "../EditStudentModal";
import ChangeSectionModal from "./ChangeSectionModal";
import EnrollmentTab from "./EnrollmentTab";
import GuardiansTab from "./GuardiansTab";
import OverviewTab from "./OverviewTab";

type TabId = "overview" | "guardians" | "enrollment";

const StudentProfilePage = () => {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? "";
  const router = useRouter();
  const can = useCan();
  const canUpdate = can(PERMISSIONS.STUDENT_UPDATE);

  const [tab, setTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const [changingSection, setChangingSection] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const query = useApiQuery<StudentProfile>(["students", "detail", studentId], studentId ? `students/${studentId}` : null);

  const archive = useApiMutation(() => api.delete(`students/${studentId}`), {
    invalidate: [["students"], ["dashboard"], ["sections"], ["classes"]],
    success: "Student archived",
    onSuccess: () => router.push("/dashboard/students"),
  });

  const backLink = (
    <Link
      href="/dashboard/students"
      className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> All students
    </Link>
  );

  if (query.isLoading) return <LoadingState label="Loading student…" />;
  if (query.error || !query.data) {
    return (
      <div>
        {backLink}
        <ErrorState message={query.error?.message ?? "Student not found"} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const s = query.data;

  return (
    <div>
      {backLink}

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1C263A] text-lg font-bold text-white">
              {getInitials(s.name)}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold text-gray-900">{s.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="font-bold text-gray-700">{s.admissionNumber}</span>
                <span>
                  {s.currentEnrollment
                    ? `${s.currentEnrollment.sectionLabel}${s.currentEnrollment.rollNumber ? ` · Roll ${s.currentEnrollment.rollNumber}` : ""}`
                    : "Not enrolled this year"}
                </span>
                <Badge tone={STATUS_TONE[s.status]}>{humanize(s.status)}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setChangingSection(true)}>
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Change section
                </Button>
              </>
            )}
            {can(PERMISSIONS.STUDENT_DELETE) && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setArchiving(true)}>
                <Archive className="h-3.5 w-3.5" /> Archive
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "guardians", label: "Guardians", count: s.guardians.length },
          { id: "enrollment", label: "Enrollment history", count: s.enrollments.length },
        ]}
      />

      {tab === "overview" && <OverviewTab student={s} />}
      {tab === "guardians" && <GuardiansTab student={s} canManage={canUpdate} />}
      {tab === "enrollment" && (
        <EnrollmentTab student={s} canManage={canUpdate} onChangeSection={() => setChangingSection(true)} />
      )}

      <EditStudentModal studentId={editing ? s.id : null} onClose={() => setEditing(false)} />
      <ChangeSectionModal student={s} open={changingSection} onClose={() => setChangingSection(false)} />
      <ConfirmDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        onConfirm={() => archive.mutate()}
        loading={archive.isPending}
        title={`Archive ${s.name}?`}
        message="The student is removed from class lists and their admission number becomes available again. Attendance, marks and fee history are kept."
        confirmLabel="Archive"
      />
    </div>
  );
};

export default StudentProfilePage;
