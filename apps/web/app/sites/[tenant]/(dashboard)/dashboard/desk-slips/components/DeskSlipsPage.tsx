"use client";

import { useMemo, useState } from "react";
import { Armchair, Pencil, Printer, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@repo/ui";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  QueryState,
  Select,
  StatTile,
  type BadgeTone,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { humanize } from "@/lib/utils/format";
import { EXAM_INVALIDATE, EXAM_KEY, useExams, type SeatItem, type SeatStatus } from "../../exams/api";
import DeskSlipsPrint from "./DeskSlipsPrint";
import GenerateSeatingModal from "./GenerateSeatingModal";

const STATUS_TONE: Record<SeatStatus, BadgeTone> = { GENERATED: "blue", PRINTED: "green", ASSIGNED: "yellow" };
const STATUSES: SeatStatus[] = ["GENERATED", "ASSIGNED", "PRINTED"];

type SeatForm = { id: string; name: string; roomNumber: string; seatNumber: string; status: SeatStatus };

const DeskSlipsPage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.EXAM_CREATE);
  const exams = useExams();

  const [examId, setExamId] = useState("");
  const [room, setRoom] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editing, setEditing] = useState<SeatForm | null>(null);

  const exam = exams.data?.find((e) => e.id === examId) ?? null;
  const seating = useApiQuery<SeatItem[]>([EXAM_KEY, "seating", examId], examId ? `exams/${examId}/seating` : null);

  const clear = useApiMutation(() => api.delete<{ deleted: number }>(`exams/${examId}/seating`), {
    invalidate: EXAM_INVALIDATE,
    success: (r) => `${r.deleted} seat(s) cleared`,
    onSuccess: () => {
      setConfirmClear(false);
      setRoom("");
    },
  });
  const saveSeat = useApiMutation(
    ({ id, roomNumber, seatNumber, status }: SeatForm) => api.patch(`exam-seats/${id}`, { roomNumber, seatNumber, status }),
    { invalidate: EXAM_INVALIDATE, success: "Seat updated", onSuccess: () => setEditing(null) },
  );

  const all = useMemo(() => seating.data ?? [], [seating.data]);
  const rooms = useMemo(() => [...new Set(all.map((s) => s.roomNumber))], [all]);
  const sectionOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((s) => s.sectionId && map.set(s.sectionId, s.sectionLabel ?? ""));
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [all]);
  const seats = all.filter((s) => (!room || s.roomNumber === room) && (!sectionFilter || s.sectionId === sectionFilter));
  const printed = all.filter((s) => s.status === "PRINTED").length;

  const columns = useMemo<ColumnDef<SeatItem>[]>(
    () => [
      {
        accessorKey: "roomNumber",
        header: "Room / Hall",
        cell: ({ row }) => (
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">{row.original.roomNumber}</span>
        ),
      },
      { accessorKey: "seatNumber", header: "Seat", cell: ({ row }) => <span className="text-sm font-bold text-gray-900">{row.original.seatNumber}</span> },
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-bold text-gray-900">{row.original.student.name}</p>
            <p className="text-[11px] text-gray-400">{row.original.student.admissionNumber}</p>
          </div>
        ),
      },
      { id: "section", header: "Class", cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.sectionLabel ?? "—"}</span> },
      {
        id: "roll",
        header: "Roll No",
        cell: ({ row }) => <span className="text-xs font-bold uppercase text-gray-500">{row.original.student.rollNumber ?? "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status] ?? "gray"}>{humanize(row.original.status)}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Edit seat"
                onClick={() =>
                  setEditing({
                    id: row.original.id,
                    name: row.original.student.name,
                    roomNumber: row.original.roomNumber,
                    seatNumber: row.original.seatNumber,
                    status: row.original.status,
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManage],
  );

  if (printing && exam) {
    return <DeskSlipsPrint exam={exam} seats={seats} onBack={() => setPrinting(false)} />;
  }

  return (
    <div>
      <PageHeader
        title="Desk Slips & Seating"
        description="Allocate exam hall seats and print student desk slips"
        actions={
          exam ? (
            <>
              {canManage && all.length > 0 && (
                <Button variant="ghost" className="text-red-600" onClick={() => setConfirmClear(true)}>
                  <Trash2 className="h-4 w-4" /> Clear seating
                </Button>
              )}
              <Button variant="secondary" onClick={() => setPrinting(true)} disabled={!seats.length}>
                <Printer className="h-4 w-4" /> Print slips
              </Button>
              {canManage && (
                <Button onClick={() => setGenerating(true)}>
                  <Armchair className="h-4 w-4" /> Generate seating
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <Field label="Exam">
          <Select
            value={examId}
            onChange={(e) => {
              setExamId(e.target.value);
              setRoom("");
              setSectionFilter("");
            }}
            placeholder={exams.isLoading ? "Loading…" : "Select exam"}
            options={(exams.data ?? []).map((x) => ({ value: x.id, label: x.name }))}
          />
        </Field>
        <Field label="Room">
          <Select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            disabled={!rooms.length}
            placeholder="All rooms"
            options={rooms.map((r) => ({ value: r, label: r }))}
          />
        </Field>
        <Field label="Section">
          <Select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!sectionOptions.length}
            placeholder="All sections"
            options={sectionOptions}
          />
        </Field>
      </Card>

      {exams.error ? (
        <QueryState isLoading={false} error={exams.error} onRetry={() => exams.refetch()}>
          {null}
        </QueryState>
      ) : !examId ? (
        <EmptyState
          title={exams.data?.length === 0 ? "No exams in the current academic year" : "Select an exam"}
          description={
            exams.data?.length === 0
              ? "Create an exam on the Exams & Marks page first."
              : "The seating plan and desk slips for the exam will appear here."
          }
        />
      ) : (
        <QueryState
          isLoading={seating.isLoading}
          error={seating.error}
          onRetry={() => seating.refetch()}
          isEmpty={!all.length}
          empty={
            <EmptyState
              title="No seating generated yet"
              description="Choose the sections and exam rooms; seats are auto-assigned with sections interleaved."
              action={canManage && <Button onClick={() => setGenerating(true)}>Generate seating</Button>}
            />
          }
        >
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Seats assigned" value={all.length} />
            <StatTile label="Rooms" value={rooms.length} />
            <StatTile label="Sections" value={sectionOptions.length} />
            <StatTile label="Slips printed" value={`${printed}/${all.length}`} tone={printed === all.length ? "success" : "default"} />
          </div>
          <DataTable columns={columns} data={seats} />
        </QueryState>
      )}

      {generating && exam && <GenerateSeatingModal examId={exam.id} examName={exam.name} onClose={() => setGenerating(false)} />}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit seat — ${editing?.name ?? ""}`}
        size="sm"
        onSubmit={() => editing && saveSeat.mutate(editing)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveSeat.isPending}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Room" required>
              <Input required maxLength={32} value={editing.roomNumber} onChange={(e) => setEditing({ ...editing, roomNumber: e.target.value })} />
            </Field>
            <Field label="Seat" required>
              <Input required maxLength={16} value={editing.seatNumber} onChange={(e) => setEditing({ ...editing, seatNumber: e.target.value })} />
            </Field>
            <Field label="Status" className="col-span-2">
              <Select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as SeatStatus })}
                options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => clear.mutate()}
        loading={clear.isPending}
        title={`Clear seating for ${exam?.name ?? "this exam"}?`}
        message={`All ${all.length} seat assignment(s) will be removed. You can generate seating again afterwards.`}
        confirmLabel="Clear seating"
      />
    </div>
  );
};

export default DeskSlipsPage;
