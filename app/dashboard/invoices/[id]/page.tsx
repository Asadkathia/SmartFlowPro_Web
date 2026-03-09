'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function InvoiceDetailPage() {
    const params = useParams<{ id: string }>()
    const [invoice, setInvoice] = useState<any | undefined>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        InvoiceRepository.getById(params.id).then(data => {
            if (data) {
                const customer = data.visit?.job?.customer
                const property = customer?.properties?.[0]
                const mapped = {
                    ...data,
                    customer_name: customer?.name || 'Unknown',
                    customer_email: customer?.email || '',
                    customer_address: property ? `${property.address}, ${property.city || ''}` : '',
                    issue_date: new Date(data.created_at).toLocaleDateString(),
                    due_date: data.due_date ? new Date(data.due_date).toLocaleDateString() : 'Upon Receipt',
                    // Use items from relation or mock if empty for UI testing
                    items: data.items && data.items.length > 0 ? data.items : [],
                    subtotal: data.items?.reduce((acc: number, item: any) => acc + (item.total || 0), 0) || data.total || 0,
                    tax: 0, // Calculate or fetch if available
                }
                setInvoice(mapped)
            }
            setLoading(false)
        })
    }, [params.id])

    if (loading) return <div className="p-12 text-center text-slate-500">Loading invoice...</div>
    if (!invoice) return <div className="p-12 text-center text-red-500">Invoice not found</div>

    const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
        draft: "secondary",
        unpaid: "warning",
        paid: "success",
        overdue: "danger",
        void: "default"
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Link href="/dashboard/invoices" className="hover:text-primary hover:underline">Invoices</Link>
                        <span>/</span>
                        <span>{invoice.invoice_number}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Invoice {invoice.invoice_number}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Download PDF</Button>
                    <Button variant="outline">Send Email</Button>
                    {invoice.status === 'unpaid' && (
                        <Button className="bg-green-600 hover:bg-green-700">Record Payment</Button>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-8 md:p-12 print:p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-primary mb-1">SmartFlowPro</h2>
                            <p className="text-slate-500 text-sm">
                                123 Service Road<br />
                                Tech City, TC 90210<br />
                                support@smartflow.com
                            </p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">INVOICE</h3>
                            <p className="text-slate-500 text-sm mb-4">#{invoice.invoice_number}</p>
                            <Badge variant={statusColors[invoice.status] || "default"} className="text-sm px-3 py-1 uppercase">
                                {invoice.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h4>
                            <p className="font-bold text-slate-900">{invoice.customer_name}</p>
                            <p className="text-slate-600 text-sm">{invoice.customer_address}</p>
                            <p className="text-slate-600 text-sm mt-1">{invoice.customer_email}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-4">Issue Date:</span>
                                <span className="font-medium text-slate-900">{invoice.issue_date}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-4">Due Date:</span>
                                <span className="font-medium text-slate-900">{invoice.due_date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm text-left mb-12">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Description</th>
                                <th className="px-4 py-3 text-right">Qty</th>
                                <th className="px-4 py-3 text-right">Unit Price</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No line items</td>
                                </tr>
                            ) : (
                                invoice.items.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td className="px-4 py-4 font-medium text-slate-900">{item.description || 'Item'}</td>
                                        <td className="px-4 py-4 text-right text-slate-600">{item.qty || 1}</td>
                                        <td className="px-4 py-4 text-right text-slate-600">${(item.unit_price || 0).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-slate-900 font-bold">${(item.total || 0).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="text-slate-900 font-bold">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Tax</span>
                                <span className="text-slate-900 font-bold">${invoice.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg pt-3 border-t border-slate-200">
                                <span className="text-primary font-bold">Total</span>
                                <span className="text-primary font-bold">${invoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
