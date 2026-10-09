"use client";

import { useApiQuery } from "./hooks";
import type {
  AcademicYear,
  Branch,
  ClassItem,
  SectionOption,
  StaffOption,
  StudentOption,
  Subject,
} from "./types";

// Shared reference data used by many screens (dropdowns, filters).
// Cached for 5 minutes; academic mutations invalidate these keys.
const LOOKUP_STALE = 5 * 60_000;

export const useAcademicYears = () =>
  useApiQuery<AcademicYear[]>(["academic-years"], "academic-years", undefined, { staleTime: LOOKUP_STALE });

export const useCurrentAcademicYear = () => {
  const query = useAcademicYears();
  return { ...query, data: query.data?.find((y) => y.isCurrent) ?? null };
};

export const useBranches = () => useApiQuery<Branch[]>(["branches"], "branches", undefined, { staleTime: LOOKUP_STALE });

export const useClasses = () => useApiQuery<ClassItem[]>(["classes"], "classes", undefined, { staleTime: LOOKUP_STALE });

export const useSections = () =>
  useApiQuery<SectionOption[]>(["sections"], "sections", undefined, { staleTime: LOOKUP_STALE });

export const useSubjects = () => useApiQuery<Subject[]>(["subjects"], "subjects", undefined, { staleTime: LOOKUP_STALE });

export const useStaffOptions = () =>
  useApiQuery<StaffOption[]>(["staff", "options"], "staff/options", undefined, { staleTime: LOOKUP_STALE });

// sectionId: undefined = all sections, null = disabled (e.g. nothing picked yet).
// search filters by name / admission number (debounce it in the caller).
export const useStudentOptions = (sectionId?: string | null, search?: string) =>
  useApiQuery<StudentOption[]>(
    ["students", "options"],
    sectionId === null ? null : "students/options",
    { sectionId: sectionId || undefined, search: search || undefined },
  );

// Query keys to invalidate after academic structure changes.
export const ACADEMIC_KEYS = [["academic-years"], ["branches"], ["classes"], ["sections"], ["subjects"]];
