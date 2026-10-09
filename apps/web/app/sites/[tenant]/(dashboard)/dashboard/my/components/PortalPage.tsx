"use client";

import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { usePortalStudent } from "../hooks";
import type { PortalChild, PortalMe } from "../types";
import { ChildSwitcher } from "./portal-ui";

export const studentSubtitle = (student: PortalChild) =>
  [student.name, student.sectionLabel, student.rollNumber != null ? `Roll ${student.rollNumber}` : null].filter(Boolean).join(" · ");

export function NoStudentLinked() {
  return (
    <EmptyState
      title="No student profile is linked to this login yet"
      description="Please contact the school office so they can link your child's (or your own) student record to this account."
    />
  );
}

// Shell for every /dashboard/my/* page: resolves the logged-in portal user and
// the selected child, shows the child switcher, and renders the page body.
export default function PortalPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: (student: PortalChild) => string;
  actions?: (student: PortalChild) => ReactNode;
  children: (student: PortalChild, me: PortalMe) => ReactNode;
}) {
  const { me, children: kids, student, select } = usePortalStudent();

  if (me.isLoading) return <LoadingState />;
  if (me.error || !me.data) {
    return <ErrorState message={me.error?.message ?? "Could not load your profile."} onRetry={() => me.refetch()} />;
  }
  if (!student) {
    return (
      <div>
        <PageHeader title={title} />
        <NoStudentLinked />
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title={title}
          description={description ? description(student) : studentSubtitle(student)}
          actions={actions?.(student)}
        />
        <ChildSwitcher items={kids} activeId={student.id} onSelect={select} className="-mt-2 mb-5" />
      </div>
      {children(student, me.data)}
    </div>
  );
}
