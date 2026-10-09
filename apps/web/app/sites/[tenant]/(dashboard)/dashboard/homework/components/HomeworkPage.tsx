"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, Field, PageHeader, Pagination, QueryState, SearchInput, Select } from "@/components/ui";
import { useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useSections, useSubjects } from "@/lib/api/lookups";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import type { HomeworkItem } from "../types";
import HomeworkCard from "./HomeworkCard";
import HomeworkDetailModal from "./HomeworkDetailModal";
import HomeworkFormModal from "./HomeworkFormModal";
import LinkButton from "./LinkButton";

type StatusFilter = "" | "upcoming" | "past";

const HomeworkPage = () => {
  const can = useCan();
  const canManage = can(PERMISSIONS.HOMEWORK_MANAGE);
  const sections = useSections();
  const subjects = useSubjects();

  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("upcoming");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(search);

  const list = usePaginatedQuery<HomeworkItem>(["homework", "list"], "homework", {
    sectionId: sectionId || undefined,
    subjectId: subjectId || undefined,
    status: status || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 12,
  });

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const noSetup = !sections.isLoading && !subjects.isLoading && (!sections.data?.length || !subjects.data?.length);
  const filtered = !!(sectionId || subjectId || debouncedSearch || status);

  return (
    <div>
      <PageHeader
        title="Homework"
        description="Assign homework, track submissions and grade students"
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)} disabled={noSetup}>
              <Plus className="h-4 w-4" /> Assign Homework
            </Button>
          )
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Section">
          <Select
            value={sectionId}
            onChange={(e) => resetPage(setSectionId)(e.target.value)}
            placeholder="All sections"
            options={(sections.data ?? []).map((s) => ({ value: s.id, label: s.label }))}
          />
        </Field>
        <Field label="Subject">
          <Select
            value={subjectId}
            onChange={(e) => resetPage(setSubjectId)(e.target.value)}
            placeholder="All subjects"
            options={(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => resetPage(setStatus)(e.target.value as StatusFilter)}
            placeholder="All"
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past due" },
            ]}
          />
        </Field>
        <Field label="Search">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by title…" />
        </Field>
      </div>

      {noSetup ? (
        <EmptyState
          title="Set up sections and subjects first"
          description="Homework is assigned to a section for a subject. Create them in Academic Setup."
          action={<LinkButton href="/dashboard/academics">Go to Academic Setup</LinkButton>}
        />
      ) : (
        <QueryState
          isLoading={list.isLoading}
          error={list.error}
          onRetry={() => list.refetch()}
          isEmpty={!list.data?.data.length}
          empty={
            <EmptyState
              title={filtered ? "No homework matches these filters" : "No homework yet"}
              description={
                status === "upcoming"
                  ? "Nothing is due soon. Switch the status filter to see past homework."
                  : "Assign homework to a section and track submissions here."
              }
              action={
                canManage && (
                  <Button variant="secondary" onClick={() => setCreating(true)}>
                    Assign Homework
                  </Button>
                )
              }
            />
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.data?.data.map((hw) => (
              <HomeworkCard key={hw.id} homework={hw} onOpen={setOpenId} />
            ))}
          </div>
          <Pagination meta={list.data?.meta} onPageChange={setPage} />
        </QueryState>
      )}

      <HomeworkFormModal
        homework={creating ? null : undefined}
        defaults={{ sectionId, subjectId }}
        onClose={() => setCreating(false)}
        onSaved={(hw) => setOpenId(hw.id)}
      />
      <HomeworkDetailModal key={openId ?? "none"} homeworkId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default HomeworkPage;
