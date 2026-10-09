"use client";

import { BookOpen, Bus, MapPin, Phone, UserRound } from "lucide-react";
import { Badge, ErrorState, LoadingState } from "@/components/ui";
import { useApiQuery } from "@/lib/api/hooks";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PORTAL_KEY, portalPath } from "../../hooks";
import type { PortalBookIssue, PortalChild, PortalServices } from "../../types";
import PortalPage from "../../components/PortalPage";
import { CardEmpty, formatClock, SectionCard, plural } from "../../components/portal-ui";

export default function MyServicesPage() {
  return (
    <PortalPage title="Library & Transport">{(student) => <ServicesBody key={student.id} student={student} />}</PortalPage>
  );
}

function ServicesBody({ student }: { student: PortalChild }) {
  const query = useApiQuery<PortalServices>([PORTAL_KEY, "services", student.id], portalPath(student.id, "services"));

  if (query.isLoading) return <LoadingState label="Loading library and transport…" />;
  if (query.error || !query.data) {
    return <ErrorState message={query.error?.message ?? "Could not load library and transport."} onRetry={() => query.refetch()} />;
  }

  const { library, transport, currency } = query.data;
  const money = (v: string | number) => formatCurrency(v, currency);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <SectionCard
          title="Library books with me"
          action={
            library.overdueCount > 0 ? (
              <Badge tone="red">{plural(library.overdueCount, "overdue book")}</Badge>
            ) : library.unpaidFines > 0 ? (
              <Badge tone="orange">Fines due {money(library.unpaidFines)}</Badge>
            ) : undefined
          }
        >
          {library.current.length === 0 ? (
            <CardEmpty>No library books issued right now.</CardEmpty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {library.current.map((i) => (
                <BookRow key={i.id} issue={i} money={money} />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recently returned">
          {library.history.length === 0 ? (
            <CardEmpty>No returned books yet.</CardEmpty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {library.history.map((i) => (
                <BookRow key={i.id} issue={i} money={money} />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="School transport" className="self-start">
        {!transport ? (
          <CardEmpty>Not using school transport. Contact the school office to opt in.</CardEmpty>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1C263A] text-white">
                <Bus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-gray-900">{transport.route.name}</p>
                <p className="text-xs text-gray-500">
                  Route {transport.route.code} · since {formatDate(transport.startDate)}
                  {transport.endDate ? ` until ${formatDate(transport.endDate)}` : ""}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                {transport.stop?.name ?? "Stop not assigned yet"}
              </p>
              {transport.stop && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Pickup</p>
                    <p className="font-bold text-gray-900">{formatClock(transport.stop.pickupTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Drop</p>
                    <p className="font-bold text-gray-900">{formatClock(transport.stop.dropTime)}</p>
                  </div>
                </div>
              )}
            </div>

            {transport.vehicle ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Vehicle <span className="font-bold text-gray-900">{transport.vehicle.registrationNumber}</span>
                  {transport.vehicle.model ? ` · ${transport.vehicle.model}` : ""}
                </p>
                <Contact role="Driver" name={transport.vehicle.driverName} phone={transport.vehicle.driverPhone} />
                {transport.vehicle.helperName && (
                  <Contact role="Attendant" name={transport.vehicle.helperName} phone={transport.vehicle.helperPhone} />
                )}
              </div>
            ) : (
              <CardEmpty>No vehicle assigned to this route yet.</CardEmpty>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function BookRow({ issue: i, money }: { issue: PortalBookIssue; money: (v: string | number) => string }) {
  const fine = Number(i.fineAmount);
  return (
    <li className="flex items-start gap-3 py-3">
      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{i.book.title}</p>
        {i.book.author && <p className="text-xs text-gray-500">{i.book.author}</p>}
        <p className="mt-0.5 text-xs text-gray-500">
          Issued {formatDate(i.issuedAt)} ·{" "}
          {i.returnedAt ? `Returned ${formatDate(i.returnedAt)}` : <span className={i.isOverdue ? "font-semibold text-red-600" : ""}>Due {formatDate(i.dueDate)}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {i.isOverdue && <Badge tone="red">{plural(i.overdueDays, "day")} late</Badge>}
        {fine > 0 && (
          <span className={`text-xs font-semibold ${i.finePaid ? "text-gray-500" : "text-red-600"}`}>
            Fine {money(fine)}
            {i.finePaid ? " (paid)" : ""}
          </span>
        )}
      </div>
    </li>
  );
}

function Contact({ role, name, phone }: { role: string; name: string; phone: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex min-w-0 items-center gap-2">
        <UserRound className="h-4 w-4 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500">{role}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
        </div>
      </div>
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
        >
          <Phone className="h-3.5 w-3.5" /> {phone}
        </a>
      )}
    </div>
  );
}
