import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FilterBarProps {
    searchPlaceholder?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    filters?: React.ReactNode
    rightActions?: React.ReactNode
    className?: string
}

export function FilterBar({
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    filters,
    rightActions,
    className
}: FilterBarProps) {
    return (
        <div className={cn(
            "bg-white border-b border-slate-200 px-6 py-3",
            className
        )}>
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="pl-9 h-9 bg-slate-50 border-slate-200"
                    />
                </div>

                {/* Filters */}
                {filters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {filters}
                    </div>
                )}

                {/* Right Actions */}
                {rightActions && (
                    <div className="flex items-center gap-2 ml-auto">
                        {rightActions}
                    </div>
                )}
            </div>
        </div>
    )
}
