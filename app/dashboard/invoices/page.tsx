'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { InvoiceRepository, type Invoice, type InvoiceStatus } from "@/lib/repositories/invoice-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, FileText, Calendar, DollarSign, User, AlertCircle, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/shell/PageHeader"
import { FilterBar } from "@/components/shell/FilterBar"
import { DataTable } from "@/components/tables/DataTable"
import { EmptyState } from "@/components/feedback/EmptyState"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
    DrawerClose
} from "@/components/overlay/Drawer"

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await InvoiceRepository.list()
            setInvoices(data)
        } catch (error) {
            console.error("Failed to load invoices", error)
        } finally {
            setLoading(false)
        }
    }

    // Access nested customer name safely
    const getCustomerName = (invoice: any) => invoice.visit?.job?.customer?.name || "Unknown Client"

    const filteredInvoices = invoices.filter(i =>
        i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        getCustomerName(i).toLowerCase().includes(search.toLowerCase())
    )

    const handleRowClick = (invoice: any) => {
        setSelectedInvoice(invoice)
        setIsDrawerOpen(true)
    }

    const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "outline"> = {
        draft: "secondary",
        unpaid: "warning",
        paid: "success",
        overdue: "danger",
        void: "default",
        partially_paid: "warning"
    }

    const columns = [
        {
            key: "number",
            header: "Invoice #",
            render: (invoice: any) => (
                <span className="font-bold text-primary hover:underline">
                    {invoice.invoice_number}
                </span>
            )
        },
        {
            key: "client",
            header: "Client",
            render: (invoice: any) => (
                <span className="font-medium text-slate-900">
                    {getCustomerName(invoice)}
                </span>
            )
        },
        {
            key: "date",
            header: "Issued",
            render: (invoice: any) => (
                <span className="text-slate-600 text-sm">
                    {new Date(invoice.created_at).toLocaleDateString()}
                </span>
            )
        },
        {
            key: "due",
            header: "Due",
            render: (invoice: any) => (
                <span className={invoice.status === 'overdue' ? "text-red-600 font-medium" : "text-slate-600"}>
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "Due on Receipt"}
                </span>
            )
        },
        {
            key: "amount",
            header: "Amount",
            render: (invoice: any) => (
                <span className="font-bold text-slate-900">
                    ${(invoice.total || 0).toFixed(2)}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (invoice: any) => (
                <Badge variant={statusColors[invoice.status] || "secondary"}>
                    {invoice.status.toUpperCase()}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Invoices"
                subtitle="Manage billing and payments."
                actions={
                    <Link href="/dashboard/invoices/new">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Invoice
                        </Button>
                    </Link>
                }
            />

            <FilterBar
                searchPlaceholder="Search by number or client..."
                searchValue={search}
                onSearchChange={setSearch}
            />

            <DataTable
                columns={columns}
                data={filteredInvoices}
                loading={loading}
                getRowKey={(invoice) => invoice.id}
                onRowClick={handleRowClick}
                rowActions={() => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={FileText}
                        title="No invoices found"
                        description={search ? "Try adjusting your search" : "Create your first invoice to get started"}
                        action={!search ? {
                            label: "Create Invoice",
                            onClick: () => window.location.href = "/dashboard/invoices/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Invoice Details</DrawerTitle>
                        <DrawerDescription>
                            {selectedInvoice?.invoice_number}
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedInvoice && (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-500">Total Due</span>
                                        <span className="text-2xl font-bold text-slate-900">
                                            ${(selectedInvoice.total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <Badge variant={statusColors[selectedInvoice.status] || "secondary"} className="text-sm px-3 py-1">
                                        {selectedInvoice.status.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        Client
                                    </h4>
                                    <div className="bg-slate-50 p-3 rounded-md">
                                        <p className="font-medium text-slate-900">{getCustomerName(selectedInvoice)}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Job: {selectedInvoice.visit?.job?.job_number || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Info */}
                                {selectedInvoice.status === 'overdue' && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-md flex gap-2 text-sm items-start">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        This invoice is overdue. Please follow up with the client.
                                    </div>
                                )}
                                {selectedInvoice.status === 'paid' && (
                                    <div className="bg-green-50 text-green-700 p-3 rounded-md flex gap-2 text-sm items-start">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        Paid in full.
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        Timeline
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-xs text-slate-500 block">Issued</span>
                                            <span className="text-sm font-medium">
                                                {new Date(selectedInvoice.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-xs text-slate-500 block">Due Date</span>
                                            <span className="text-sm font-medium">
                                                {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : "Upon Receipt"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <Link href={`/dashboard/invoices/${selectedInvoice?.id}`} className="w-full">
                            <Button className="w-full">View Full Invoice</Button>
                        </Link>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

