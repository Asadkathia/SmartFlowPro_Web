'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerRepository } from "@/lib/repositories/customer-repository"

export default function CreateCustomerPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")

    async function handleCreate() {
        if (!name || !email) return
        setSaving(true)
        await CustomerRepository.create({
            name,
            email,
            phone
        })
        setSaving(false)
        router.push('/dashboard/customers')
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/customers" className="hover:text-primary hover:underline">Customers</Link>
                <span>/</span>
                <span>New Client</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Add New Customer</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Customer Name</label>
                        <Input placeholder="Business or Person Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!name || !email || saving}>
                            {saving ? 'Saving...' : 'Create Customer'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
