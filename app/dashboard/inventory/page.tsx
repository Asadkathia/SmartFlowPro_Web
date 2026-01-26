'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { InventoryRepository, type InventoryItem } from "@/lib/repositories/InventoryRepository"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const data = await InventoryRepository.list()
        setItems(data)
        setLoading(false)
    }

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Inventory</h1>
                    <p className="text-slate-500">Track parts and materials.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Import CSV</Button>
                    <Link href="/dashboard/inventory/new">
                        <Button className="gap-2">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Item
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <Input
                        placeholder="Search items by name or SKU..."
                        className="pl-10 border-none bg-slate-50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Filter by Category</Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Item Name</th>
                                <th className="px-6 py-3 font-medium">SKU</th>
                                <th className="px-6 py-3 font-medium">Category</th>
                                <th className="px-6 py-3 font-medium text-right">Qty on Hand</th>
                                <th className="px-6 py-3 font-medium text-right">Price</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading inventory...</td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {item.sku}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {item.quantity} <span className="text-slate-400 text-xs font-normal">{item.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                        ${item.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                                            <span className="material-symbols-outlined">edit</span>
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
