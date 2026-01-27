'use client'

import { SidebarRail } from './SidebarRail'
import { Topbar } from './Topbar'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar Rail */}
            <SidebarRail />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden ml-14">
                <Topbar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
