"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button, EmptyState, Field, PageHeader, QueryState, Select } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { useSections, useStaffOptions, useSubjects } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import type { SectionTimetable, StaffTimetable } from "../types";
import CopyModal from "./CopyModal";
import EntryModal, { type SlotTarget } from "./EntryModal";
import LinkButton from "./LinkButton";
import TimetableGrid from "./TimetableGrid";

type View = "section" | "teacher";

const TimetablePage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.TIMETABLE_MANAGE);
  const user = useUser();
  const sections = useSections();
  const subjects = useSubjects();
  const staff = useStaffOptions();

  const [view, setView] = useState<View>("section");
  const [pickedSection, setPickedSection] = useState("");
  const [pickedStaff, setPickedStaff] = useState("");
  const [slot, setSlot] = useState<SlotTarget | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const teachers = (staff.data ?? []).filter((s) => s.isTeachingStaff || s.id === user?.staffId);
  const sectionId = pickedSection || sections.data?.[0]?.id || "";
  const staffId =
    pickedStaff ||
    (user?.staffId && teachers.some((t) => t.id === user.staffId) ? user.staffId : "") ||
    teachers[0]?.id ||
    "";

  const sectionTable = useApiQuery<SectionTimetable>(
    ["timetable", "section", sectionId],
    view === "section" && sectionId ? "timetable" : null,
    { sectionId },
  );
  const staffTable = useApiQuery<StaffTimetable>(
    ["timetable", "staff", staffId],
    view === "teacher" && staffId ? `timetable/staff/${staffId}` : null,
  );

  const noSections = !sections.isLoading && !sections.error && !sections.data?.length;
  const noSubjects = !subjects.isLoading && !subjects.error && !subjects.data?.length;
  const data = sectionTable.data;

  return (
    <div>
      <PageHeader
        title="Timetable"
        description={
          view === "section"
            ? `${data?.section.label ?? "Class"} · weekly schedule${data ? ` · ${data.academicYear.name}` : ""}`
            : "Teacher's weekly schedule across sections"
        }
        actions={
          view === "section" &&
          canManage &&
          data && (
            <Button variant="secondary" onClick={() => setCopyOpen(true)}>
              <Copy className="h-4 w-4" /> Copy from section
            </Button>
          )
        }
      />

      {noSections ? (
        <EmptyState
          title="No classes or sections yet"
          description="Create classes, sections and subjects in Academic Setup, then build the timetable here."
          action={<LinkButton href="/dashboard/academics">Go to Academic Setup</LinkButton>}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="inline-flex self-start rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              {(["section", "teacher"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                    view === v ? "bg-[#1C263A] text-white shadow" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {v === "section" ? "Class view" : "Teacher view"}
                </button>
              ))}
            </div>
            {view === "section" ? (
              <Field label="Section" className="md:w-64">
                <Select
                  value={sectionId}
                  onChange={(e) => setPickedSection(e.target.value)}
                  options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
                />
              </Field>
            ) : (
              <Field label="Teacher" className="md:w-72">
                <Select
                  value={staffId}
                  onChange={(e) => setPickedStaff(e.target.value)}
                  placeholder={teachers.length ? undefined : "No teaching staff"}
                  options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Field>
            )}
          </div>

          {view === "section" && canManage && noSubjects && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <span>Add subjects in Academic Setup before filling the timetable.</span>
              <LinkButton href="/dashboard/academics" variant="secondary">
                Add subjects
              </LinkButton>
            </div>
          )}

          {view === "section" ? (
            <QueryState
              isLoading={sections.isLoading || sectionTable.isLoading}
              error={sections.error || sectionTable.error}
              onRetry={() => (sections.error ? sections.refetch() : sectionTable.refetch())}
            >
              {data && (
                <>
                  {!data.entries.length && (
                    <p className="mb-3 text-sm text-gray-500">
                      No periods scheduled for {data.section.label} yet.
                      {canManage && " Click + on any slot to add a period, or copy from another section."}
                    </p>
                  )}
                  <TimetableGrid
                    entries={data.entries}
                    mode="section"
                    onCellClick={
                      canManage
                        ? (s, entry) =>
                            setSlot({
                              ...s,
                              sectionId: data.section.id,
                              sectionLabel: data.section.label,
                              academicYearId: data.academicYear.id,
                              entry,
                            })
                        : undefined
                    }
                  />
                </>
              )}
            </QueryState>
          ) : !staff.isLoading && !teachers.length ? (
            <EmptyState
              title="No teaching staff yet"
              description="Add teachers in Staff & HR to see their weekly schedules."
              action={<LinkButton href="/dashboard/staff-hr">Go to Staff & HR</LinkButton>}
            />
          ) : (
            <QueryState
              isLoading={staff.isLoading || staffTable.isLoading}
              error={staff.error || staffTable.error}
              onRetry={() => (staff.error ? staff.refetch() : staffTable.refetch())}
            >
              {staffTable.data && (
                <>
                  <p className="mb-3 text-sm text-gray-500">
                    <span className="font-bold text-gray-800">{staffTable.data.staff.name}</span> ·{" "}
                    {staffTable.data.periodsPerWeek} period{staffTable.data.periodsPerWeek === 1 ? "" : "s"} per week ·{" "}
                    {staffTable.data.academicYear.name}
                  </p>
                  <TimetableGrid entries={staffTable.data.entries} mode="teacher" />
                </>
              )}
            </QueryState>
          )}
        </>
      )}

      <EntryModal target={slot} onClose={() => setSlot(null)} />
      {copyOpen && data && (
        <CopyModal
          open
          onClose={() => setCopyOpen(false)}
          toSection={data.section}
          academicYearId={data.academicYear.id}
        />
      )}
    </div>
  );
};

export default TimetablePage;
