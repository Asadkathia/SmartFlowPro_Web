'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Bell, HelpCircle } from "lucide-react"

export function Header() {
    return (
        <header className="h-16 border-b border-slate-200 bg-surface flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Search */}
            <div className="flex-1 max-w-md hidden md:block relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-5 h-5" />
                </span>
                <Input
                    className="pl-10 bg-slate-50 border-none focus-visible:ring-primary/20"
                    placeholder="Search jobs, customers, invoices..."
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
                <Button variant="ghost" size="icon" className="text-text-secondary relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-text-secondary">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </div>
        </header>
    )
}
