"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2, Users } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { AUDIENCE_LABEL, TYPE_STYLE, formatRange, isHolidayItem, type CalendarItem } from "./utils";

interface Props {
  item: CalendarItem;
  canManage: boolean;
  onEdit: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  compact?: boolean;
}

// One calendar item with its actions. Exams are read-only (managed in Exams).
const EventItem = ({ item, canManage, onEdit, onDelete, compact }: Props) => {
  const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.OTHER;
  return (
    <article className={cn("flex gap-3 rounded-lg border border-gray-200 bg-white", compact ? "p-3" : "p-4")}>
      <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={style.tone}>{style.label}</Badge>
          {isHolidayItem(item) && item.type !== "HOLIDAY" && <Badge tone="red">School closed</Badge>}
          {item.source === "CALENDAR" && item.targetRole !== "ALL" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
              <Users className="h-3 w-3" /> {AUDIENCE_LABEL[item.targetRole] ?? item.targetRole}
            </span>
          )}
        </div>
        <h4 className="mt-1.5 text-sm font-bold text-gray-900">{item.title}</h4>
        <p className="text-xs font-semibold text-gray-500">{formatRange(item.startDate, item.endDate)}</p>
        {item.description && <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{item.description}</p>}

        {item.source === "EXAM" ? (
          <Link
            href="/dashboard/exams"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1C263A] hover:underline"
          >
            View in Exams <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          canManage && (
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(item)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          )
        )}
      </div>
    </article>
  );
};

export default EventItem;
