'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { CustomerRepository, type Customer } from "@/lib/repositories/CustomerRepository"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await CustomerRepository.list()
            setCustomers(data)
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Customers</h1>
                    <p className="text-slate-500">Manage your client base and properties.</p>
                </div>
                <Link href="/dashboard/customers/new">
                    <Button className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Customer
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <Input
                        placeholder="Search customers..."
                        className="pl-10 border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Contact</th>
                                <th className="px-6 py-3 font-medium">Properties</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/customers/${customer.id}`} className="font-bold text-primary hover:text-blue-600 hover:underline">
                                            {customer.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="material-symbols-outlined text-[16px]">mail</span>
                                                {customer.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="material-symbols-outlined text-[16px]">call</span>
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary">{customer.properties.length} Properties</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                                            {customer.status}
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
