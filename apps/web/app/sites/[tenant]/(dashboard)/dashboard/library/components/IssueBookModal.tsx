"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button, Field, Input, LoadingState, Modal, SearchInput, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { useApiMutation, useDebounce, usePaginatedQuery } from "@/lib/api/hooks";
import { useStaffOptions } from "@/lib/api/lookups";
import type { StaffOption, StudentOption } from "@/lib/api/types";
import { todayInput } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import StudentPicker from "./StudentPicker";
import { DEFAULT_LOAN_DAYS, LIBRARY_KEYS, inputDaysFromToday, type Book, type BorrowerType } from "./types";

const Label = ({ children }: { children: string }) => (
  <p className="mb-1.5 text-xs font-semibold text-gray-700">
    {children}
    <span className="ml-0.5 text-red-500">*</span>
  </p>
);

// Issue flow: pick a book (unless preselected), a student or staff borrower and a due date.
const IssueBookModal = ({
  book: preselected,
  maxBooksPerStudent = 3,
  defaultLoanDays = DEFAULT_LOAN_DAYS,
  onClose,
  onIssued,
}: {
  book: Book | null;
  maxBooksPerStudent?: number;
  defaultLoanDays?: number;
  onClose: () => void;
  onIssued?: () => void;
}) => {
  const [book, setBook] = useState<Book | null>(preselected);
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("student");
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [staff, setStaff] = useState<StaffOption | null>(null);
  const [dueDate, setDueDate] = useState(inputDaysFromToday(defaultLoanDays));
  const [remarks, setRemarks] = useState("");

  const borrowerChosen = borrowerType === "student" ? !!student : !!staff;

  const issue = useApiMutation(
    () =>
      api.post("library/issues", {
        bookId: book!.id,
        ...(borrowerType === "student" ? { studentId: student!.id } : { staffId: staff!.id }),
        dueDate,
        ...(remarks.trim() && { remarks: remarks.trim() }),
      }),
    {
      invalidate: LIBRARY_KEYS,
      success: "Book issued",
      onSuccess: () => {
        onIssued?.();
        onClose();
      },
    },
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Issue book"
      description={`Students may hold up to ${maxBooksPerStudent} books at a time.`}
      size="lg"
      onSubmit={() => book && borrowerChosen && issue.mutate()}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={issue.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={issue.isPending} disabled={!book || !borrowerChosen}>
            Issue book
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>Book</Label>
          <BookPicker value={book} onChange={setBook} />
        </div>

        <div>
          <Label>Borrower</Label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["student", "staff"] as const).map((type) => (
              <Button key={type} variant={borrowerType === type ? "primary" : "secondary"} onClick={() => setBorrowerType(type)}>
                {type === "student" ? "Student" : "Staff member"}
              </Button>
            ))}
          </div>
          {borrowerType === "student" ? (
            <StudentPicker value={student} onChange={setStudent} />
          ) : (
            <StaffPicker value={staff} onChange={setStaff} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Due date" required hint={`Default: ${defaultLoanDays} days from today`}>
            <Input required type="date" min={todayInput()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Remarks">
            <Textarea rows={1} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

const SelectedCard = ({ title, subtitle, onClear }: { title: string; subtitle: string; onClear: () => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-gray-900">{title}</p>
      <p className="truncate text-xs text-gray-500">{subtitle}</p>
    </div>
    <Button variant="ghost" size="sm" onClick={onClear}>
      <X className="h-3.5 w-3.5" /> Change
    </Button>
  </div>
);

const BookPicker = ({ value, onChange }: { value: Book | null; onChange: (book: Book | null) => void }) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim());
  const books = usePaginatedQuery<Book>(["library", "books", "picker"], value ? null : "library/books", {
    search: debounced || undefined,
    available: true,
    limit: 8,
  });

  if (value) {
    return (
      <SelectedCard
        title={value.title}
        subtitle={`${value.author ?? "Unknown author"} · ${value.availableCopies} of ${value.totalCopies} available${value.shelfLocation ? ` · Shelf ${value.shelfLocation}` : ""}`}
        onClear={() => onChange(null)}
      />
    );
  }

  const rows = books.data?.data ?? [];
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search available books by title, author or ISBN…" />
      <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-200">
        {books.isLoading ? (
          <LoadingState label="Searching…" className="py-6" />
        ) : books.error ? (
          <p className="px-3 py-4 text-center text-xs text-red-600">{books.error.message}</p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-500">
            {debounced ? `No available copies match “${debounced}”.` : "No books with copies on the shelf."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onChange(b)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">{b.title}</span>
                    <span className="block truncate text-xs text-gray-500">{b.author ?? "Unknown author"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {b.availableCopies}/{b.totalCopies} available
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StaffPicker = ({ value, onChange }: { value: StaffOption | null; onChange: (staff: StaffOption | null) => void }) => {
  const [search, setSearch] = useState("");
  const staff = useStaffOptions();
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = staff.data ?? [];
    return (q ? all.filter((s) => `${s.name} ${s.employeeCode} ${s.designation ?? ""}`.toLowerCase().includes(q)) : all).slice(0, 50);
  }, [staff.data, search]);

  if (value) {
    return (
      <SelectedCard
        title={value.name}
        subtitle={[value.employeeCode, value.designation, value.department].filter(Boolean).join(" · ")}
        onClear={() => onChange(null)}
      />
    );
  }

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search staff by name or employee code…" />
      <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-200">
        {staff.isLoading ? (
          <LoadingState label="Loading staff…" className="py-6" />
        ) : staff.error ? (
          <p className="px-3 py-4 text-center text-xs text-red-600">{staff.error.message}</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-500">No active staff match.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onChange(s)}
                  className={cn("flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50")}
                >
                  <span className="truncate text-sm font-semibold text-gray-900">{s.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {s.designation ?? "Staff"} · {s.employeeCode}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IssueBookModal;
