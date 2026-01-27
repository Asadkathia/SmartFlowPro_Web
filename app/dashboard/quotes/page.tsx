'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { QuoteRepository, type Quote, type QuoteStatus } from "@/lib/repositories/quote-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, FileText, Calendar, DollarSign, User } from "lucide-react"
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

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await QuoteRepository.list()
            setQuotes(data)
        } catch (error) {
            console.error("Failed to load quotes", error)
        } finally {
            setLoading(false)
        }
    }

    // Access nested customer name safely
    const getCustomerName = (quote: any) => quote.visit?.job?.customer?.name || "Unknown Client"

    const filteredQuotes = quotes.filter(q =>
        q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
        getCustomerName(q).toLowerCase().includes(search.toLowerCase())
    )

    const handleRowClick = (quote: any) => {
        setSelectedQuote(quote)
        setIsDrawerOpen(true)
    }

    const statusColors: Record<string, "default" | "secondary" | "success" | "outline"> = {
        draft: "secondary",
        finalized: "default",
        invoiced: "success",
        sent: "outline", // Mapping extra statuses just in case
        accepted: "success"
    }

    const columns = [
        {
            key: "number",
            header: "Quote #",
            render: (quote: any) => (
                <span className="font-bold text-primary hover:underline">
                    {quote.quote_number}
                </span>
            )
        },
        {
            key: "client",
            header: "Client",
            render: (quote: any) => (
                <span className="font-medium text-slate-900">
                    {getCustomerName(quote)}
                </span>
            )
        },
        {
            key: "date",
            header: "Date",
            render: (quote: any) => (
                <span className="text-slate-600 text-sm">
                    {new Date(quote.created_at).toLocaleDateString()}
                </span>
            )
        },
        {
            key: "total",
            header: "Total",
            render: (quote: any) => (
                <span className="font-bold text-slate-900">
                    ${(quote.grand_total || 0).toLocaleString()}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (quote: any) => (
                <Badge variant={statusColors[quote.status] || "secondary"}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Quotes"
                subtitle="Track estimates and proposals."
                actions={
                    <Link href="/dashboard/quotes/new">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Quote
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
                data={filteredQuotes}
                loading={loading}
                getRowKey={(quote) => quote.id}
                onRowClick={handleRowClick}
                rowActions={() => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={FileText}
                        title="No quotes found"
                        description={search ? "Try adjusting your search" : "Create your first quote to get started"}
                        action={!search ? {
                            label: "New Quote",
                            onClick: () => window.location.href = "/dashboard/quotes/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Quote Details</DrawerTitle>
                        <DrawerDescription>
                            {selectedQuote?.quote_number}
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedQuote && (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-500">Total Value</span>
                                        <span className="text-2xl font-bold text-slate-900">
                                            ${(selectedQuote.grand_total || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <Badge variant={statusColors[selectedQuote.status] || "secondary"} className="text-sm px-3 py-1">
                                        {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
                                    </Badge>
                                </div>

                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        Client
                                    </h4>
                                    <div className="bg-slate-50 p-3 rounded-md">
                                        <p className="font-medium text-slate-900">{getCustomerName(selectedQuote)}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Job: {selectedQuote.visit?.job?.job_number || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Quote Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-slate-500" />
                                        Breakdown
                                    </h4>
                                    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Subtotal</span>
                                            <span className="font-medium">${(selectedQuote.subtotal || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Tax</span>
                                            <span className="font-medium">${(selectedQuote.tax_total || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Discount</span>
                                            <span className="font-medium text-red-600">-${(selectedQuote.discount_total || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                                            <span>Total</span>
                                            <span>${(selectedQuote.grand_total || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        Dates
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-xs text-slate-500 block">Created</span>
                                            <span className="text-sm font-medium">
                                                {new Date(selectedQuote.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-md">
                                            <span className="text-xs text-slate-500 block">Updated</span>
                                            <span className="text-sm font-medium">
                                                {new Date(selectedQuote.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <Link href={`/dashboard/quotes/${selectedQuote?.id}`} className="w-full">
                            <Button className="w-full">View Full Quote</Button>
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

