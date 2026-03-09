'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryRepository } from "@/lib/repositories/inventory-repository"

export default function AddInventoryPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [category, setCategory] = useState("")
    const [quantity, setQuantity] = useState("")
    const [price, setPrice] = useState("")
    const [unit, setUnit] = useState("ea")

    async function handleCreate() {
        if (!name || !sku) return
        setSaving(true)
        await InventoryRepository.create({
            name,
            sku,
            category: category || 'General',
            sale_price: parseFloat(price) || 0,
            unit
        })
        setSaving(false)
        router.push('/dashboard/inventory')
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/inventory" className="hover:text-primary hover:underline">Inventory</Link>
                <span>/</span>
                <span>Add Item</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Add Inventory Item</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Item Name</label>
                        <Input placeholder="Part Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SKU</label>
                            <Input placeholder="Stock Keeping Unit" value={sku} onChange={e => setSku(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Input placeholder="e.g. HVAC, Plumbing" value={category} onChange={e => setCategory(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input type="number" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unit</label>
                            <Input placeholder="ea, ft, box" value={unit} onChange={e => setUnit(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price ($)</label>
                            <Input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!name || !sku || saving}>
                            {saving ? 'Adding...' : 'Add Item'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
