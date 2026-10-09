"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useApiQuery } from "@/lib/api/hooks";
import type { PortalMe } from "./types";

// Query keys of the portal all start with this domain.
export const PORTAL_KEY = "portal";
export const PORTAL_STORAGE_KEY = "portal.studentId";

// ---------------------------------------------------------------------------
// Selected child: ?studentId= first, then localStorage, then the first child.
// Kept in a tiny external store so every component on the page agrees.
// ---------------------------------------------------------------------------
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("popstate", listener);
  };
};

const readUrlSelection = (): string | null => {
  try {
    return new URLSearchParams(window.location.search).get("studentId");
  } catch {
    return null;
  }
};

const readStoredSelection = (): string | null => {
  try {
    return window.localStorage.getItem(PORTAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

const readSelection = () => readUrlSelection() || readStoredSelection();

const storeSelection = (studentId: string) => {
  try {
    window.localStorage.setItem(PORTAL_STORAGE_KEY, studentId);
  } catch {
    // storage unavailable (private mode) — selection just won't be remembered
  }
};

const writeSelection = (studentId: string) => {
  storeSelection(studentId);
  // An explicit choice replaces any ?studentId= in the address bar.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("studentId")) {
      url.searchParams.delete("studentId");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
};

export function usePortalMe() {
  return useApiQuery<PortalMe>([PORTAL_KEY, "me"], "portal/me", undefined, { staleTime: 5 * 60_000 });
}

// The child whose data the portal pages show, plus a setter for the switcher.
export function usePortalStudent() {
  const me = usePortalMe();
  const preferred = useSyncExternalStore(subscribe, readSelection, () => null);
  const children = me.data?.children ?? [];
  const student = children.find((c) => c.id === preferred) ?? children[0] ?? null;

  // Remember a valid ?studentId= so the next page opens on the same child.
  useEffect(() => {
    if (student && readUrlSelection() === student.id) storeSelection(student.id);
  }, [student]);

  const select = useCallback((studentId: string) => writeSelection(studentId), []);

  return { me, children, student, studentId: student?.id ?? null, select };
}

// Path of a portal endpoint for the selected student (null until known).
export const portalPath = (studentId: string | null, resource: string) =>
  studentId ? `portal/students/${studentId}/${resource}` : null;
