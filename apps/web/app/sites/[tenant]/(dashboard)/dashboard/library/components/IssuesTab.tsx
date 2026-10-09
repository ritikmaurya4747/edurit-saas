"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  QueryState,
  SearchInput,
  Select,
  Tabs,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { useUser } from "@/providers/user-provider";
import { formatCurrency, formatDate, formatDateTime, todayInput } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_LOAN_DAYS,
  FINE_PER_DAY,
  LIBRARY_KEYS,
  daysBetween,
  type BookIssue,
  type BorrowerType,
  type IssueStatus,
} from "./types";

const STATUS_TABS: { id: IssueStatus; label: string }[] = [
  { id: "issued", label: "Issued" },
  { id: "overdue", label: "Overdue" },
  { id: "returned", label: "Returned" },
];

const IssuesTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.LIBRARY_MANAGE);
  const user = useUser();
  const currency = user?.currency ?? "INR";

  const [status, setStatus] = useState<IssueStatus>("issued");
  const [borrowerType, setBorrowerType] = useState<BorrowerType | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [returning, setReturning] = useState<BookIssue | null>(null);
  const [renewing, setRenewing] = useState<BookIssue | null>(null);
  const [payingFine, setPayingFine] = useState<BookIssue | null>(null);
  const debouncedSearch = useDebounce(search);

  const issues = usePaginatedQuery<BookIssue>(["library", "issues"], "library/issues", {
    status,
    borrowerType: borrowerType || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 20,
  });

  const finePaid = useApiMutation((id: string) => api.post(`library/issues/${id}/fine-paid`), {
    invalidate: LIBRARY_KEYS,
    success: "Fine marked as paid",
    onSuccess: () => setPayingFine(null),
  });

  const columns = useMemo<ColumnDef<BookIssue>[]>(
    () => [
      {
        id: "book",
        header: "Book",
        cell: ({ row }) => (
          <div className="flex min-w-[180px] flex-col">
            <span className="font-bold text-gray-900">{row.original.book.title}</span>
            <span className="text-xs text-gray-500">
              {row.original.book.author ?? "Unknown author"}
              {row.original.book.shelfLocation && <> · Shelf {row.original.book.shelfLocation}</>}
            </span>
          </div>
        ),
      },
      {
        id: "borrower",
        header: "Borrower",
        cell: ({ row }) => {
          const b = row.original.borrower;
          if (!b) return <span className="text-gray-400">Removed</span>;
          return (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-semibold text-gray-900">{b.name}</span>
              <span className="text-xs text-gray-500">
                <Badge tone={b.type === "student" ? "blue" : "purple"} className="mr-1 px-1.5 py-0 text-[10px]">
                  {b.type === "student" ? "Student" : "Staff"}
                </Badge>
                {b.type === "student" ? b.classLabel ?? b.number : b.designation ?? b.number}
              </span>
            </div>
          );
        },
      },
      {
        id: "issuedAt",
        header: "Issued",
        cell: ({ row }) => <span className="whitespace-nowrap text-gray-700">{formatDate(row.original.issuedAt)}</span>,
      },
      {
        id: "dueDate",
        header: status === "returned" ? "Due / returned" : "Due date",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className={cn("font-bold", row.original.isOverdue ? "text-red-600" : "text-gray-900")}>
              {formatDate(row.original.dueDate)}
            </span>
            {row.original.returnedAt ? (
              <span className="text-xs text-gray-500">
                Returned {formatDateTime(row.original.returnedAt)}
                {row.original.daysOverdue > 0 && <> · {row.original.daysOverdue}d late</>}
              </span>
            ) : row.original.isOverdue ? (
              <span className="text-xs font-semibold text-red-600">
                {row.original.daysOverdue} day{row.original.daysOverdue === 1 ? "" : "s"} overdue
              </span>
            ) : (
              <span className="text-xs text-gray-500">On time</span>
            )}
          </div>
        ),
      },
      {
        id: "fine",
        header: status === "returned" ? "Fine" : "Running fine",
        cell: ({ row }) =>
          row.original.fine > 0 ? (
            <div className="flex flex-col items-start gap-1 whitespace-nowrap">
              <span className={cn("font-bold", row.original.finePending ? "text-red-600" : "text-gray-700")}>
                {formatCurrency(row.original.fine, currency)}
              </span>
              {row.original.returnedAt &&
                (row.original.finePaid ? <Badge tone="green">Paid</Badge> : <Badge tone="orange">Unpaid</Badge>)}
            </div>
          ) : (
            <span className="text-xs text-gray-400">No fine</span>
          ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                  {!row.original.returnedAt && (
                    <>
                      <Button variant="success" size="sm" onClick={() => setReturning(row.original)}>
                        Return
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRenewing(row.original)}>
                        Renew
                      </Button>
                    </>
                  )}
                  {row.original.returnedAt && row.original.finePending && (
                    <Button variant="outline" size="sm" onClick={() => setPayingFine(row.original)}>
                      Fine paid
                    </Button>
                  )}
                </div>
              ),
            } satisfies ColumnDef<BookIssue>,
          ]
        : []),
    ],
    [canManage, currency, status],
  );

  const rows = issues.data?.data ?? [];
  const hasFilters = !!(borrowerType || debouncedSearch.trim());
  const emptyCopy: Record<IssueStatus, { title: string; description: string }> = {
    issued: { title: "No books are out right now", description: "Issue a book from the Catalogue tab or the “Issue book” button." },
    overdue: { title: "Nothing is overdue", description: "Every issued book is still within its due date." },
    returned: { title: "No returns yet", description: "Returned books and their fines will appear here." },
  };

  return (
    <div>
      <Tabs<IssueStatus>
        className="mb-4"
        active={status}
        onChange={(id) => {
          setStatus(id);
          setPage(1);
        }}
        tabs={STATUS_TABS}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-72"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search book or borrower…"
        />
        <Select
          className="sm:w-44"
          value={borrowerType}
          onChange={(e) => {
            setBorrowerType(e.target.value as BorrowerType | "");
            setPage(1);
          }}
          options={[
            { value: "student", label: "Students" },
            { value: "staff", label: "Staff" },
          ]}
          placeholder="All borrowers"
        />
      </div>

      <QueryState
        isLoading={issues.isLoading}
        error={issues.error}
        onRetry={() => issues.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No issues match" : emptyCopy[status].title}
            description={hasFilters ? "Try a different search or borrower type." : emptyCopy[status].description}
          />
        }
      >
        <DataTable columns={columns} data={rows} />
        <Pagination meta={issues.data?.meta} onPageChange={setPage} />
      </QueryState>

      {returning && <ReturnModal issue={returning} currency={currency} onClose={() => setReturning(null)} />}
      {renewing && <RenewModal issue={renewing} onClose={() => setRenewing(null)} />}

      <ConfirmDialog
        open={!!payingFine}
        onClose={() => setPayingFine(null)}
        onConfirm={() => payingFine && finePaid.mutate(payingFine.id)}
        loading={finePaid.isPending}
        tone="primary"
        title="Mark fine as paid?"
        message={
          payingFine
            ? `${payingFine.borrower?.name ?? "The borrower"} paid ${formatCurrency(payingFine.fine, currency)} for “${payingFine.book.title}”.`
            : ""
        }
        confirmLabel="Mark paid"
      />
    </div>
  );
};

