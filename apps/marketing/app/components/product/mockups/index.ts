import type { ComponentType } from "react";
import { AttendanceMock } from "./AttendanceMock";
import { GradebookMock } from "./GradebookMock";
import { FeesMock } from "./FeesMock";
import { MessagesMock } from "./MessagesMock";
import { TimetableMock } from "./TimetableMock";
import { AnalyticsMock } from "./AnalyticsMock";

import { DashboardMock } from "./DashboardMock";
export { DashboardMock };
export { AppWindow, Pill, Avatar } from "./AppWindow";
export { AttendanceMock, GradebookMock, FeesMock, MessagesMock, TimetableMock, AnalyticsMock };

/** Maps feature ids (in src/data/features.ts) to the product screen that illustrates them. */
export const mockById: Record<string, ComponentType> = {
  academics: GradebookMock,
  attendance: AttendanceMock,
  fees: FeesMock,
  communication: MessagesMock,
  administration: TimetableMock,
  "smarter-academics": GradebookMock,
  "attendance-paperwork": AttendanceMock,
  "parents-connected": MessagesMock,
  "simplify-fees": FeesMock,
  "data-decisions": AnalyticsMock,
};
