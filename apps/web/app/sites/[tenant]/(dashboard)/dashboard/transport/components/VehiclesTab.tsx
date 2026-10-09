"use client";

import { useMemo, useState } from "react";
import { Pencil, Phone, Plus, Trash2 } from "lucide-react";
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
  QueryState,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDate, toDateInput } from "@/lib/utils/format";
import { TRANSPORT_KEYS, expiryHint, expiryTone, telHref, type Vehicle } from "./types";

type VehicleForm = {
  id?: string;
  registrationNumber: string;
  model: string;
  capacity: string;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  helperName: string;
  helperPhone: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  isActive: boolean;
};

const emptyForm: VehicleForm = {
  registrationNumber: "",
  model: "",
  capacity: "40",
  driverName: "",
  driverPhone: "",
  driverLicense: "",
  helperName: "",
  helperPhone: "",
  insuranceExpiry: "",
  fitnessExpiry: "",
  isActive: true,
};

const toForm = (v: Vehicle): VehicleForm => ({
  id: v.id,
  registrationNumber: v.registrationNumber,
  model: v.model ?? "",
  capacity: String(v.capacity),
  driverName: v.driverName,
  driverPhone: v.driverPhone,
  driverLicense: v.driverLicense ?? "",
  helperName: v.helperName ?? "",
  helperPhone: v.helperPhone ?? "",
  insuranceExpiry: toDateInput(v.insuranceExpiry),
  fitnessExpiry: toDateInput(v.fitnessExpiry),
  isActive: v.isActive,
});

// Blank optional fields are sent as null so an edit can clear them.
const toBody = (f: VehicleForm) => ({
  registrationNumber: f.registrationNumber.trim(),
  model: f.model.trim() || null,
  capacity: Number(f.capacity),
  driverName: f.driverName.trim(),
  driverPhone: f.driverPhone.trim(),
  driverLicense: f.driverLicense.trim() || null,
  helperName: f.helperName.trim() || null,
  helperPhone: f.helperPhone.trim() || null,
  insuranceExpiry: f.insuranceExpiry || null,
  fitnessExpiry: f.fitnessExpiry || null,
  isActive: f.isActive,
});

const ExpiryCell = ({ date, days }: { date: string | null; days: number | null }) =>
  date ? (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={expiryTone(days)}>{formatDate(date)}</Badge>
      <span className="text-[11px] text-gray-500">{expiryHint(days)}</span>
    </div>
  ) : (
    <Badge tone="gray">Not recorded</Badge>
  );

