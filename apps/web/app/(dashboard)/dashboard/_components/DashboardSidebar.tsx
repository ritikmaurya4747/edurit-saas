import AdminIcon from "@repo/ui/icons/AdminIcon";
import ArrowLeftIcon from "@repo/ui/icons/ArrowLeftIcon";
import ArrowRightIcon from "@repo/ui/icons/ArrowRightIcon";
import ChevronRightIcon from "@repo/ui/icons/ChevronRightIcon";
import CommentsIcon from "@repo/ui/icons/CommentsIcon";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarData } from "../../../../config/sidebarData";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

const DashboardSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: DashboardSidebarProps) => {
  const pathname = usePathname();
  return (
    <div className="hidden lg:flex fixed top-0 left-0 h-full text-white z-50  transition-opacity duration-300 translate-x-0 ">
      <div className="flex flex-col gap-8 h-full w-60 py-6">
        {/* Logo */}
        <div
          className={`${
            isSidebarOpen ? "flex justify-center" : "items-start px-5"
          }`}
        >
          <Link href="/">
            <Image
              src="/assets/svg/logo_showoff.svg"
              alt="logo"
              width={100}
              height={40}
              className={`object-cover ${
                isSidebarOpen ? "h-12 w-12" : "h-8 w-8"
              }`}
            />
          </Link>
        </div>

        <div
          className={`flex flex-col gap-3 mt-5 ${
            isSidebarOpen ? "px-14" : "px-5"
          }`}
        >
          {sidebarData.map((item, index) => {
            const isActive = pathname === item.url;
            return (
              <div key={index} className="relative group">
                <Link
                  href={item.url || "#"}
                  className="w-8 h-8 flex items-center"
                >
                  <div
                    className={`flex items-center  justify-center ${
                      isSidebarOpen ? "gap-5" : "gap-2"
                    } ${isActive ? "text-white" : "text-[#5e91a2]"}`}
                  >
                    {item.icon}
                    {isSidebarOpen && (
                      <p className="text-white text-sm whitespace-nowrap">
                        {item.label}
                      </p>
                    )}

                    {item.arrow && (
                      <ChevronRightIcon className="w-5 h-5 text-[#5e91a2] cursor-auto" />
                    )}
                  </div>
                </Link>
                {/* Submenu on Hover */}
                {item.arrow && item.submenu && (
                  <div
                    className={`absolute z-50 ${
                      isSidebarOpen ? "left-36" : "left-15"
                    } top-1/2 -translate-y-1/2 bg-primary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-32 w-max before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-r-primary ${
                      item.icon?.type?.name === "PocketIcon"
                        ? "grid grid-cols-2 overflow-hidden rounded-lg"
                        : ""
                    }`}
                  >
                    {item.submenu.map((sub, i) => (
                      <Link
                        key={i}
                        href={sub.url}
                        className={`block px-4 py-3 text-sm text-white whitespace-nowrap text-start ${
                          item.icon?.type?.name === "PocketIcon"
                            ? "border border-slate-500 first:rounded-tl-lg last:rounded-br-lg"
                            : i !== item.submenu.length - 1
                            ? "border-b border-slate-500"
                            : ""
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons / Link  */}
        <div
          className={`py-2 flex flex-col items-center mt-10 ${
            isSidebarOpen ? "" : "items-start px-3"
          }`}
        >
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-3 w-full">
              {/* <Link
                                href="#"
                                className={`flex items-center justify-center gap-2 ${isSidebarOpen ? 'px-6 py-4' : 'p-3'} bg-[#00a986] rounded-full text-white font-semibold transition-all duration-300 hover:scale-105`}
                            >
                                <HelpIcon className="w-5 h-5" />
                                {isSidebarOpen && <span className="text-sm">Get Help</span>}
                            </Link> */}

              <Link
                href="/feedback"
                className={`flex items-center justify-center gap-2 ${
                  isSidebarOpen ? "px-5 py-4" : "p-3"
                } bg-[#00a986] rounded-full text-white font-semibold transition-all duration-300 hover:scale-105`}
              >
                <CommentsIcon className="w-5 h-5" />
                {isSidebarOpen && <span className="text-sm">Feedback</span>}
              </Link>
            </div>
          </div>
          {/* Admin popup */}
          <div className="relative group">
            <div className="flex justify-center gap-1 items-center mt-5">
              <div className="bg-gray-100  rounded-full cursor-pointer w-10 h-10 flex items-center justify-center">
                <AdminIcon className="text-gray-400 w-5 h-5 " />
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400 " />
            </div>
            {/* Hover menu with arrow */}
            <div
              className={`absolute ${
                isSidebarOpen ? "left-24" : "left-18 z-50"
              } -mt-20 w-24  shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 before:content-[''] before:absolute before:right-full before:top-12 before:border-8 before:border-transparent before:border-r-slate-700`}
            >
              <button className="w-full text-left px-4 py-3 bg-slate-700 text-white rounded-t-lg flex items-center gap-2 mb-0.5 rounded-b-none">
                <span className="text-xs">Edit Profile</span>
              </button>
              <button
                // onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-3 bg-slate-700 text-white rounded-b-lg flex items-center gap-2 rounded-t-none"
              >
                <span className="text-xs">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute ${
          isSidebarOpen ? "left-60" : "left-20"
        } bottom-32 bg-white text-black rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-200`}
      >
        {isSidebarOpen ? (
          <ArrowLeftIcon className="w-4 h-4" />
        ) : (
          <ArrowRightIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default DashboardSidebar;
