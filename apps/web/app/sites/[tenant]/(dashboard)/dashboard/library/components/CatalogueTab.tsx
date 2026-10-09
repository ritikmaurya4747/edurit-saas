"use client";

import { useMemo, useState } from "react";
import { BookUp, Pencil, Plus, Trash2 } from "lucide-react";
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
  Pagination,
  QueryState,
  SearchInput,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useApiQuery, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { PERMISSIONS, useCan } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { LIBRARY_KEYS, type Book } from "./types";

type BookForm = {
  id?: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  shelfLocation: string;
  totalCopies: string;
  issuedCount: number;
};

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  category: "",
  shelfLocation: "",
  totalCopies: "1",
  issuedCount: 0,
};

const CatalogueTab = ({ onIssue }: { onIssue: (book: Book) => void }) => {
  const can = useCan();
  const canManage = can(PERMISSIONS.LIBRARY_MANAGE);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<BookForm | null>(null);
  const [toDelete, setToDelete] = useState<Book | null>(null);
  const debouncedSearch = useDebounce(search);

  const categories = useApiQuery<string[]>(["library", "categories"], "library/books/categories");
  const books = usePaginatedQuery<Book>(["library", "books"], "library/books", {
    search: debouncedSearch.trim() || undefined,
    category: category || undefined,
    available: availableOnly || undefined,
    page,
    limit: 20,
  });

  const save = useApiMutation(
    (f: BookForm) => {
      const text = (v: string) => v.trim() || null;
      const body = {
        title: f.title.trim(),
        author: text(f.author),
        isbn: text(f.isbn),
        publisher: text(f.publisher),
        category: text(f.category),
        shelfLocation: text(f.shelfLocation),
        totalCopies: Number(f.totalCopies),
      };
      if (f.id) return api.patch(`library/books/${f.id}`, body);
      return api.post("library/books", Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null)));
    },
    { invalidate: LIBRARY_KEYS, success: "Book saved", onSuccess: () => setForm(null) },
  );
  const remove = useApiMutation((id: string) => api.delete(`library/books/${id}`), {
    invalidate: LIBRARY_KEYS,
    success: "Book removed from the catalogue",
    onSuccess: () => setToDelete(null),
  });

  const columns = useMemo<ColumnDef<Book>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex min-w-[200px] flex-col">
            <span className="font-bold text-gray-900">{row.original.title}</span>
            <span className="text-xs text-gray-500">
              {row.original.author ?? "Unknown author"}
              {row.original.publisher && <> · {row.original.publisher}</>}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "isbn",
        header: "ISBN",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs text-gray-600">{row.original.isbn ?? "—"}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (row.original.category ? <Badge tone="purple">{row.original.category}</Badge> : <span className="text-gray-400">—</span>),
      },
      {
        accessorKey: "shelfLocation",
        header: "Shelf",
        cell: ({ row }) => <span className="whitespace-nowrap font-semibold text-gray-700">{row.original.shelfLocation ?? "—"}</span>,
      },
      {
        id: "copies",
        header: "Available",
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className={cn("font-bold", row.original.availableCopies === 0 ? "text-red-600" : "text-gray-900")}>
              {row.original.availableCopies} / {row.original.totalCopies}
            </span>
            <span className="text-[11px] text-gray-500">{row.original.issuedCount} issued</span>
          </div>
        ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="sm" disabled={row.original.availableCopies === 0} onClick={() => onIssue(row.original)}>
                    <BookUp className="h-3.5 w-3.5" /> Issue
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Edit"
                    onClick={() =>
                      setForm({
                        id: row.original.id,
                        title: row.original.title,
                        author: row.original.author ?? "",
                        isbn: row.original.isbn ?? "",
                        publisher: row.original.publisher ?? "",
                        category: row.original.category ?? "",
                        shelfLocation: row.original.shelfLocation ?? "",
                        totalCopies: String(row.original.totalCopies),
                        issuedCount: row.original.issuedCount,
                      })
                    }
                  >
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
            } satisfies ColumnDef<Book>,
          ]
        : []),
    ],
    [canManage, onIssue],
  );

  const rows = books.data?.data ?? [];
  const hasFilters = !!(debouncedSearch.trim() || category || availableOnly);
  const set = <K extends keyof BookForm>(key: K, value: BookForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-72"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search title, author or ISBN…"
          />
          <Select
            className="sm:w-48"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            options={(categories.data ?? []).map((c) => ({ value: c, label: c }))}
            placeholder="All categories"
          />
          <Checkbox
            label="Available only"
            checked={availableOnly}
            onChange={(v) => {
              setAvailableOnly(v);
              setPage(1);
            }}
          />
        </div>
        {canManage && (
          <Button onClick={() => setForm({ ...emptyForm })}>
            <Plus className="h-4 w-4" /> Add book
          </Button>
        )}
      </div>

      <QueryState
        isLoading={books.isLoading}
        error={books.error}
        onRetry={() => books.refetch()}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            title={hasFilters ? "No books match" : "The catalogue is empty"}
            description={hasFilters ? "Try a different search or category." : "Add the library's books with their copies and shelf locations to start issuing them."}
            action={
              !hasFilters && canManage ? (
                <Button size="sm" onClick={() => setForm({ ...emptyForm })}>
                  <Plus className="h-4 w-4" /> Add book
                </Button>
              ) : undefined
            }
          />
        }
      >
        <DataTable columns={columns} data={rows} />
        <Pagination meta={books.data?.meta} onPageChange={setPage} />
      </QueryState>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit book" : "Add book"}
        size="lg"
        onSubmit={() => form && save.mutate(form)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save book
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" required className="sm:col-span-2">
              <Input required maxLength={255} value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
            </Field>
            <Field label="Author">
              <Input maxLength={255} value={form.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Publisher">
              <Input maxLength={255} value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />
            </Field>
            <Field label="ISBN">
              <Input
                maxLength={32}
                pattern="[0-9Xx \-]*"
                title="Digits, X, spaces and -"
                value={form.isbn}
                onChange={(e) => set("isbn", e.target.value)}
                placeholder="978…"
              />
            </Field>
            <Field label="Category" hint="Pick an existing one or type a new one">
              <Input list="library-categories" maxLength={64} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Fiction" />
              <datalist id="library-categories">
                {(categories.data ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Shelf location">
              <Input maxLength={32} value={form.shelfLocation} onChange={(e) => set("shelfLocation", e.target.value.toUpperCase())} placeholder="A-3" />
            </Field>
            <Field
              label="Total copies"
              required
              hint={form.id && form.issuedCount ? `${form.issuedCount} currently issued — cannot go below that` : undefined}
            >
              <Input
                required
                type="number"
                min={Math.max(1, form.issuedCount)}
                max={10000}
                step={1}
                value={form.totalCopies}
                onChange={(e) => set("totalCopies", e.target.value)}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title={`Remove "${toDelete?.title}"?`}
        message={
          toDelete?.issuedCount
            ? `${toDelete.issuedCount} cop${toDelete.issuedCount === 1 ? "y is" : "ies are"} still issued. Collect them before removing this title.`
            : "The title is removed from the catalogue. Its past issue records are kept."
        }
        confirmLabel="Remove"
      />
    </div>
  );
};

export default CatalogueTab;
