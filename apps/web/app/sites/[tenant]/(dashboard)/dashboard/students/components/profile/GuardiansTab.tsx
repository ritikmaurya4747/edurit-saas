"use client";

import { useState } from "react";
import { Mail, Phone, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, EmptyState } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { humanize } from "@/lib/utils/format";
import type { StudentGuardianItem, StudentProfile } from "../../types";
import AddGuardianModal from "./AddGuardianModal";

const GuardiansTab = ({ student, canManage }: { student: StudentProfile; canManage: boolean }) => {
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<StudentGuardianItem | null>(null);

  const remove = useApiMutation((g: StudentGuardianItem) => api.delete(`students/${student.id}/guardians/${g.guardianId}`), {
    invalidate: [["students"]],
    success: "Guardian removed",
    onSuccess: () => setToRemove(null),
  });

  return (
    <div>
      {canManage && student.guardians.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add guardian
          </Button>
        </div>
      )}

      {student.guardians.length === 0 ? (
        <EmptyState
          title="No guardians linked"
          description="Add a parent or guardian so the school can reach them and they can use the parent app."
          action={
            canManage && (
              <Button onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" /> Add guardian
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {student.guardians.map((g) => (
            <Card key={g.guardianId} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">
                    {humanize(g.relationship)}
                    {g.occupation && ` · ${g.occupation}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {g.isPrimary && <Badge tone="blue">Primary</Badge>}
                  {canManage && (
                    <Button variant="ghost" size="sm" aria-label="Remove guardian" onClick={() => setToRemove(g)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {g.phone && (
                  <a href={`tel:${g.phone}`} className="flex items-center gap-1.5 text-blue-700 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {g.phone}
                  </a>
                )}
                {g.email && (
                  <a href={`mailto:${g.email}`} className="flex items-center gap-1.5 break-all text-blue-700 hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {g.email}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddGuardianModal studentId={student.id} open={adding} onClose={() => setAdding(false)} />
      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => toRemove && remove.mutate(toRemove)}
        loading={remove.isPending}
        title={`Remove ${toRemove?.name}?`}
        message="They will no longer be linked to this student. Their parent account is kept for any other children."
        confirmLabel="Remove"
      />
    </div>
  );
};

export default GuardiansTab;
