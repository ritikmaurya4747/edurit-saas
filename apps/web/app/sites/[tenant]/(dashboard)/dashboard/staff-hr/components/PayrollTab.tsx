"use client";

import { useMemo, useState } from "react";
import { Banknote, FileText, RefreshCw } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, QueryState, Select, StatTile } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PayrollItem, PayrollResponse } from "../types";
import { MONTH_OPTIONS, PersonCell, STAFF_INVALIDATE, monthLabel, yearOptions } from "./shared";
import PayslipModal from "./PayslipModal";

type EditForm = { item: PayrollItem; basicSalary: string; allowances: string; deductions: string };

export default function PayrollTab() {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const money = (v: string | number | null | undefined) => formatCurrency(v, currency);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const period = { month: Number(month), year: Number(year) };
  const periodLabel = monthLabel(period.month, period.year);

  const [edit, setEdit] = useState<EditForm | null>(null);
  const [payslipId, setPayslipId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<PayrollItem | null>(null);
  const [toDisburse, setToDisburse] = useState<PayrollItem | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const payroll = useApiQuery<PayrollResponse>(["staff", "payroll"], "payroll", { month, year });
  const records = useMemo(() => payroll.data?.records ?? [], [payroll.data]);
  const totals = payroll.data?.totals;

  const generate = useApiMutation(() => api.post<{ created: number; skipped: number }>("payroll/generate", period), {
    invalidate: STAFF_INVALIDATE,
    success: (r) => (r.created ? `Payroll generated for ${r.created} staff member(s)` : "Payroll already exists for every active staff member"),
  });
  const update = useApiMutation(
    (f: EditForm) =>
      api.patch(`payroll/${f.item.id}`, {
        basicSalary: Number(f.basicSalary || 0),
        allowances: Number(f.allowances || 0),
        deductions: Number(f.deductions || 0),
      }),
    { invalidate: STAFF_INVALIDATE, success: "Salary updated", onSuccess: () => setEdit(null) },
  );
  const disburse = useApiMutation((id: string) => api.post(`payroll/${id}/disburse`), {
    invalidate: STAFF_INVALIDATE,
    success: "Salary marked as disbursed",
    onSuccess: () => setToDisburse(null),
  });
  const disburseAll = useApiMutation(() => api.post<{ disbursed: number }>("payroll/disburse-all", period), {
    invalidate: STAFF_INVALIDATE,
    success: (r) => `${r.disbursed} salaries marked as disbursed`,
    onSuccess: () => setConfirmAll(false),
  });
  const remove = useApiMutation((id: string) => api.delete(`payroll/${id}`), {
    invalidate: STAFF_INVALIDATE,
    success: "Payroll record deleted",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<PayrollItem>[]>(
    () => {
      const m = (v: string | number) => formatCurrency(v, currency);
      return [
      {
        id: "staff",
        header: "Staff",
        cell: ({ row }) => <PersonCell name={row.original.staffName} sub={[row.original.employeeCode, row.original.designation].filter(Boolean).join(" · ")} />,
      },
      { accessorKey: "basicSalary", header: "Basic", cell: ({ row }) => <span className="text-gray-600">{m(row.original.basicSalary)}</span> },
      { accessorKey: "allowances", header: "Allowances", cell: ({ row }) => <span className="text-gray-600">{m(row.original.allowances)}</span> },
      {
        accessorKey: "deductions",
        header: "Deductions",
        cell: ({ row }) => (
          <span className={Number(row.original.deductions) ? "font-semibold text-red-600" : "text-gray-600"}>{m(row.original.deductions)}</span>
        ),
      },
      { accessorKey: "netSalary", header: "Net pay", cell: ({ row }) => <span className="font-bold text-green-700">{m(row.original.netSalary)}</span> },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.isDisbursed ? (
            <div>
              <Badge tone="green">Paid</Badge>
              <p className="mt-1 whitespace-nowrap text-xs text-gray-400">{formatDate(row.original.disbursedAt)}</p>
            </div>
          ) : (
            <Badge tone="blue">Pending</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-end gap-2">
              {!r.isDisbursed && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setEdit({
                        item: r,
                        basicSalary: String(Number(r.basicSalary)),
                        allowances: String(Number(r.allowances)),
                        deductions: String(Number(r.deductions)),
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => setToDisburse(r)}>
                    Disburse
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setPayslipId(r.id)}>
                <FileText className="h-3.5 w-3.5" /> Payslip
              </Button>
              {!r.isDisbursed && (
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setToDelete(r)}>
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ];
    },
    [currency],
  );

  const editNet = edit ? Number(edit.basicSalary || 0) + Number(edit.allowances || 0) - Number(edit.deductions || 0) : 0;
  const pendingCount = totals ? totals.count - totals.disbursedCount : 0;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:w-96">
          <Select value={month} onChange={(e) => setMonth(e.target.value)} options={MONTH_OPTIONS} />
          <Select value={year} onChange={(e) => setYear(e.target.value)} options={yearOptions()} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => generate.mutate()} loading={generate.isPending}>
            <RefreshCw className="h-4 w-4" /> Generate payroll
          </Button>
          {pendingCount > 0 && (
            <Button onClick={() => setConfirmAll(true)}>
              <Banknote className="h-4 w-4" /> Disburse all ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {totals && totals.count > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Gross payroll" value={money(totals.gross)} hint={`${totals.count} staff`} />
          <StatTile label="Deductions" value={money(totals.deductions)} tone={totals.deductions ? "danger" : "default"} />
          <StatTile label="Net payable" value={money(totals.net)} />
          <StatTile label="Disbursed" value={money(totals.disbursed)} tone="success" hint={`${totals.disbursedCount} paid`} />
          <StatTile label="Pending" value={money(totals.pending)} tone={totals.pending ? "warning" : "default"} hint={`${pendingCount} unpaid`} />
        </div>
      )}

      <QueryState
        isLoading={payroll.isLoading}
        error={payroll.error}
        onRetry={() => payroll.refetch()}
        isEmpty={!records.length}
        empty={
          <EmptyState
            title={`No payroll for ${periodLabel}`}
            description="Generate payroll to create salary records for every active staff member. Loss-of-pay days are deducted automatically from attendance and unpaid leave."
            action={
              <Button onClick={() => generate.mutate()} loading={generate.isPending}>
                <RefreshCw className="h-4 w-4" /> Generate payroll
              </Button>
            }
          />
        }
      >
        <DataTable columns={columns} data={records} />
      </QueryState>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        size="sm"
        title={`Edit salary · ${edit?.item.staffName ?? ""}`}
        description={periodLabel}
        onSubmit={() => edit && editNet >= 0 && update.mutate(edit)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)} disabled={update.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending} disabled={editNet < 0}>
              Save
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Basic salary" required>
              <Input type="number" min={0} step="0.01" required value={edit.basicSalary} onChange={(e) => setEdit({ ...edit, basicSalary: e.target.value })} />
            </Field>
            <Field label="Allowances" hint="HRA, transport, bonus…">
              <Input type="number" min={0} step="0.01" value={edit.allowances} onChange={(e) => setEdit({ ...edit, allowances: e.target.value })} />
            </Field>
            <Field label="Deductions" hint="Loss of pay, PF, advances…">
              <Input type="number" min={0} step="0.01" value={edit.deductions} onChange={(e) => setEdit({ ...edit, deductions: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between rounded-lg bg-[#FCFBF8] px-4 py-3">
              <span className="text-sm font-semibold text-gray-600">Net salary</span>
              <span className={editNet < 0 ? "font-bold text-red-600" : "font-serif text-xl font-bold text-gray-900"}>{money(editNet)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDisburse}
        onClose={() => setToDisburse(null)}
        onConfirm={() => toDisburse && disburse.mutate(toDisburse.id)}
        loading={disburse.isPending}
        tone="primary"
        title="Mark salary as disbursed?"
        message={toDisburse ? `${money(toDisburse.netSalary)} to ${toDisburse.staffName} for ${periodLabel}. The record is locked after disbursal.` : ""}
        confirmLabel="Disburse"
      />
      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={() => disburseAll.mutate()}
        loading={disburseAll.isPending}
        tone="primary"
        title={`Disburse all salaries for ${periodLabel}?`}
        message={`${pendingCount} pending salaries totalling ${money(totals?.pending)} will be marked as paid and locked.`}
        confirmLabel="Disburse all"
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="Delete payroll record?"
        message={toDelete ? `${toDelete.staffName}'s salary record for ${periodLabel} will be removed. You can generate it again later.` : ""}
        confirmLabel="Delete"
      />
      {payslipId && <PayslipModal payrollId={payslipId} onClose={() => setPayslipId(null)} />}
    </div>
  );
}
