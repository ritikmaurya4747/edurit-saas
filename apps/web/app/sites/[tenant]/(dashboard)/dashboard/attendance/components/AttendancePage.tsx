"use client";

import { useState } from "react";
import { PageHeader, Tabs, type TabItem } from "@/components/ui";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import MarkAttendanceTab from "./MarkAttendanceTab";
import DailySummaryTab from "./DailySummaryTab";
import RegisterTab from "./RegisterTab";
import LeaveRequestsTab from "./LeaveRequestsTab";

type TabId = "mark" | "summary" | "register" | "leaves";

const AttendancePage = () => {
  const can = useCan();
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK);
  const [tab, setTab] = useState<TabId>(canMark ? "mark" : "summary");

  const tabs: TabItem<TabId>[] = [
    ...(canMark ? [{ id: "mark" as const, label: "Mark Attendance" }] : []),
    { id: "summary", label: "Daily Summary" },
    { id: "register", label: "Register / Reports" },
    { id: "leaves", label: "Leave Requests" },
  ];

  return (
    <div>
      <PageHeader title="Attendance" description="Take daily attendance, track class-wise summaries and manage student leaves" />
      <Tabs<TabId> tabs={tabs} active={tab} onChange={setTab} />

      {tab === "mark" && canMark && <MarkAttendanceTab />}
      {tab === "summary" && <DailySummaryTab />}
      {tab === "register" && <RegisterTab />}
      {tab === "leaves" && <LeaveRequestsTab />}
    </div>
  );
};

export default AttendancePage;
