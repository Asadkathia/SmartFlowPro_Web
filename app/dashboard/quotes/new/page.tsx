'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuoteRepository } from "@/lib/repositories/quote-repository"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"

export default function CreateQuotePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [customers, setCustomers] = useState<CustomerWithProperties[]>([])

    const [title, setTitle] = useState("")
    const [value, setValue] = useState("")
    const [expiry, setExpiry] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState("")

    useEffect(() => {
        CustomerRepository.list().then(result => setCustomers(result.data))
    }, [])

    async function handleCreate() {
        if (!title || !value || !selectedCustomerId) return
        setSaving(true)
        try {
            // TODO: Implement actual quote creation which requires a Visit
            alert("Quote creation requires a Visit. This feature is under construction.")
            // await QuoteRepository.create(...)
        } catch (error) {
            console.error(error)
        }
        setSaving(false)
        // router.push('/dashboard/quotes')
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/quotes" className="hover:text-primary hover:underline">Quotes</Link>
                <span>/</span>
                <span>New Quote</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Create New Quote</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Quote Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input placeholder="e.g. Full System Replacement" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
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
                            <label className="text-sm font-medium">Value ($)</label>
                            <Input type="number" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Expiry Date</label>
                            <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!title || !value || !selectedCustomerId || saving}>
                            {saving ? 'Creating...' : 'Create Quote'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