const ReturnModal = ({ issue, currency, onClose }: { issue: BookIssue; currency: string; onClose: () => void }) => {
  const today = todayInput();
  const minDate = issue.issuedAt.slice(0, 10);
  const [returnDate, setReturnDate] = useState(today);
  const lateDays = Math.max(0, daysBetween(issue.dueDate, returnDate || today));
  const computedFine = lateDays * FINE_PER_DAY;
  // null = follow the computed fine until the librarian edits it.
  const [fineInput, setFineInput] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [remarks, setRemarks] = useState("");
  const fine = fineInput ?? String(computedFine);
  const fineNumber = Number(fine || 0);

  const save = useApiMutation(
    () =>
      api.post(`library/issues/${issue.id}/return`, {
        // Today = now; an earlier day is recorded at noon local time.
        ...(returnDate && returnDate !== today && { returnedAt: new Date(`${returnDate}T12:00:00`).toISOString() }),
        fineAmount: fineNumber,
        finePaid: fineNumber > 0 ? paid : false,
        ...(remarks.trim() && { remarks: remarks.trim() }),
      }),
    { invalidate: LIBRARY_KEYS, success: "Book returned", onSuccess: onClose },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Return book"
      description={`${issue.book.title} · ${issue.borrower?.name ?? ""}`}
      size="sm"
      onSubmit={() => save.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="success" loading={save.isPending}>
            Record return
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
          Due on <span className="font-bold text-gray-900">{formatDate(issue.dueDate)}</span>
          {lateDays > 0 ? (
            <>
              {" "}
              · <span className="font-bold text-red-600">{lateDays} day{lateDays === 1 ? "" : "s"} late</span> ×{" "}
              {formatCurrency(FINE_PER_DAY, currency)} = {formatCurrency(computedFine, currency)}
            </>
          ) : (
            <> · returned on time, no fine</>
          )}
        </div>
        <Field label="Return date" required>
          <Input required type="date" min={minDate} max={today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </Field>
        <Field label={`Fine (${currency})`} hint="Defaults to the late fine; change it to waive or adjust">
          <Input type="number" min={0} step="0.01" value={fine} onChange={(e) => setFineInput(e.target.value)} />
        </Field>
        {fineNumber > 0 && <Checkbox label="Fine collected now" checked={paid} onChange={setPaid} />}
        <Field label="Remarks">
          <Textarea rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Cover slightly torn" />
        </Field>
      </div>
    </Modal>
  );
};

const addDaysInput = (day: string, days: number) => {
  const d = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const RenewModal = ({ issue, onClose }: { issue: BookIssue; onClose: () => void }) => {
  const today = todayInput();
  const base = issue.dueDate.slice(0, 10) > today ? issue.dueDate.slice(0, 10) : today;
  const [dueDate, setDueDate] = useState(addDaysInput(base, DEFAULT_LOAN_DAYS));
  const tooLate = issue.daysOverdue > 30;

  const renew = useApiMutation(() => api.post(`library/issues/${issue.id}/renew`, { dueDate }), {
    invalidate: LIBRARY_KEYS,
    success: "Due date extended",
    onSuccess: onClose,
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Renew book"
      description={`${issue.book.title} · ${issue.borrower?.name ?? ""}`}
      size="sm"
      onSubmit={() => !tooLate && renew.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={renew.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={renew.isPending} disabled={tooLate}>
            Renew
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Currently due on <span className="font-bold text-gray-900">{formatDate(issue.dueDate)}</span>
          {issue.isOverdue && <span className="font-semibold text-red-600"> ({issue.daysOverdue} days overdue)</span>}.
        </p>
        {tooLate ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            Books more than 30 days overdue cannot be renewed. Record the return and settle the fine instead.
          </p>
        ) : (
          <Field label="New due date" required>
            <Input
              required
              type="date"
              min={addDaysInput(base, 1)}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              autoFocus
            />
          </Field>
        )}
      </div>
    </Modal>
  );
};

export default IssuesTab;
