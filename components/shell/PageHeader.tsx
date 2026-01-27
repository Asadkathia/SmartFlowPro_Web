import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
    title: string
    subtitle?: string
    actions?: React.ReactNode
    tabs?: React.ReactNode
    className?: string
}

export function PageHeader({ title, subtitle, actions, tabs, className }: PageHeaderProps) {
    return (
        <div className={cn("border-b border-slate-200 bg-white", className)}>
            <div className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-sm text-slate-600">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
            {tabs && (
                <div className="px-6">
                    {tabs}
                </div>
            )}
        </div>
    )
}
