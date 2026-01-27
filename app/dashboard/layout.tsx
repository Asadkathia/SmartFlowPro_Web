import { AppShell } from "@/components/shell/AppShell"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AppShell>
            <div className="p-6 max-w-[1600px] mx-auto">
                {children}
            </div>
        </AppShell>
    )
}

