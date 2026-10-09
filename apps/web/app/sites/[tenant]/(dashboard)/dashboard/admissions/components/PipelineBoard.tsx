"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardCheck, Clock, Pencil, Phone, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { PIPELINE_STAGES, STAGE_LABEL, sourceLabel, type Enquiry, type EnquiryActions } from "../types";

const ADMITTED_SHOWN = 20;

const PipelineBoard = ({ enquiries, actions }: { enquiries: Enquiry[]; actions: EnquiryActions }) => (
  // Horizontally scrollable on small screens; columns share the width on large ones.
  <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
    <div className="flex min-w-max gap-4 xl:min-w-0">
      {PIPELINE_STAGES.map((stage) => {
        const items = enquiries.filter((e) => e.stage === stage);
        const shown = stage === "ADMITTED" ? items.slice(0, ADMITTED_SHOWN) : items;
        return (
          <section key={stage} className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50/80 p-2 xl:w-auto xl:flex-1">
            <header className="mb-2 flex items-center justify-between px-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-[#6D839E]">
              <span>{STAGE_LABEL[stage]}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-600">{items.length}</span>
            </header>
            <div className="flex flex-col gap-2">
              {shown.length === 0 && <p className="px-2 py-6 text-center text-xs text-gray-400">No applicants</p>}
              {shown.map((e) => (
                <PipelineCard key={e.id} enquiry={e} actions={actions} />
              ))}
              {items.length > shown.length && (
                <p className="px-2 py-1 text-center text-[11px] text-gray-400">
                  +{items.length - shown.length} more in “All Enquiries”
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

const PipelineCard = ({ enquiry: e, actions }: { enquiry: Enquiry; actions: EnquiryActions }) => {
  const index = PIPELINE_STAGES.indexOf(e.stage);
  const admitted = e.stage === "ADMITTED";
  const prev = index > 0 && !admitted ? PIPELINE_STAGES[index - 1] : undefined;
  // From OFFER_SENT the next step is "Admit".
  const next = index >= 0 && index < PIPELINE_STAGES.indexOf("OFFER_SENT") ? PIPELINE_STAGES[index + 1] : undefined;
  const busy = actions.movingId === e.id;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-gray-900">{e.studentName}</h4>
          <p className="text-xs text-gray-500">
            {e.classApplied} · {sourceLabel(e.source)}
          </p>
        </div>
        {actions.canManage && !admitted && (
          <button
            type="button"
            onClick={() => actions.edit(e)}
            aria-label="Edit enquiry"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <a href={`tel:${e.phone}`} className="mt-1.5 flex items-center gap-1 text-xs text-blue-700 hover:underline">
        <Phone className="h-3 w-3" /> {e.phone}
        {e.parentName && <span className="truncate text-gray-400">· {e.parentName}</span>}
      </a>

      {e.stage === "ENTRANCE_TEST" && (
        <p className="mt-1.5 text-[11px] text-gray-500">
          Test: {e.testDate ? formatDateTime(e.testDate) : "not scheduled"}
          {e.testScore != null && <span className="font-bold text-gray-800"> · Score {Number(e.testScore)}</span>}
        </p>
      )}
      {admitted && (
        <p className="mt-1.5 text-[11px] text-gray-500">
          Admitted {formatDate(e.updatedAt)}
          {e.studentId && (
            <>
              {" · "}
              <Link href={`/dashboard/students/${e.studentId}`} className="font-bold text-blue-700 hover:underline">
                View student
              </Link>
            </>
          )}
        </p>
      )}

      {actions.canManage && !admitted && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-2">
          <IconButton label={prev ? `Back to ${STAGE_LABEL[prev]}` : "Back"} disabled={!prev || busy} onClick={() => prev && actions.move(e, prev)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label={next ? `Move to ${STAGE_LABEL[next]}` : "Next"} disabled={!next || busy} onClick={() => next && actions.move(e, next)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </IconButton>
          {e.stage === "ENTRANCE_TEST" && (
            <IconButton label="Test date & score" onClick={() => actions.recordTest(e)}>
              <ClipboardCheck className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <IconButton label="Waitlist" disabled={busy} onClick={() => actions.move(e, "WAITLISTED")}>
            <Clock className="h-3.5 w-3.5 text-orange-600" />
          </IconButton>
          <IconButton label="Reject" disabled={busy} onClick={() => actions.reject(e)}>
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          </IconButton>
          {actions.canAdmit && (
            <Button
              size="sm"
              variant={e.stage === "OFFER_SENT" ? "success" : "outline"}
              className="ml-auto px-2 py-1"
              onClick={() => actions.admit(e)}
            >
              <UserCheck className="h-3.5 w-3.5" /> Admit
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

const IconButton = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
  >
    {children}
  </button>
);

export default PipelineBoard;
