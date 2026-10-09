"use client";

import { useState } from "react";
import { Archive, Megaphone, Pencil, Plus, Send, Trash2, Users } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination,
  QueryState,
  SearchInput,
  Select,
  Tabs,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import NoticeFormModal, { NOTICE_KEYS } from "./NoticeFormModal";
import {
  AUDIENCE_LABEL,
  AUDIENCE_OPTIONS,
  PRIORITY_OPTIONS,
  PRIORITY_STYLE,
  type Notice,
  type NoticeForm,
  type NoticeStats,
  type NoticeStatus,
} from "./types";

type NoticeTab = "PUBLISHED" | "DRAFT" | "ARCHIVED";

const EMPTY_FORM: NoticeForm = { title: "", content: "", targetRole: "ALL", priority: "INFO" };
const PAGE_SIZE = 12;

const EMPTY_COPY: Record<NoticeTab, { title: string; description: string }> = {
  PUBLISHED: { title: "No published notices", description: "Published announcements will appear here." },
  DRAFT: { title: "No drafts", description: "Save a notice as a draft to finish and publish it later." },
  ARCHIVED: { title: "Nothing archived", description: "Archive old notices to keep the board tidy." },
};

const NoticeBoardPage = () => {
  const can = useCan();
  const canPublish = can(PERMISSIONS.NOTICE_PUBLISH);

  const [tab, setTab] = useState<NoticeTab>("PUBLISHED");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [audience, setAudience] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [form, setForm] = useState<NoticeForm | null>(null);
  const [toDelete, setToDelete] = useState<Notice | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const stats = useApiQuery<NoticeStats>(["notices", "stats"], "notices/stats");
  const notices = usePaginatedQuery<Notice>(["notices", "list"], "notices", {
    // Readers only ever receive published notices (enforced by the API).
    status: canPublish ? tab : undefined,
    priority: priority || undefined,
    targetRole: audience || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const publish = useApiMutation((id: string) => api.post(`notices/${id}/publish`), {
    invalidate: NOTICE_KEYS,
    success: "Notice published",
  });
  const archive = useApiMutation((id: string) => api.post(`notices/${id}/archive`), {
    invalidate: NOTICE_KEYS,
    success: "Notice archived",
  });
  const remove = useApiMutation((id: string) => api.delete(`notices/${id}`), {
    invalidate: NOTICE_KEYS,
    success: "Notice deleted",
    onSuccess: () => setToDelete(null),
  });

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openEdit = (n: Notice) =>
    setForm({ id: n.id, title: n.title, content: n.content, targetRole: n.targetRole, priority: n.priority, status: n.status });

  const rows = notices.data?.data ?? [];
  const hasFilters = !!(debouncedSearch.trim() || priority || audience);
  const empty = canPublish ? EMPTY_COPY[tab] : { title: "No notices yet", description: "Announcements from the school will appear here." };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-gray-900 md:text-3xl">Notice Board</h1>
          <p className="text-sm text-gray-500">
            {canPublish
              ? "Create, manage, and broadcast announcements across the school"
              : "Announcements from your school"}
          </p>
        </div>
        {canPublish && (
          <Button onClick={() => setForm({ ...EMPTY_FORM })} className="ml-auto md:ml-0">
            <Plus className="h-4 w-4" /> Create Notice
          </Button>
        )}
      </div>

      {/* Status tabs (publishers only) */}
      {canPublish && (
        <Tabs<NoticeTab>
          className="mb-0"
          active={tab}
          onChange={resetPage(setTab)}
          tabs={[
            { id: "PUBLISHED", label: "Published", count: stats.data?.published },
            { id: "DRAFT", label: "Drafts", count: stats.data?.draft },
            { id: "ARCHIVED", label: "Archived", count: stats.data?.archived },
          ]}
        />
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_200px]">
        <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search title or content…" />
        <Select
          value={priority}
          onChange={(e) => resetPage(setPriority)(e.target.value)}
          options={PRIORITY_OPTIONS}
          placeholder="All priorities"
          aria-label="Filter by priority"
        />
        <Select
          value={audience}
          onChange={(e) => resetPage(setAudience)(e.target.value)}
          options={AUDIENCE_OPTIONS}
          placeholder="All audiences"
          aria-label="Filter by audience"
        />
      </div>

      {/* Notice cards */}
      <QueryState
        isLoading={notices.isLoading}
        error={notices.error}
        onRetry={() => notices.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No notices match your filters" : empty.title}
            description={hasFilters ? "Try a different search, priority or audience." : empty.description}
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setPriority("");
                    setAudience("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : canPublish && tab !== "ARCHIVED" ? (
                <Button size="sm" onClick={() => setForm({ ...EMPTY_FORM })}>
                  <Plus className="h-4 w-4" /> Create Notice
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", notices.isFetching && "opacity-70 transition-opacity")}>
          {rows.map((n) => (
            <NoticeCard
              key={n.id}
              notice={n}
              expanded={expanded.has(n.id)}
              onToggle={() => toggleExpanded(n.id)}
              canPublish={canPublish}
              onEdit={() => openEdit(n)}
              onPublish={() => publish.mutate(n.id)}
              onArchive={() => archive.mutate(n.id)}
              onDelete={() => setToDelete(n)}
              busy={(publish.isPending && publish.variables === n.id) || (archive.isPending && archive.variables === n.id)}
            />
          ))}
        </div>
        <Pagination meta={notices.data?.meta} onPageChange={setPage} />
      </QueryState>

      {form && <NoticeFormModal key={form.id ?? "new"} initial={form} onClose={() => setForm(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="Delete this notice?"
        message={
          <>
            <span className="font-semibold text-gray-900">{toDelete?.title}</span> will be removed from the notice board for
            everyone. Consider archiving it instead if you may need it later.
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
};

interface CardProps {
  notice: Notice;
  expanded: boolean;
  onToggle: () => void;
  canPublish: boolean;
  busy: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const STATUS_BADGE: Record<NoticeStatus, { label: string; tone: "green" | "yellow" | "gray" }> = {
  PUBLISHED: { label: "Published", tone: "green" },
  DRAFT: { label: "Draft", tone: "yellow" },
  ARCHIVED: { label: "Archived", tone: "gray" },
};

const NoticeCard = ({ notice, expanded, onToggle, canPublish, busy, onEdit, onPublish, onArchive, onDelete }: CardProps) => {
  const style = PRIORITY_STYLE[notice.priority] ?? PRIORITY_STYLE.INFO;
  const isLong = notice.content.length > 240 || notice.content.split("\n").length > 4;
  const status = STATUS_BADGE[notice.status];

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-l-4 border-gray-200 bg-white p-5 shadow-sm",
        style.accent,
        notice.status === "ARCHIVED" && "opacity-80",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={style.tone}>
          {notice.priority === "ALERT" ? <Megaphone className="mr-1 h-3 w-3" /> : null}
          {style.label}
        </Badge>
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
          <Users className="h-3 w-3" /> {AUDIENCE_LABEL[notice.targetRole] ?? notice.targetRole}
        </span>
        {canPublish && notice.status !== "PUBLISHED" && status && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>

      <h3 className="text-base font-bold text-gray-900">{notice.title}</h3>
      <p className={cn("mt-1.5 whitespace-pre-line text-sm text-gray-600", !expanded && "line-clamp-4")}>{notice.content}</p>
      {isLong && (
        <button type="button" onClick={onToggle} className="mt-1 self-start text-xs font-semibold text-[#1C263A] hover:underline cursor-pointer">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {notice.status === "DRAFT" ? "Created" : "Posted"} {formatDateTime(notice.publishedAt)}
          {notice.createdBy && <> · by {notice.createdBy.name}</>}
        </p>
        {canPublish && (
          <div className="flex flex-wrap gap-2">
            {notice.status !== "PUBLISHED" && (
              <Button variant="success" size="sm" onClick={onPublish} loading={busy}>
                <Send className="h-3.5 w-3.5" /> {notice.status === "ARCHIVED" ? "Republish" : "Publish"}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            {notice.status !== "ARCHIVED" && (
              <Button variant="secondary" size="sm" onClick={onArchive} loading={busy}>
                <Archive className="h-3.5 w-3.5" /> Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>
    </article>
  );
};

export default NoticeBoardPage;
