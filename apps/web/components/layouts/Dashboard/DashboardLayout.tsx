'use client'
import React, { useState } from 'react'
import DashboardHeader from './DashboardHeader'
import DashboardSidebar from './DashboardSidebar'
import MobileHeader from './MobileHeader'
interface DashboardLayoutProps {
    children: React.ReactNode
}
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    return (
        <div className='lg:bg-[#16233F]'>
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:w-60' : 'lg:w-20'} w-0`}>
                    <DashboardSidebar
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />
                    <MobileHeader />
                </div>

                {/* Main content / Header */}
                <div className="flex flex-1 flex-col bg-white w-full [80px] text-black">
                    <DashboardHeader />
                    <main className='flex-1  bg-[#F5F4EF] px-5 lg:p-6 max-sm:py-20 text-primary'>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default DashboardLayout