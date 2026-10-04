"use client";
import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import MobileSidebar from "./MobileSidebar";
interface DashboardLayoutProps {
  children: React.ReactNode;
}
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className="lg:bg-[#16233F]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`transition-[width] duration-300 ease-in-out w-0 ${isSidebarOpen ? "lg:w-60" : "lg:w-20"}`}>
          <DashboardSidebar isSidebarOpen={isSidebarOpen} />
          <MobileSidebar />
        </div>

        {/* Main content / Header */}
        <div className="flex flex-1 flex-col bg-white w-full text-black">
          <div className="hidden lg:block">
            <DashboardHeader
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>
          <main className="flex-1 overflow-y-auto bg-[#F5F4EF] px-5 lg:p-6 max-sm:py-20 text-primary">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
