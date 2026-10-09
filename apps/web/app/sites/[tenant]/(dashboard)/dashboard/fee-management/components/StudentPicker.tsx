"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SearchInput } from "@/components/ui";
import { useDebounce } from "@/lib/api/hooks";
import { useStudentOptions } from "@/lib/api/lookups";
import type { StudentRef } from "../types";

export type PickedStudent = StudentRef & { sectionLabel?: string | null };

// Search students by name / admission number and pick one.
const StudentPicker = ({
  value,
  onChange,
}: {
  value: PickedStudent | null;
  onChange: (student: PickedStudent | null) => void;
}) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim());
  const options = useStudentOptions(undefined, debounced);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{value.name}</p>
          <p className="text-xs text-gray-500">
            {value.admissionNumber}
            {value.sectionLabel ? ` · ${value.sectionLabel}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          aria-label="Change student"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const results = options.data ?? [];
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search by student name or admission no." />
      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200">
        {options.isLoading ? (
          <p className="px-3 py-3 text-xs text-gray-500">Searching…</p>
        ) : options.error ? (
          <p className="px-3 py-3 text-xs text-red-600">{options.error.message}</p>
        ) : results.length === 0 ? (
          <p className="px-3 py-3 text-xs text-gray-500">
            {debounced ? "No students match this search." : "Type a name or admission number to find a student."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ id: s.id, name: s.name, admissionNumber: s.admissionNumber, sectionLabel: s.sectionLabel })
                  }
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="truncate text-sm font-semibold text-gray-900">{s.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {s.admissionNumber}
                    {s.sectionLabel ? ` · ${s.sectionLabel}` : ""}
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

export default StudentPicker;
