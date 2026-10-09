"use client";

import { useMemo, useState } from "react";
import { Globe, Plus } from "lucide-react";
import { Button, ConfirmDialog, EmptyState, Field, PageHeader, QueryState, StatTile, Tabs, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatNumber } from "@/lib/utils/format";
import {
  STAGE_LABEL,
  type AdmissionStage,
  type AdmissionStats,
  type Enquiry,
  type EnquiryActions,
} from "../types";
import AdmitModal from "./AdmitModal";
import EnquiryFormModal from "./EnquiryFormModal";
import OnlineFormModal from "./OnlineFormModal";
import { AllEnquiriesTab, EntranceTestsTab, WaitlistTab } from "./EnquiryTables";
import PipelineBoard from "./PipelineBoard";
import TestResultModal from "./TestResultModal";

type TabId = "pipeline" | "waitlist" | "tests" | "all";

const AdmissionsPage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.ADMISSIONS_MANAGE);
  const canAdmit = can(PERMISSIONS.ADMISSIONS_MANAGE, PERMISSIONS.STUDENT_CREATE);

  const [tab, setTab] = useState<TabId>("pipeline");
  const [formTarget, setFormTarget] = useState<Enquiry | null | undefined>(undefined);
  const [admitTarget, setAdmitTarget] = useState<Enquiry | null>(null);
  const [testTarget, setTestTarget] = useState<Enquiry | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Enquiry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [onlineFormOpen, setOnlineFormOpen] = useState(false);

  const stats = useApiQuery<AdmissionStats>(["admissions", "stats"], "admissions/stats");
  const enquiries = useApiQuery<Enquiry[]>(["admissions", "list"], "admissions");

  const move = useApiMutation(
    ({ enquiry, stage, notes }: { enquiry: Enquiry; stage: AdmissionStage; notes?: string }) => {
      setMovingId(enquiry.id);
      return api.patch<Enquiry>(`admissions/${enquiry.id}/stage`, { stage, notes });
    },
    {
      invalidate: [["admissions"], ["dashboard"]],
      success: (e) => `${e.studentName} moved to ${STAGE_LABEL[e.stage]}`,
      onSuccess: () => {
        setMovingId(null);
        setRejectTarget(null);
        setRejectReason("");
      },
    },
  );

  const remove = useApiMutation((e: Enquiry) => api.delete(`admissions/${e.id}`), {
    invalidate: [["admissions"], ["dashboard"]],
    success: "Enquiry deleted",
    onSuccess: () => setDeleteTarget(null),
  });

  const actions = useMemo<EnquiryActions>(
    () => ({
      canManage,
      canAdmit,
      movingId: move.isPending ? movingId : null,
      move: (enquiry, stage) => move.mutate({ enquiry, stage }),
      edit: setFormTarget,
      admit: setAdmitTarget,
      reject: (e) => {
        setRejectReason("");
        setRejectTarget(e);
      },
      recordTest: setTestTarget,
      remove: setDeleteTarget,
    }),
    // move.mutate is stable; isPending drives the busy state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, canAdmit, move.isPending, movingId],
  );

  const s = stats.data?.byStage;
  const list = enquiries.data ?? [];

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Track enquiries from first contact to admission"
        actions={
          <>
            <Button variant="outline" onClick={() => setOnlineFormOpen(true)}>
              <Globe className="h-4 w-4" /> Online form
            </Button>
            {canManage && (
              <Button onClick={() => setFormTarget(null)}>
                <Plus className="h-4 w-4" /> New Enquiry
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <StatTile label="Total enquiries" value={stats.data ? formatNumber(stats.data.total) : "—"} />
        <StatTile label="New enquiries" value={s ? s.ENQUIRY : "—"} />
        <StatTile label="Doc. verification" value={s ? s.DOCUMENT_VERIFICATION : "—"} />
        <StatTile label="Entrance test" value={s ? s.ENTRANCE_TEST : "—"} />
        <StatTile label="Offers sent" value={s ? s.OFFER_SENT : "—"} tone="warning" />
        <StatTile label="Admitted" value={s ? s.ADMITTED : "—"} tone="success" hint={s ? `${s.WAITLISTED} waitlisted · ${s.REJECTED} rejected` : undefined} />
        <StatTile label="Conversion rate" value={stats.data ? `${stats.data.conversionRate}%` : "—"} hint="Admitted ÷ all enquiries" />
      </div>

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "pipeline", label: "Pipeline" },
          { id: "waitlist", label: "Waitlist", count: s?.WAITLISTED },
          { id: "tests", label: "Entrance Tests", count: s?.ENTRANCE_TEST },
          { id: "all", label: "All Enquiries", count: stats.data?.total },
        ]}
      />

      {tab === "all" ? (
        <AllEnquiriesTab actions={actions} onCreate={() => setFormTarget(null)} />
      ) : (
        <QueryState
          isLoading={enquiries.isLoading}
          error={enquiries.error}
          onRetry={() => enquiries.refetch()}
          isEmpty={tab === "pipeline" && list.length === 0}
          empty={
            <EmptyState
              title="No enquiries yet"
              description="Add your first admission enquiry to start tracking applicants through the pipeline."
              action={
                canManage && (
                  <Button onClick={() => setFormTarget(null)}>
                    <Plus className="h-4 w-4" /> New Enquiry
                  </Button>
                )
              }
            />
          }
        >
          {tab === "pipeline" && <PipelineBoard enquiries={list} actions={actions} />}
          {tab === "waitlist" && <WaitlistTab enquiries={list} actions={actions} />}
          {tab === "tests" && <EntranceTestsTab enquiries={list} actions={actions} />}
        </QueryState>
      )}

      <EnquiryFormModal enquiry={formTarget} onClose={() => setFormTarget(undefined)} />
      <OnlineFormModal open={onlineFormOpen} onClose={() => setOnlineFormOpen(false)} />
      <AdmitModal enquiry={admitTarget} onClose={() => setAdmitTarget(null)} />
      <TestResultModal enquiry={testTarget} onClose={() => setTestTarget(null)} />

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={() =>
          rejectTarget && move.mutate({ enquiry: rejectTarget, stage: "REJECTED", notes: rejectReason.trim() || undefined })
        }
        loading={move.isPending}
        title={`Reject ${rejectTarget?.studentName}?`}
        confirmLabel="Reject"
        message={
          <div className="space-y-3">
            <p>The enquiry moves to Rejected. You can reopen it later from All Enquiries.</p>
            <Field label="Reason (optional)">
              <Textarea rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </Field>
          </div>
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget)}
        loading={remove.isPending}
        title={`Delete enquiry for ${deleteTarget?.studentName}?`}
        message="This permanently removes the enquiry and its notes."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default AdmissionsPage;
