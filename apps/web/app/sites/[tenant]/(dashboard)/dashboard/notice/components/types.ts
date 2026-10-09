import type { BadgeTone, SelectOption } from "@/components/ui";

export type NoticeTarget = "ALL" | "STAFF" | "TEACHER" | "STUDENT" | "PARENT";
export type NoticePriority = "INFO" | "ALERT" | "EVENT";
export type NoticeStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetRole: NoticeTarget;
  priority: NoticePriority;
  status: NoticeStatus;
  publishedAt: string;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
}

export interface NoticeStats {
  draft: number;
  published: number;
  archived: number;
  total: number;
}

export interface NoticeForm {
  id?: string;
  title: string;
  content: string;
  targetRole: NoticeTarget;
  priority: NoticePriority;
  status?: NoticeStatus;
}

export const AUDIENCE_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Everyone (school-wide)" },
  { value: "STAFF", label: "All staff" },
  { value: "TEACHER", label: "Teachers" },
  { value: "STUDENT", label: "Students" },
  { value: "PARENT", label: "Parents" },
];

export const AUDIENCE_LABEL: Record<NoticeTarget, string> = {
  ALL: "Everyone",
  STAFF: "Staff",
  TEACHER: "Teachers",
  STUDENT: "Students",
  PARENT: "Parents",
};

export const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "INFO", label: "General info" },
  { value: "ALERT", label: "Important alert" },
  { value: "EVENT", label: "Event" },
];

export const PRIORITY_STYLE: Record<NoticePriority, { label: string; tone: BadgeTone; accent: string }> = {
  INFO: { label: "Info", tone: "blue", accent: "border-l-blue-400" },
  ALERT: { label: "Alert", tone: "red", accent: "border-l-red-500" },
  EVENT: { label: "Event", tone: "purple", accent: "border-l-purple-500" },
};
