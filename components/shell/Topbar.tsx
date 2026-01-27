'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Bell, HelpCircle, ChevronDown, Users, FileText, Hammer, Receipt } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export function Topbar() {
    return (
        <header className="h-14 border-b border-slate-200 bg-surface flex items-center justify-between px-6 shrink-0">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-4 h-4" />
                </span>
                <Input
                    className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 text-sm"
                    placeholder="Search..."
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-4">
                {/* Create Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                            <Plus className="w-4 h-4" />
                            Create
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[400px] p-2">
                        <div className="grid grid-cols-4 gap-2">
                            <Link href="/dashboard/customers/new" className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition-colors gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-200 transition-all">
                                    <Users className="w-5 h-5 text-slate-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Client</span>
                            </Link>

                            <Link href="/dashboard/quotes/new" className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-rose-50 transition-colors gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-rose-200 transition-all">
                                    <FileText className="w-5 h-5 text-rose-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Quote</span>
                            </Link>

                            <Link href="/dashboard/jobs/new" className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-emerald-50 transition-colors gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-emerald-200 transition-all">
                                    <Hammer className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Job</span>
                            </Link>

                            <Link href="/dashboard/invoices/new" className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition-colors gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-blue-200 transition-all">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Invoice</span>
                            </Link>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="text-slate-600 relative h-9 w-9">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </Button>

                {/* Help */}
                <Button variant="ghost" size="icon" className="text-slate-600 h-9 w-9">
                    <HelpCircle className="w-4 h-4" />
                </Button>
            </div>
        </header>
    )
}
