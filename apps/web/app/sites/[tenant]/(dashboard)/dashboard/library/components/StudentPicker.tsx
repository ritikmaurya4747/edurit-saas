"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, LoadingState, SearchInput } from "@/components/ui";
import { useDebounce } from "@/lib/api/hooks";
import { useStudentOptions } from "@/lib/api/lookups";
import type { StudentOption } from "@/lib/api/types";

// Search-as-you-type student chooser (active students, current year).
const StudentPicker = ({
  value,
  onChange,
}: {
  value: StudentOption | null;
  onChange: (student: StudentOption | null) => void;
}) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim());
  // Only search once 2+ characters are typed (null keeps the query idle).
  const options = useStudentOptions(debounced.length >= 2 && !value ? undefined : null, debounced);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{value.name}</p>
          <p className="text-xs text-gray-500">
            Adm. {value.admissionNumber}
            {value.sectionLabel && <> · {value.sectionLabel}</>}
            {value.rollNumber != null && <> · Roll {value.rollNumber}</>}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" /> Change
        </Button>
      </div>
    );
  }

  const rows = options.data ?? [];
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Type a name or admission number…" />
      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200">
        {debounced.length < 2 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-500">Type at least 2 characters to find a student.</p>
        ) : options.isLoading ? (
          <LoadingState label="Searching…" className="py-6" />
        ) : options.error ? (
          <p className="px-3 py-4 text-center text-xs text-red-600">{options.error.message}</p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-500">No active students match “{debounced}”.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onChange(s)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="truncate text-sm font-semibold text-gray-900">{s.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {s.sectionLabel ?? "—"} · {s.admissionNumber}
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
