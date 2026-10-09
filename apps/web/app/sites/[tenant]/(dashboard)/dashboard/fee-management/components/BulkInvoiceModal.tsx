"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useClasses } from "@/lib/api/lookups";
import { formatCurrency, todayInput } from "@/lib/utils/format";
import { useUser } from "@/providers/user-provider";
import type { FeeStructure } from "../types";
import { FEE_KEYS, toPaise } from "../utils";

interface BulkResult {
  created: number;
  skipped: number;
  students: number;
}

const BulkInvoiceModal = ({ onClose }: { onClose: () => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const structures = useApiQuery<FeeStructure[]>(["fees", "structures"], "fee-structures");
  const classes = useClasses();

  const [feeStructureId, setFeeStructureId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [dueDate, setDueDate] = useState(todayInput());
  const [discount, setDiscount] = useState("");
  const [installments, setInstallments] = useState("1");
  const [result, setResult] = useState<BulkResult | null>(null);

  const structure = structures.data?.find((s) => s.id === feeStructureId);
  const cls = classes.data?.find((c) => c.id === classId);
  const section = cls?.sections.find((s) => s.id === sectionId);
  const studentCount = section ? section.studentCount : cls?.studentCount;
  const discountPct = Math.min(Math.max(Number(discount) || 0, 0), 100);
  const parts = Math.min(Math.max(Number.parseInt(installments, 10) || 1, 1), 12);

  // Preview per student: same rounding as the API (split each component,
  // last installment absorbs the remainder, discount per line, half-up).
  const preview = useMemo(() => {
    if (!structure) return null;
    let annual = 0;
    let first = 0;
    for (const c of structure.components) {
      const amount = toPaise(c.amount);
      const base = Math.floor(amount / parts);
      const firstPart = parts === 1 ? amount : base;
      const lines = Array.from({ length: parts }, (_, i) => (i === parts - 1 ? amount - base * (parts - 1) : base));
      lines.forEach((line) => {
        annual += line - Math.round((line * discountPct) / 100);
      });
      first += firstPart - Math.round((firstPart * discountPct) / 100);
    }
    return { annual, first };
  }, [structure, parts, discountPct]);

  const generate = useApiMutation(
    () =>
      api.post<BulkResult>("invoices/bulk", {
        feeStructureId,
        classId: sectionId ? undefined : classId,
        sectionId: sectionId || undefined,
        dueDate,
        discountPercent: discountPct > 0 ? discountPct : undefined,
        installments: parts,
      }),
    {
      invalidate: FEE_KEYS,
      success: (r) => `${r.created} invoice${r.created === 1 ? "" : "s"} generated`,
      onSuccess: setResult,
    },
  );

  const valid = !!feeStructureId && !!classId && !!dueDate;

  if (result) {
    return (
      <Modal open onClose={onClose} title="Invoices generated" size="sm" footer={<Button onClick={onClose}>Done</Button>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <div className="grid w-full grid-cols-3 gap-2">
            {[
              ["Created", result.created],
              ["Skipped", result.skipped],
              ["Students", result.students],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-200 p-3">
                <p className="font-serif text-2xl text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-gray-500">Skipped invoices already existed for the same fee structure and due date.</p>
          )}
          {result.students === 0 && (
            <p className="text-xs text-gray-500">No active students are enrolled in the selected class/section this year.</p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Generate Invoices"
      description="Create invoices for every active student of a class or section from a fee structure"
      size="lg"
      onSubmit={() => valid && generate.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={generate.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={generate.isPending} disabled={!valid}>
            Generate
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Fee structure"
          required
          className="sm:col-span-2"
          hint={!structures.isLoading && !structures.data?.length ? "Create a fee structure first (Fee Structures tab)." : undefined}
        >
          <Select
            required
            value={feeStructureId}
            onChange={(e) => setFeeStructureId(e.target.value)}
            options={(structures.data ?? []).map((s) => ({ value: s.id, label: `${s.name} · ${formatCurrency(s.totalAmount, currency)}` }))}
            placeholder={structures.isLoading ? "Loading…" : "Select fee structure"}
          />
        </Field>
        <Field label="Class" required>
          <Select
            required
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
          />
        </Field>
        <Field label="Section" hint="Leave empty to bill the whole class">
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            options={(cls?.sections ?? []).map((s) => ({ value: s.id, label: `Section ${s.name} (${s.studentCount})` }))}
            placeholder="All sections"
            disabled={!cls}
          />
        </Field>
        <Field label="First due date" required>
          <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Installments" hint="Monthly invoices starting from the due date">
          <Select
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: i === 0 ? "1 (single invoice)" : `${i + 1} monthly`,
            }))}
          />
        </Field>
        <Field label="Discount %" hint="Applied to every component">
          <Input type="number" min={0} max={100} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
        </Field>

        {structure && preview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs sm:col-span-2">
            <p className="font-bold text-gray-800">Per student</p>
            <p className="mt-1 text-gray-600">
              {formatCurrency(preview.annual / 100, currency)} in total
              {parts > 1 && <> · {parts} invoices of about {formatCurrency(preview.first / 100, currency)}</>}
              {studentCount !== undefined && (
                <>
                  {" "}
                  · {studentCount} student{studentCount === 1 ? "" : "s"} enrolled
                </>
              )}
            </p>
            <p className="mt-1 text-gray-500">Students who already have these invoices are skipped automatically.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkInvoiceModal;
