import BuildingIcon from "@repo/ui/icons/BuildingIcon";
import DocumentIcon from "@repo/ui/icons/DocumentIcon";
import GalleryIcon from "@repo/ui/icons/GalleryIcon";
import HomeIcon from "@repo/ui/icons/HomeIcon";
import PocketIcon from "@repo/ui/icons/PocketIcon ";
import RecycleIcon from "@repo/ui/icons/RecycleIcon";
import SettingsIcon from "@repo/ui/icons/SettingsIcon";
import ShoppingBagIcon from "@repo/ui/icons/ShoppingBagIcon";
import TrendingUpIcon from "@repo/ui/icons/TrendingUpIcon";
import UserIcon from "@repo/ui/icons/UserIcon";

export const sidebarData = [
  {
    icon: <HomeIcon />,
    label: "Dashboard", url: "/#"
  },
  {
    icon: <BuildingIcon />,
    label: "Timetable",
    url: "/#",
  },
  {
    icon: <DocumentIcon />,
    label: "Homework",
    url: "/#"
  },
  {
    icon: <RecycleIcon />,
    label: "Report Cards",
    url: "/admin-dashboard/panels"
  },
  {
    icon: <ShoppingBagIcon />,
    label: "Desk Slips",
    url: "/admin-dashboard/cbLibraries/libraries/index",
  },
  {
    icon: <PocketIcon />,
    label: "Admissions",
    url: "/#",
  },
  {
    icon: <TrendingUpIcon />,
    label: "Fee Management",
    url: "/#",
  },
  {
    icon: <GalleryIcon />,
    label: "Media Manager",
    url: "/#",
  },
  {
    icon: <UserIcon />,
    label: "Approvals (0)",
    url: "/#",
  },
  {
    icon: <SettingsIcon />,
    label: "Attendance",
    url: "/#",
  },
];
