"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Pagination,
  QueryState,
  SearchInput,
  Select,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import CertificateDocument from "./CertificateDocument";
import IdCard from "./IdCard";
import { PRINT_ID, PrintStyles } from "./print";
import {
  CERTIFICATE_KEYS,
  TYPE_META,
  idCardFromSnapshot,
  type CertificateType,
  type DocumentType,
  type IssuedCertificate,
  type IssuedCertificateDetail,
} from "./types";

const TYPE_FILTERS = (Object.keys(TYPE_META) as CertificateType[]).map((t) => ({ value: t, label: TYPE_META[t].label }));

const RegisterTab = ({ onIssue }: { onIssue: () => void }) => {
  const can = useCan();
  const canIssue = can(PERMISSIONS.CERTIFICATE_ISSUE);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [reprintId, setReprintId] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<IssuedCertificate | null>(null);
  const debounced = useDebounce(search).trim();

  const list = usePaginatedQuery<IssuedCertificate>(["certificates", "list"], "certificates", {
    search: debounced || undefined,
    type: type || undefined,
    page,
    limit: 20,
  });

  const columns = useMemo<ColumnDef<IssuedCertificate>[]>(
    () => [
      {
        id: "serial",
        header: "Serial No.",
        cell: ({ row }) => <span className="font-mono text-xs font-bold text-gray-900">{row.original.serialNumber}</span>,
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => <Badge tone={TYPE_META[row.original.type]?.tone ?? "gray"}>{TYPE_META[row.original.type]?.label ?? row.original.type}</Badge>,
      },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900">{row.original.student.name}</p>
            <p className="text-xs text-gray-500">Adm. {row.original.student.admissionNumber}</p>
          </div>
        ),
      },
      { id: "class", header: "Class", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.classSection ?? "—"}</span> },
      {
        id: "issued",
        header: "Issued",
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="font-semibold">{formatDateTime(row.original.issuedAt)}</p>
            <p className="text-xs text-gray-500">{row.original.issuedBy?.name ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.revoked ? (
            <div title={row.original.revokeReason ?? undefined}>
              <Badge tone="red">Revoked</Badge>
              {row.original.revokeReason && <p className="mt-1 max-w-48 truncate text-xs text-gray-500">{row.original.revokeReason}</p>}
            </div>
          ) : (
            <Badge tone="green">Valid</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReprintId(row.original.id)}>
              <Printer className="h-3.5 w-3.5" /> Reprint
            </Button>
            {canIssue && !row.original.revoked && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setToRevoke(row.original)}>
                <Ban className="h-3.5 w-3.5" /> Revoke
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canIssue],
  );

  if (reprintId) return <ReprintView id={reprintId} onBack={() => setReprintId(null)} />;

  const rows = list.data?.data ?? [];
  const hasFilters = !!(debounced || type);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search student, admission no or serial…"
        />
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          options={TYPE_FILTERS}
          placeholder="All types"
          aria-label="Filter by type"
        />
      </div>

      <QueryState
        isLoading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No certificates match your filters" : "No certificates issued yet"}
            description={
              hasFilters ? "Try another search or type." : "Issued certificates and ID cards are recorded here for reprinting."
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setType("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : canIssue ? (
                <Button size="sm" onClick={onIssue}>
                  Issue a certificate
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className={cn(list.isFetching && "opacity-70 transition-opacity")}>
          <DataTable columns={columns} data={rows} />
        </div>
        <Pagination meta={list.data?.meta} onPageChange={setPage} />
      </QueryState>

      {toRevoke && <RevokeModal certificate={toRevoke} onClose={() => setToRevoke(null)} />}
    </div>
  );
};

// Reprint from the snapshot frozen at issue time.
const ReprintView = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const cert = useApiQuery<IssuedCertificateDetail>(["certificates", "detail", id], `certificates/${id}`);
  const c = cert.data;
  return (
    <div>
      <PrintStyles />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to register
        </Button>
        <div className="flex items-center gap-3">
          {c?.revoked && <Badge tone="red">Revoked{c.revokedAt ? ` on ${formatDate(c.revokedAt)}` : ""}</Badge>}
          <Button onClick={() => window.print()} disabled={!c?.snapshot}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>
      <QueryState isLoading={cert.isLoading} error={cert.error} onRetry={() => cert.refetch()}>
        {c &&
          (!c.snapshot ? (
            <ErrorState message="This certificate has no stored snapshot and cannot be reprinted." />
          ) : c.type === "ID_CARD" ? (
            <div id={PRINT_ID} className="flex justify-center print:justify-start">
              <IdCard school={c.snapshot.school} card={idCardFromSnapshot(c.snapshot)} validUpto={c.details.validUpto} />
            </div>
          ) : (
            <div id={PRINT_ID} className="overflow-x-auto">
              <CertificateDocument
                type={c.type as DocumentType}
                snapshot={c.snapshot}
                details={c.details}
                serialNumber={c.serialNumber}
                issueDate={c.details.issueDate ?? c.issuedAt}
                revoked={c.revoked}
              />
            </div>
          ))}
      </QueryState>
    </div>
  );
};

const RevokeModal = ({ certificate, onClose }: { certificate: IssuedCertificate; onClose: () => void }) => {
  const [reason, setReason] = useState("");
  const revoke = useApiMutation((body: { reason: string }) => api.post(`certificates/${certificate.id}/revoke`, body), {
    invalidate: CERTIFICATE_KEYS,
    success: `${certificate.serialNumber} revoked`,
    onSuccess: onClose,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Revoke ${certificate.serialNumber}?`}
      description={`${TYPE_META[certificate.type]?.title ?? certificate.type} issued to ${certificate.student.name}`}
      size="sm"
      onSubmit={() => revoke.mutate({ reason: reason.trim() })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={revoke.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={revoke.isPending} disabled={!reason.trim()}>
            Revoke
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Reason" required>
          <Textarea
            required
            autoFocus
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Issued with an incorrect date of leaving"
          />
        </Field>
        <p className="text-xs text-gray-500">
          The certificate stays in the register marked as revoked; reprints show a “Revoked” stamp.
          {certificate.type === "TC" && " The student's status is not changed — update it from the Students page if needed."}
        </p>
      </div>
    </Modal>
  );
};

export default RegisterTab;
