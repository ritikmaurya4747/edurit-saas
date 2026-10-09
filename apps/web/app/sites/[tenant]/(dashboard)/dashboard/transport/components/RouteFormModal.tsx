"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button, Checkbox, Field, Input, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useUser } from "@/providers/user-provider";
import { TRANSPORT_KEYS, type TransportRoute, type Vehicle } from "./types";

type StopRow = { key: string; id?: string; name: string; pickupTime: string; dropTime: string; fee: string };

let rowSeq = 0;
const newRow = (stop?: Partial<StopRow>): StopRow => ({
  key: `row-${++rowSeq}`,
  name: "",
  pickupTime: "",
  dropTime: "",
  fee: "",
  ...stop,
});

const stopBody = (s: StopRow) => ({
  ...(s.id && { id: s.id }),
  name: s.name.trim(),
  ...(s.pickupTime && { pickupTime: s.pickupTime }),
  ...(s.dropTime && { dropTime: s.dropTime }),
  ...(s.fee.trim() !== "" && { fee: Number(s.fee) }),
});

// Create / edit a route with a dynamic, ordered list of stops.
const RouteFormModal = ({ route, onClose }: { route: TransportRoute | null; onClose: () => void }) => {
  const user = useUser();
  const currency = user?.currency ?? "INR";
  const [name, setName] = useState(route?.name ?? "");
  const [code, setCode] = useState(route?.code ?? "");
  const [vehicleId, setVehicleId] = useState(route?.vehicleId ?? "");
  const [monthlyFee, setMonthlyFee] = useState(route ? String(Number(route.monthlyFee)) : "");
  const [isActive, setIsActive] = useState(route?.isActive ?? true);
  const [stops, setStops] = useState<StopRow[]>(() =>
    route?.stops.length
      ? route.stops.map((s) =>
          newRow({
            id: s.id,
            name: s.name,
            pickupTime: s.pickupTime ?? "",
            dropTime: s.dropTime ?? "",
            fee: s.fee != null ? String(Number(s.fee)) : "",
          }),
        )
      : [newRow()],
  );

  const vehicles = useApiQuery<Vehicle[]>(["transport", "vehicles"], "transport/vehicles");
  const vehicleOptions = (vehicles.data ?? [])
    .filter((v) => v.isActive || v.id === route?.vehicleId)
    .map((v) => ({
      value: v.id,
      label: `${v.registrationNumber} · ${v.capacity} seats · ${v.driverName}${v.routes.some((r) => r.id !== route?.id) ? ` (also on ${v.routes.filter((r) => r.id !== route?.id).map((r) => r.code).join(", ")})` : ""}`,
    }));

  const save = useApiMutation(
    async () => {
      const stopList = stops.filter((s) => s.name.trim()).map(stopBody);
      if (!route) {
        return api.post<TransportRoute>("transport/routes", {
          name: name.trim(),
          code: code.trim(),
          monthlyFee: Number(monthlyFee || 0),
          ...(vehicleId && { vehicleId }),
          stops: stopList,
        });
      }
      await api.patch(`transport/routes/${route.id}`, {
        name: name.trim(),
        code: code.trim(),
        monthlyFee: Number(monthlyFee || 0),
        vehicleId: vehicleId || null,
        isActive,
      });
      return api.put<TransportRoute>(`transport/routes/${route.id}/stops`, { stops: stopList });
    },
    { invalidate: TRANSPORT_KEYS, success: route ? "Route updated" : "Route created", onSuccess: onClose },
  );

  const update = (key: string, patch: Partial<StopRow>) => setStops((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (index: number, dir: -1 | 1) =>
    setStops((rows) => {
      const next = [...rows];
      const target = index + dir;
      if (target < 0 || target >= next.length) return rows;
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(target, 0, moved);
      return next;
    });
  const removeRow = (key: string) => setStops((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : [newRow()]));

  return (
    <Modal
      open
      onClose={onClose}
      title={route ? `Edit route ${route.code}` : "New route"}
      description="Stops are listed in travel order. Transport fees are shown for reference — invoices are not created automatically."
      size="xl"
      onSubmit={() => save.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {route ? "Save changes" : "Create route"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Field label="Route name" required className="sm:col-span-4">
            <Input required maxLength={128} value={name} onChange={(e) => setName(e.target.value)} placeholder="Whitefield – School" autoFocus />
          </Field>
          <Field label="Code" required hint="Short & unique" className="sm:col-span-2">
            <Input
              required
              maxLength={20}
              pattern="[A-Za-z0-9_\-]+"
              title="Letters, numbers, - and _"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="R1"
            />
          </Field>
          <Field
            label="Vehicle"
            className="sm:col-span-4"
            hint={vehicles.error ? vehicles.error.message : !vehicles.isLoading && !vehicleOptions.length ? "Add a vehicle in the Vehicles tab first" : undefined}
          >
            <Select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              options={vehicleOptions}
              placeholder={vehicles.isLoading ? "Loading vehicles…" : "No vehicle yet"}
            />
          </Field>
          <Field label={`Fee per month (${currency})`} required className="sm:col-span-2">
            <Input required type="number" min={0} step="0.01" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="1500" />
          </Field>
          {route && (
            <div className="sm:col-span-6">
              <Checkbox label="Route is running (active)" checked={isActive} onChange={setIsActive} />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Stops</p>
            <Button variant="outline" size="sm" onClick={() => setStops((rows) => [...rows, newRow()])}>
              <Plus className="h-3.5 w-3.5" /> Add stop
            </Button>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Leave a stop&apos;s fee empty to use the route fee. Removing a stop where students board is refused until they are moved.
          </p>
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <div key={stop.key} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Stop {index + 1}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Move down" disabled={index === stops.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" aria-label="Remove stop" onClick={() => removeRow(stop.key)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                  <Field label="Stop name" className="col-span-2 sm:col-span-5">
                    <Input maxLength={128} value={stop.name} onChange={(e) => update(stop.key, { name: e.target.value })} placeholder="MG Road Metro" />
                  </Field>
                  <Field label="Pickup" className="sm:col-span-2">
                    <Input type="time" value={stop.pickupTime} onChange={(e) => update(stop.key, { pickupTime: e.target.value })} />
                  </Field>
                  <Field label="Drop" className="sm:col-span-2">
                    <Input type="time" value={stop.dropTime} onChange={(e) => update(stop.key, { dropTime: e.target.value })} />
                  </Field>
                  <Field label="Fee / month" className="col-span-2 sm:col-span-3">
                    <Input type="number" min={0} step="0.01" value={stop.fee} onChange={(e) => update(stop.key, { fee: e.target.value })} placeholder="Route fee" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RouteFormModal;
