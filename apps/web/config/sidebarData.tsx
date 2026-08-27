import BuildingIcon from "@repo/ui/icons/BuildingIcon";
import DashboardIcon from "@repo/ui/icons/DashboardIcon";
import DocumentIcon from "@repo/ui/icons/DocumentIcon";
import PocketIcon from "@repo/ui/icons/PocketIcon ";
import RecycleIcon from "@repo/ui/icons/RecycleIcon";
import SettingsIcon from "@repo/ui/icons/SettingsIcon";
import ShoppingBagIcon from "@repo/ui/icons/ShoppingBagIcon";
import TrendingUpIcon from "@repo/ui/icons/TrendingUpIcon";

export const sidebarData = [
  {
    icon: <DashboardIcon className="w-6 h-6" />,
    label: "Dashboard", url: "/dashboard"
  },
  {
    icon: <BuildingIcon className="w-6 h-6" />,
    label: "Timetable",
    url: "/dashboard/timetable",
  },
  {
    icon: <DocumentIcon className="w-6 h-6" />,
    label: "Homework",
    url: "/dashboard/homework"
  },
  {
    icon: <RecycleIcon className="w-6 h-6" />,
    label: "Report Cards",
    url: "/dashboard/report-cards"
  },
  {
    icon: <ShoppingBagIcon className="w-6 h-6" />,
    label: "Desk Slips",
    url: "/dashboard/desk-slips",
  },
  {
    icon: <PocketIcon className="w-6 h-6" />,
    label: "Admissions",
    url: "/dashboard/admissions",
  },
  {
    icon: <TrendingUpIcon className="w-6 h-6" />,
    label: "Fee Management",
    url: "/dashboard/fee-management",
  },
  {
    icon: <SettingsIcon className="w-6 h-6"/>,
    label: "Attendance",
    url: "/dashboard/attendance",
  },
];
