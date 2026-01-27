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
    Droplet,
    LucideIcon
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
    name: string
    href: string
    icon: LucideIcon
}

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
    { name: "Customers", href: "/dashboard/customers", icon: UserCircle },
    { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
    { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function SidebarRail() {
    const pathname = usePathname()

    return (
        <aside className="w-14 bg-surface border-r border-slate-200 flex flex-col items-center py-4 fixed inset-y-0 left-0 z-50">
            {/* Logo */}
            <Link
                href="/dashboard"
                className="mb-6 flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
                <Droplet className="w-5 h-5" />
            </Link>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1 w-full px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                            )}
                            title={item.name}
                        >
                            <Icon className="w-5 h-5" />

                            {/* Tooltip */}
                            <span className={cn(
                                "absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-50",
                                "group-hover:opacity-100"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Avatar */}
            <div className="mt-auto pt-4 border-t border-slate-200 w-full px-2">
                <button
                    className="w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center group relative"
                    title="Account"
                >
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                            AM
                        </AvatarFallback>
                    </Avatar>

                    {/* Tooltip */}
                    <span className={cn(
                        "absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-50",
                        "group-hover:opacity-100"
                    )}>
                        Account
                    </span>
                </button>
            </div>
        </aside>
    )
}
