import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

interface Column<T> {
    key: string
    header: string
    render: (item: T) => React.ReactNode
    className?: string
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    loading?: boolean
    emptyState?: React.ReactNode
    onRowClick?: (item: T) => void
    rowActions?: (item: T) => React.ReactNode
    getRowKey: (item: T) => string
    className?: string
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyState,
    onRowClick,
    rowActions,
    getRowKey,
    className
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                                    >
                                        {column.header}
                                    </th>
                                ))}
                                {rowActions && <th className="w-12"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4">
                                            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                                        </td>
                                    ))}
                                    {rowActions && <td className="px-6 py-4"></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (data.length === 0 && emptyState) {
        return (
            <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
                {emptyState}
            </div>
        )
    }

    return (
        <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider",
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                            {rowActions && <th className="w-12"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item) => (
                            <tr
                                key={getRowKey(item)}
                                className={cn(
                                    "group hover:bg-slate-50 transition-colors",
                                    onRowClick && "cursor-pointer"
                                )}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn("px-6 py-4 text-sm", column.className)}
                                    >
                                        {column.render(item)}
                                    </td>
                                ))}
                                {rowActions && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            {rowActions(item)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