const VehiclesTab = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.TRANSPORT_MANAGE);
  const [form, setForm] = useState<VehicleForm | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  const vehicles = useApiQuery<Vehicle[]>(["transport", "vehicles"], "transport/vehicles");

  const save = useApiMutation(
    (f: VehicleForm) => {
      const body = toBody(f);
      if (f.id) return api.patch(`transport/vehicles/${f.id}`, body);
      // Create: omit empty optional fields entirely.
      return api.post(
        "transport/vehicles",
        Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)),
      );
    },
    { invalidate: TRANSPORT_KEYS, success: "Vehicle saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`transport/vehicles/${id}`), {
    invalidate: TRANSPORT_KEYS,
    success: "Vehicle deleted",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      {
        accessorKey: "registrationNumber",
        header: "Vehicle",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-bold uppercase text-gray-900">{row.original.registrationNumber}</span>
            <span className="text-xs text-gray-500">{row.original.model ?? "—"}</span>
            {!row.original.isActive && (
              <Badge tone="gray" className="mt-1 w-fit">
                Inactive
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "capacity",
        header: "Seats",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-bold text-gray-900">{row.original.capacity}</span>
            <span className="text-xs text-gray-500">{row.original.assignedStudents} assigned</span>
          </div>
        ),
      },
      {
        id: "driver",
        header: "Driver",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold text-gray-900">{row.original.driverName}</span>
            <a href={telHref(row.original.driverPhone)} className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
              <Phone className="h-3 w-3" /> {row.original.driverPhone}
            </a>
            {row.original.driverLicense && <span className="text-[11px] text-gray-400">DL {row.original.driverLicense}</span>}
          </div>
        ),
      },
      {
        id: "helper",
        header: "Helper",
        cell: ({ row }) =>
          row.original.helperName || row.original.helperPhone ? (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-semibold text-gray-800">{row.original.helperName ?? "—"}</span>
              {row.original.helperPhone && (
                <a href={telHref(row.original.helperPhone)} className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                  <Phone className="h-3 w-3" /> {row.original.helperPhone}
                </a>
              )}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        id: "routes",
        header: "Routes",
        cell: ({ row }) =>
          row.original.routes.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.routes.map((r) => (
                <Badge key={r.id} tone={r.isActive ? "blue" : "gray"} className="font-semibold">
                  {r.code}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not on a route</span>
          ),
      },
      {
        id: "insurance",
        header: "Insurance",
        cell: ({ row }) => <ExpiryCell date={row.original.insuranceExpiry} days={row.original.insuranceExpiresInDays} />,
      },
      {
        id: "fitness",
        header: "Fitness",
        cell: ({ row }) => <ExpiryCell date={row.original.fitnessExpiry} days={row.original.fitnessExpiresInDays} />,
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => setForm(toForm(row.original))}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    aria-label="Delete"
                    onClick={() => setToDelete(row.original)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<Vehicle>,
          ]
        : []),
    ],
    [canManage],
  );

  const rows = vehicles.data ?? [];
  const set = <K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Button>
        </div>
      )}

      <QueryState
        isLoading={vehicles.isLoading}
        error={vehicles.error}
        onRetry={() => vehicles.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title="No vehicles yet"
            description="Add your buses and vans with driver details and insurance / fitness dates to get renewal reminders."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setForm({ ...emptyForm })}>
                  <Plus className="h-4 w-4" /> Add vehicle
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit vehicle" : "Add vehicle"}
        size="lg"
        onSubmit={() => form && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save vehicle
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Registration number" required hint="e.g. KA 01 AB 1234">
              <Input
                required
                maxLength={20}
                pattern="[A-Za-z0-9 \-]+"
                title="Letters, numbers, spaces and -"
                value={form.registrationNumber}
                onChange={(e) => set("registrationNumber", e.target.value.toUpperCase())}
                autoFocus
              />
            </Field>
            <Field label="Make / model">
              <Input maxLength={128} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Tata Starbus 40" />
            </Field>
            <Field label="Seating capacity" required hint="Seats available for students">
              <Input required type="number" min={1} max={200} step={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
            </Field>
            <Field label="Driver licence no.">
              <Input maxLength={64} value={form.driverLicense} onChange={(e) => set("driverLicense", e.target.value)} />
            </Field>
            <Field label="Driver name" required>
              <Input required maxLength={128} value={form.driverName} onChange={(e) => set("driverName", e.target.value)} />
            </Field>
            <Field label="Driver phone" required>
              <Input required type="tel" maxLength={32} value={form.driverPhone} onChange={(e) => set("driverPhone", e.target.value)} />
            </Field>
            <Field label="Helper / attendant name">
              <Input maxLength={128} value={form.helperName} onChange={(e) => set("helperName", e.target.value)} />
            </Field>
            <Field label="Helper phone">
              <Input type="tel" maxLength={32} value={form.helperPhone} onChange={(e) => set("helperPhone", e.target.value)} />
            </Field>
            <Field label="Insurance valid until">
              <Input type="date" value={form.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} />
            </Field>
            <Field label="Fitness certificate valid until">
              <Input type="date" value={form.fitnessExpiry} onChange={(e) => set("fitnessExpiry", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox label="Vehicle is in service" checked={form.isActive} onChange={(v) => set("isActive", v)} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Delete ${toDelete?.registrationNumber}?`}
        message="The vehicle is removed from the fleet. A vehicle that still serves an active route must be unassigned from it first."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default VehiclesTab;
