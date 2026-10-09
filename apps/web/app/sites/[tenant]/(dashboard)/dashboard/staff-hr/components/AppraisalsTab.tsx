"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Star } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState, Select, StatTile, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useCurrentAcademicYear } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import type { AppraisalItem, AppraisalStatus } from "../types";
import { PersonCell, STAFF_INVALIDATE } from "./shared";

type ReviewForm = { item: AppraisalItem; rating: string; remarks: string; status: AppraisalStatus };

// "2026-27" style session for the current date (sessions start in April).
const sessionFor = (date: Date) => {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(-2)}`;
};

export default function AppraisalsTab() {
  const can = useCan();
  const canManage = can(PERMISSIONS.STAFF_UPDATE);
  const currentYear = useCurrentAcademicYear();
  const defaultPeriod = currentYear.data?.name ?? sessionFor(new Date());
  const [periodChoice, setPeriodChoice] = useState<string | null>(null);
  const period = periodChoice ?? defaultPeriod;
  const [status, setStatus] = useState("");
  const [review, setReview] = useState<ReviewForm | null>(null);
  const [confirmStart, setConfirmStart] = useState(false);

  const periods = useApiQuery<string[]>(["staff", "appraisal-periods"], "staff-appraisals/periods");
  const appraisals = useApiQuery<AppraisalItem[]>(["staff", "appraisals"], "staff-appraisals", { period, status });

  const periodOptions = useMemo(() => {
    const now = new Date();
    const generated = [-1, 0, 1].map((offset) => sessionFor(new Date(now.getFullYear() + offset, now.getMonth(), 1)));
    const all = new Set([defaultPeriod, ...generated, ...(periods.data ?? [])]);
    return [...all].sort().reverse().map((p) => ({ value: p, label: p }));
  }, [defaultPeriod, periods.data]);

  const startCycle = useApiMutation(() => api.post<{ created: number; skipped: number }>("staff-appraisals", { period }), {
    invalidate: STAFF_INVALIDATE,
    success: (r) => (r.created ? `${r.created} appraisal(s) created for ${period}` : `Every active staff member already has an appraisal for ${period}`),
    onSuccess: () => setConfirmStart(false),
  });
  const save = useApiMutation(
    (f: ReviewForm) =>
      api.patch(`staff-appraisals/${f.item.id}`, {
        rating: f.rating === "" ? undefined : Math.round(Number(f.rating) * 10) / 10,
        remarks: f.remarks,
        status: f.status,
      }),
    { invalidate: STAFF_INVALIDATE, success: "Appraisal saved", onSuccess: () => setReview(null) },
  );

  const rows = useMemo(() => appraisals.data ?? [], [appraisals.data]);
  const completed = rows.filter((r) => r.status === "COMPLETED");
  const avg = completed.length ? completed.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / completed.length : null;

  const columns = useMemo<ColumnDef<AppraisalItem>[]>(
    () => [
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) => <PersonCell name={row.original.staffName} sub={[row.original.employeeCode, row.original.designation].filter(Boolean).join(" · ")} />,
      },
      { accessorKey: "period", header: "Review period", cell: ({ row }) => <span className="text-gray-600">{row.original.period}</span> },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) =>
          row.original.rating != null ? (
            <span className="inline-flex items-center gap-1 font-bold text-gray-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {Number(row.original.rating).toFixed(1)} / 5
            </span>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <p className="max-w-[260px] truncate text-gray-600" title={row.original.remarks ?? undefined}>
            {row.original.remarks || "—"}
          </p>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div>
            <Badge tone={row.original.status === "COMPLETED" ? "green" : "yellow"}>
              {row.original.status === "COMPLETED" ? "Completed" : "Pending"}
            </Badge>
            {row.original.reviewedAt && <p className="mt-1 text-xs text-gray-400">{formatDate(row.original.reviewedAt)}</p>}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) =>
          canManage ? (
            <Button
              variant={row.original.status === "COMPLETED" ? "secondary" : "primary"}
              size="sm"
              onClick={() =>
                setReview({
                  item: row.original,
                  rating: row.original.rating != null ? String(Number(row.original.rating)) : "",
                  remarks: row.original.remarks ?? "",
                  status: "COMPLETED",
                })
              }
            >
              {row.original.status === "COMPLETED" ? "Edit review" : "Submit review"}
            </Button>
          ) : null,
      },
    ],
    [canManage],
  );

  const ratingNumber = review && review.rating !== "" ? Number(review.rating) : null;
  const ratingInvalid = ratingNumber != null && (ratingNumber < 1 || ratingNumber > 5);
  const needsRating = review?.status === "COMPLETED" && ratingNumber == null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:w-96">
          <Select value={period} onChange={(e) => setPeriodChoice(e.target.value)} options={periodOptions} />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={[
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
            ]}
          />
        </div>
        {canManage && (
          <Button onClick={() => setConfirmStart(true)}>
            <PlayCircle className="h-4 w-4" /> Start cycle
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Appraisals" value={rows.length} />
          <StatTile label="Completed" value={completed.length} tone="success" />
          <StatTile label="Pending" value={rows.length - completed.length} tone={rows.length - completed.length ? "warning" : "default"} />
          <StatTile label="Average rating" value={avg != null ? avg.toFixed(1) : "—"} hint="Completed reviews" />
        </div>
      )}

      <QueryState
        isLoading={appraisals.isLoading}
        error={appraisals.error}
        onRetry={() => appraisals.refetch()}
        isEmpty={!rows.length}
        empty={
          <EmptyState
            title={`No appraisals for ${period}`}
            description="Start the appraisal cycle to create a pending review for every active staff member."
            action={
              canManage && (
                <Button onClick={() => setConfirmStart(true)}>
                  <PlayCircle className="h-4 w-4" /> Start cycle
                </Button>
              )
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
      </QueryState>

      <ConfirmDialog
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={() => startCycle.mutate()}
        loading={startCycle.isPending}
        tone="primary"
        title={`Start ${period} appraisal cycle?`}
        message="A pending appraisal is created for every active staff member who does not have one for this period yet."
        confirmLabel="Start cycle"
      />

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={`Review · ${review?.item.staffName ?? ""}`}
        description={review ? `${review.item.designation ?? "Staff"} · ${review.item.period}` : undefined}
        onSubmit={() => review && !ratingInvalid && !needsRating && save.mutate(review)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReview(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={ratingInvalid || needsRating}>
              Save review
            </Button>
          </>
        }
      >
        {review && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Rating (1–5)"
              required={review.status === "COMPLETED"}
              error={ratingInvalid ? "Rating must be between 1 and 5" : needsRating ? "A rating is required to complete the review" : undefined}
            >
              <Input
                type="number"
                min={1}
                max={5}
                step="0.1"
                value={review.rating}
                onChange={(e) => setReview({ ...review, rating: e.target.value })}
                placeholder="4.5"
              />
            </Field>
            <Field label="Status">
              <Select
                value={review.status}
                onChange={(e) => setReview({ ...review, status: e.target.value as AppraisalStatus })}
                options={[
                  { value: "COMPLETED", label: "Completed" },
                  { value: "PENDING", label: "Pending (save draft)" },
                ]}
              />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <Textarea rows={4} maxLength={5000} value={review.remarks} onChange={(e) => setReview({ ...review, remarks: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
