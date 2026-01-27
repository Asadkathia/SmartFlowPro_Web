'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    UserCircle,
    Briefcase,
    Calendar,
    FileText,
    Receipt,
    Package,
    Settings,
    Droplet
} from "lucide-react"

interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Customers", href: "/dashboard/customers", icon: UserCircle },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
    { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
    { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-surface border-r border-slate-200 hidden md:flex flex-col h-screen fixed inset-y-0 left-0 z-50">
            {/* Logo */}
            <div className="p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Droplet className="w-5 h-5" />
                        SmartFlowPro
                    </h1>
                    <p className="text-text-secondary text-xs font-medium px-8">Web Admin</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto w-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-secondary hover:bg-slate-100 hover:text-primary"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-primary" : "group-hover:text-primary"
                            )} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200 mt-auto">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {/* Placeholder for now */}
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
                            AM
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate">Alex Morgan</span>
                        <span className="text-xs text-text-secondary truncate">Admin</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
