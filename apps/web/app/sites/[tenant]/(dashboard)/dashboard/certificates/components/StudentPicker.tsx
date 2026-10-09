"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, LoadingState, SearchInput } from "@/components/ui";
import { useDebounce } from "@/lib/api/hooks";
import { useStudentOptions } from "@/lib/api/lookups";
import type { StudentOption } from "@/lib/api/types";
import { getInitials } from "@/lib/utils/format";

// Search-as-you-type student chooser (active students, name or admission no).
const StudentPicker = ({
  value,
  onChange,
  disabled,
}: {
  value: StudentOption | null;
  onChange: (student: StudentOption | null) => void;
  disabled?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search).trim();
  // Only query once something is typed (null sectionId keeps it disabled).
  const options = useStudentOptions(debounced ? undefined : null, debounced);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1C263A] text-xs font-bold text-white">
          {getInitials(value.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{value.name}</p>
          <p className="truncate text-xs text-gray-500">
            Adm. {value.admissionNumber}
            {value.sectionLabel && <> · {value.sectionLabel}</>}
            {value.rollNumber != null && <> · Roll {value.rollNumber}</>}
          </p>
        </div>
        {!disabled && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} aria-label="Change student">
            <X className="h-4 w-4" /> Change
          </Button>
        )}
      </div>
    );
  }

  const results = options.data ?? [];
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search by student name or admission no…" />
      {debounced && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {options.isLoading ? (
            <LoadingState label="Searching…" className="py-6" />
          ) : options.error ? (
            <p className="px-3 py-4 text-xs text-red-600">{options.error.message}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-500">No active student matches “{debounced}”.</p>
          ) : (
            results.slice(0, 20).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s);
                  setSearch("");
                }}
                className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 cursor-pointer"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-600">
                  {getInitials(s.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-gray-900">{s.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    Adm. {s.admissionNumber}
                    {s.sectionLabel && <> · {s.sectionLabel}</>}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPicker;
