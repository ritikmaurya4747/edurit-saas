import {
  CalendarIcon,
  DashboardIcon,
  UserCheckIcon,
  UserPlusIcon,
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
    section: "Platform Management",
    items: [
      {
        icon: <UserCheckIcon className="w-6 h-6" />,
        label: "All Schools", 
        url: "/dashboard/tenants",
      },
      {
        icon: <UserPlusIcon className="w-6 h-6" />,
        label: "Add New School", 
        url: "/dashboard/tenants-create",
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        icon: <CalendarIcon className="w-6 h-6" />,
        label: "Audit Logs",
        url: "/dashboard/logs",
      },
    ],
  },
];