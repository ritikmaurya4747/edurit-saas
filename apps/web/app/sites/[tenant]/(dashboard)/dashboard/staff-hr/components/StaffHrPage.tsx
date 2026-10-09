"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader, Tabs, type TabItem } from "@/components/ui";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import type { StaffCreateResult, StaffItem } from "../types";
import DirectoryTab from "./DirectoryTab";
import LeavesTab from "./LeavesTab";
import AttendanceTab from "./AttendanceTab";
import AppraisalsTab from "./AppraisalsTab";
import PayrollTab from "./PayrollTab";
import StaffFormModal from "./StaffFormModal";
import StaffDetailModal from "./StaffDetailModal";
import { TemporaryPasswordModal } from "./shared";

type HrTab = "directory" | "leaves" | "attendance" | "appraisals" | "payroll";

const StaffHrPage = () => {
  const can = useCan();
  const router = useRouter();
  const tabs: TabItem<HrTab>[] = [
    ...(can(PERMISSIONS.STAFF_READ) ? [{ id: "directory" as const, label: "Directory" }] : []),
    { id: "leaves", label: "Leave management" },
    ...(can(PERMISSIONS.STAFF_READ) ? [{ id: "attendance" as const, label: "Attendance" }] : []),
    ...(can(PERMISSIONS.STAFF_READ) ? [{ id: "appraisals" as const, label: "Appraisals" }] : []),
    ...(can(PERMISSIONS.PAYROLL_MANAGE) ? [{ id: "payroll" as const, label: "Payroll" }] : []),
  ];
  const [activeTab, setActiveTab] = useState<HrTab | null>(null);
  const tab = activeTab && tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? "leaves");

  // null = closed, "new" = create, StaffItem = edit
  const [form, setForm] = useState<StaffItem | "new" | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [created, setCreated] = useState<StaffCreateResult | null>(null);

  const openAdd = useCallback(() => setForm("new"), []);
  const openView = useCallback((id: string) => setViewId(id), []);

  return (
    <div>
      <PageHeader
        title="Staff & HR"
        description="Manage employee directory, leave requests, attendance, appraisals, and payroll"
        actions={
          can(PERMISSIONS.STAFF_CREATE) && (
            <>
              <Button variant="secondary" onClick={() => router.push("/dashboard/staff-hr/import")}>
                <FileSpreadsheet className="h-4 w-4" /> Import from Excel
              </Button>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Staff
              </Button>
            </>
          )
        }
      />

      <Tabs<HrTab> tabs={tabs} active={tab} onChange={setActiveTab} />

      {tab === "directory" && <DirectoryTab onAdd={openAdd} onView={openView} />}
      {tab === "leaves" && <LeavesTab />}
      {tab === "attendance" && <AttendanceTab />}
      {tab === "appraisals" && <AppraisalsTab />}
      {tab === "payroll" && <PayrollTab />}
      {!tabs.length && <EmptyState title="No access" description="You do not have access to Staff & HR." />}

      {viewId && (
        <StaffDetailModal
          staffId={viewId}
          onClose={() => setViewId(null)}
          onEdit={(staff) => {
            setViewId(null);
            setForm(staff);
          }}
        />
      )}
      {form && (
        <StaffFormModal
          staff={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onCreated={(result) => {
            setActiveTab("directory");
            if (result.temporaryPassword) setCreated(result);
          }}
        />
      )}
      {created?.temporaryPassword && (
        <TemporaryPasswordModal
          open
          onClose={() => setCreated(null)}
          password={created.temporaryPassword}
          name={created.name}
          email={created.email}
        />
      )}
    </div>
  );
};

export default StaffHrPage;
