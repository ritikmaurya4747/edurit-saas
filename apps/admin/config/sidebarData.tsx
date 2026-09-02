import {
  CalendarIcon,
  DashboardIcon
} from "@repo/ui/icons";

export const sidebarData = [
  {
    section: "Overview",
    items: [
      {
        icon: <DashboardIcon className="w-6 h-6" />,
        label: "Dashboard",
        url: "/dashboard",
      },
    ],
  },
  {
    section: "Academics",
    items: [
      {
        icon: <CalendarIcon className="w-6 h-6" />,
        label: "Timetable",
        url: "/dashboard/",
      },
    ],
  },
];