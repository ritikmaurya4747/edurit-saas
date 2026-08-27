import {
  AlertIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardIcon,
  CreditCardIcon,
  DashboardIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
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
        url: "/dashboard/timetable",
      },
      {
        icon: <BookOpenIcon className="w-6 h-6" />,
        label: "Homework",
        url: "/dashboard/homework",
      },
      {
        icon: <AwardIcon className="w-6 h-6" />,
        label: "Report Cards",
        url: "/dashboard/report-cards",
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        icon: <UserCheckIcon className="w-6 h-6" />,
        label: "Attendance",
        url: "/dashboard/attendance",
      },
      {
        icon: <UserPlusIcon className="w-6 h-6" />,
        label: "Admissions",
        url: "/dashboard/admissions",
      },
      {
        icon: <CreditCardIcon className="w-6 h-6" />,
        label: "Fee Management",
        url: "/dashboard/fee-management",
      },
      {
        icon: <ClipboardIcon className="w-6 h-6" />,
        label: "Desk Slips",
        url: "/dashboard/desk-slips",
      },
    ],
  },
  {
    section: "Staff & HR",
    items: [
      {
        icon: <UsersIcon className="w-6 h-6" />,
        label: "Staff & HR",
        url: "/dashboard/staff-hr",
      },
    ],
  },
  {
    section: "Engagement",
    items: [
      {
        icon: <AlertIcon className="w-6 h-6" />,
        label: "Notices",
        url: "/dashboard/notices",
      },
    ],
  },
];