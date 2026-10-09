"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatCurrency } from "@/lib/utils/format";
import { CURRENCIES, TIMEZONES, type SchoolSettings } from "./types";

const previewTime = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return "—";
  }
};

const RegionalTab = ({ data }: { data: SchoolSettings }) => {
  const router = useRouter();
  const can = useCan();
  const canEdit = can(PERMISSIONS.SETTINGS_MANAGE);
  const [currency, setCurrency] = useState(data.settings.currency);
  const [timezone, setTimezone] = useState(data.settings.timezone);

  const currencyOptions = CURRENCIES.some((c) => c.value === data.settings.currency)
    ? CURRENCIES
    : [{ value: data.settings.currency, label: data.settings.currency }, ...CURRENCIES];
  const timezoneOptions = (TIMEZONES.includes(data.settings.timezone) ? TIMEZONES : [data.settings.timezone, ...TIMEZONES]).map(
    (tz) => ({ value: tz, label: tz.replace(/_/g, " ") }),
  );

  const dirty = currency !== data.settings.currency || timezone !== data.settings.timezone;

  const save = useApiMutation(() => api.patch("settings/school", { currency, timezone }), {
    invalidate: [["settings"], ["dashboard"]],
    success: "Regional settings saved",
    onSuccess: () => router.refresh(),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canEdit && dirty) save.mutate();
      }}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900">Currency & timezone</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          The timezone decides what &ldquo;today&rdquo; means for attendance, leave and fee due dates.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Currency" hint={`Example: ${formatCurrency(12500.5, currency)}`}>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
              disabled={!canEdit || save.isPending}
            />
          </Field>
          <Field label="Timezone" hint={`Local time there: ${previewTime(timezone)}`}>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={timezoneOptions}
              disabled={!canEdit || save.isPending}
            />
          </Field>
        </div>

        {currency !== data.settings.currency && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Changing the currency applies to new invoices and reports. Existing invoices keep the currency they were
            issued in.
          </p>
        )}
      </Card>

      {canEdit ? (
        <div className="flex justify-end gap-2">
          {dirty && (
            <Button
              variant="secondary"
              onClick={() => {
                setCurrency(data.settings.currency);
                setTimezone(data.settings.timezone);
              }}
              disabled={save.isPending}
            >
              Reset
            </Button>
          )}
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            Save regional settings
          </Button>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Only users with the &lsquo;Manage school settings&rsquo; permission can change these.</p>
      )}
    </form>
  );
};

export default RegionalTab;
