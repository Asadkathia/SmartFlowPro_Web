'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"

export default function CreateInvoicePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [customers, setCustomers] = useState<CustomerWithProperties[]>([])

    // Simple state for V1
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [amount, setAmount] = useState("")
    const [dueDate, setDueDate] = useState("")

    useEffect(() => {
        CustomerRepository.list().then(result => setCustomers(result.data))
    }, [])

    async function handleCreate() {
        if (!amount || !selectedCustomerId) return
        setSaving(true)
        try {
            // TODO: Implement actual invoice creation which requires a Visit or Quote
            alert("Invoice creation requires a Visit. This feature is under construction.")
            // await InvoiceRepository.create(...)
        } catch (error) {
            console.error(error)
        }
        setSaving(false)
        // router.push('/dashboard/invoices')
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/invoices" className="hover:text-primary hover:underline">Invoices</Link>
                <span>/</span>
                <span>New Invoice</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Create New Invoice</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Customer</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                        >
                            <option value="">Select a Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount ($)</label>
                            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!amount || !selectedCustomerId || saving}>
                            {saving ? 'Creating...' : 'Create Invoice'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
