"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Checkbox, Field, Input, Modal, QueryState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { useSections } from "@/lib/api/lookups";
import { EXAM_INVALIDATE } from "../../exams/api";

type Room = { roomNumber: string; capacity: string };

const GenerateSeatingModal = ({ examId, examName, onClose }: { examId: string; examName: string; onClose: () => void }) => {
  const sections = useSections();
  const [selected, setSelected] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([{ roomNumber: "Room 101", capacity: "30" }]);
  const [interleave, setInterleave] = useState(true);

  const generate = useApiMutation(
    () =>
      api.post<{ assigned: number; rooms: { roomNumber: string; assigned: number }[] }>(`exams/${examId}/seating/generate`, {
        sectionIds: selected,
        rooms: rooms.map((r) => ({ roomNumber: r.roomNumber.trim(), capacity: Number(r.capacity) })),
        interleave,
      }),
    {
      invalidate: EXAM_INVALIDATE,
      success: (r) => `${r.assigned} seat(s) assigned across ${r.rooms.filter((x) => x.assigned > 0).length} room(s)`,
      onSuccess: onClose,
    },
  );

  const all = sections.data ?? [];
  const students = all.filter((s) => selected.includes(s.id)).reduce((sum, s) => sum + s.studentCount, 0);
  const capacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  const toggle = (id: string, on: boolean) => setSelected((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));
  const setRoom = (index: number, patch: Partial<Room>) =>
    setRooms((cur) => cur.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const nextRoomName = () => {
    const last = rooms[rooms.length - 1]?.roomNumber ?? "";
    const match = /^(.*?)(\d+)$/.exec(last.trim());
    return match ? `${match[1]}${Number(match[2]) + 1}` : "";
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Generate seating"
      description={`${examName}: existing seats of the selected students are replaced.`}
      onSubmit={() => generate.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={generate.isPending} disabled={!selected.length || !rooms.length}>
            Generate &amp; assign
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              Sections <span className="text-red-500">*</span>
            </span>
            {all.length > 0 && (
              <button
                type="button"
                className="cursor-pointer text-xs font-semibold text-[#1C263A] hover:underline"
                onClick={() => setSelected(selected.length === all.length ? [] : all.map((s) => s.id))}
              >
                {selected.length === all.length ? "Clear all" : "Select all"}
              </button>
            )}
          </div>
          <QueryState isLoading={sections.isLoading} error={sections.error} onRetry={() => sections.refetch()}>
            {all.length === 0 ? (
              <p className="text-xs text-gray-500">No sections found. Create classes and sections in Academic Setup.</p>
            ) : (
              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
                {all.map((s) => (
                  <Checkbox
                    key={s.id}
                    checked={selected.includes(s.id)}
                    onChange={(on) => toggle(s.id, on)}
                    label={
                      <span>
                        <span className="font-semibold">{s.label}</span>
                        <span className="ml-1 text-xs text-gray-400">({s.studentCount})</span>
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </QueryState>
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold text-gray-700">
            Rooms <span className="text-red-500">*</span>
          </span>
          <div className="space-y-2">
            {rooms.map((room, index) => (
              <div key={index} className="flex items-end gap-2">
                <Field label={index === 0 ? "Room / hall" : undefined} className="flex-1">
                  <Input
                    required
                    maxLength={32}
                    value={room.roomNumber}
                    onChange={(e) => setRoom(index, { roomNumber: e.target.value })}
                    placeholder="Room 101"
                  />
                </Field>
                <Field label={index === 0 ? "Capacity" : undefined} className="w-28">
                  <Input
                    type="number"
                    required
                    min={1}
                    max={260}
                    value={room.capacity}
                    onChange={(e) => setRoom(index, { capacity: e.target.value })}
                  />
                </Field>
                <Button
                  variant="ghost"
                  aria-label="Remove room"
                  disabled={rooms.length === 1}
                  onClick={() => setRooms((cur) => cur.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setRooms((cur) => [...cur, { roomNumber: nextRoomName(), capacity: cur[cur.length - 1]?.capacity ?? "30" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add room
          </Button>
        </div>

        <Checkbox
          checked={interleave}
          onChange={setInterleave}
          label="Interleave sections (alternate students of different sections seat by seat to reduce copying)"
        />

        <div
          className={`rounded-lg border px-4 py-3 text-xs font-semibold ${
            selected.length && capacity < students ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          {selected.length} section(s) · about {students} student(s) · {capacity} seat(s) in {rooms.length} room(s). Seats are numbered
          in rows of 10 (A-01 … A-10, B-01 …).
          {selected.length > 0 && capacity < students && " Add rooms or increase capacity."}
        </div>
      </div>
    </Modal>
  );
};

export default GenerateSeatingModal;
