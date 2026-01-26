'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { InvoiceRepository, type Invoice, type InvoiceStatus } from "@/lib/repositories/FinanceRepository"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const data = await InvoiceRepository.list()
        setInvoices(data)
        setLoading(false)
    }

    const statusColors: Record<InvoiceStatus, "info" | "success" | "warning" | "danger" | "default" | "secondary"> = {
        draft: "secondary",
        unpaid: "warning",
        paid: "success",
        overdue: "danger",
        void: "default"
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Invoices</h1>
                    <p className="text-slate-500">Manage billing and payments.</p>
                </div>
                <Link href="/dashboard/invoices/new">
                    <Button className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Create Invoice
                    </Button>
                </Link>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Invoice #</th>
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Due Date</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading invoices...</td>
                                </tr>
                            ) : invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/invoices/${invoice.id}`} className="font-bold text-primary hover:text-blue-600 hover:underline">
                                            {invoice.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {invoice.customer_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {invoice.issue_date}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {invoice.due_date}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        ${invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={statusColors[invoice.status]}>
                                            {invoice.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
