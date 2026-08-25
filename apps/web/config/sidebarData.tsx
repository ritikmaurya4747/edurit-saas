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
  { icon: <HomeIcon />, label: "Dashboard", url: "/admin-dashboard" },
  {
    icon: <BuildingIcon />,
    label: "Menus",
    url: "/admin-dashboard/menu",
    arrow: true,
    submenu: [
      { label: "Main Menu", url: "/admin-dashboard/menu/editor/menuID/7" },
      { label: "Footer Menu", url: "/admin-dashboard/menu/editor/menuID/8" },
      { label: "EZone", url: "/admin-dashboard/menu/editor/menuID/9" },
    ],
  },
  { icon: <DocumentIcon />, label: "Pages", url: "/admin-dashboard/pages" },
  { icon: <RecycleIcon />, label: "Panels", url: "/admin-dashboard/panels" },
  {
    icon: <ShoppingBagIcon />,
    label: "Libraries",
    url: "/admin-dashboard/cbLibraries/libraries/index",
    arrow: true,
  },
  {
    icon: <PocketIcon />,
    label: "Modules",
    arrow: true,
    submenu: [
      {
        label: "Galleries",
        url: "/admin-dashboard/module/cbLibraries/gallery/index",
      },
      { label: "Forms", url: "/admin-dashboard/module/forms/index" },
      { label: "Seminars", url: "/admin-dashboard/module/seminar/index" },
      { label: "Speakers", url: "/admin-dashboard/module/speaker/index" },
      {
        label: "Compagion Tracker",
        url: "/admin-dashboard/module/campaigntracker/campaign/index",
      },
      { label: "Exibitors", url: "/admin-dashboard/module/exhibitor/index" },
      { label: "Goals", url: "/admin-dashboard/module/goal/index" },
    ],
  },
  {
    icon: <TrendingUpIcon />,
    label: "Reports",
    arrow: true,
    submenu: [
      {
        label: "Pingdom",
        url: "/admin-dashboard/reports/cbGoogleAnalytics/pingdom/index",
      },
      {
        label: "Scheduled Reports",
        url: "/admin-dashboard/scheduledreports/index",
      },
      { label: "Insights", url: "/admin-dashboard/insights" },
    ],
  },
  {
    icon: <GalleryIcon />,
    label: "Media Manager",
    url: "/admin-dashboard/mediamanager",
  },
  {
    icon: <UserIcon />,
    label: "Approvals (0)",
    arrow: true,
    submenu: [
      { label: "Content Moderation", url: "/admin-dashboard/approvals" },
      { label: "Rapports Moderation", url: "/admin-dashboard/rapports" },
    ],
  },
  {
    icon: <SettingsIcon />,
    label: "Settings",
    url: "/admin-dashboard/panels",
    arrow: true,
    submenu: [
      {
        label: "Design and Appearance",
        url: "/admin-dashboard/site/layoutSettings",
      },
      { label: "Site Settings", url: "/admin-dashboard/settings" },
      { label: "SEO Settings", url: "/admin-dashboard/settings/seoSettings" },
      {
        label: "Exhibitor Zone Settings",
        url: "/admin-dashboard/event/view_ezone",
      },
      {
        label: "Language and Translations",
        url: "/admin-dashboard/system/translate/siteTranslate",
      },
      { label: "Categories", url: "/admin-dashboard/category" },
      {
        label: "Event Settings",
        url: "/admin-dashboard/settings/eventSettings",
      },
      {
        label: "Inspired Motive Settings",
        url: "/admin-dashboard/system/translate",
      },
    ],
  },
];
