'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { InventoryRepository, type InventoryItem } from "@/lib/repositories/inventory-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, Package, Tag, Ban, CheckCircle } from "lucide-react"
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

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await InventoryRepository.list()
            setItems(data)
        } catch (error) {
            console.error("Failed to load inventory", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.sku?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )

    const handleRowClick = (item: InventoryItem) => {
        setSelectedItem(item)
        setIsDrawerOpen(true)
    }

    const columns = [
        {
            key: "name",
            header: "Item Name",
            render: (item: InventoryItem) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{item.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{item.sku || "No SKU"}</span>
                </div>
            )
        },
        {
            key: "category",
            header: "Category",
            render: (item: InventoryItem) => (
                <Badge variant="secondary" className="font-normal capitalize">
                    {item.category || "Uncategorized"}
                </Badge>
            )
        },
        {
            key: "price",
            header: "Price",
            render: (item: InventoryItem) => (
                <span className="font-medium text-slate-900">
                    ${item.sale_price.toFixed(2)}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (item: InventoryItem) => item.active ? (
                <Badge variant="success">Active</Badge>
            ) : (
                <Badge variant="secondary">Inactive</Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Inventory"
                subtitle="Track parts and materials."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline">Import CSV</Button>
                        <Link href="/dashboard/inventory/new">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Item
                            </Button>
                        </Link>
                    </div>
                }
            />

            <FilterBar
                searchPlaceholder="Search items by name or SKU..."
                searchValue={search}
                onSearchChange={setSearch}
            />

            <DataTable
                columns={columns}
                data={filteredItems}
                loading={loading}
                getRowKey={(item) => item.id}
                onRowClick={handleRowClick}
                rowActions={() => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={Package}
                        title="No inventory items"
                        description={search ? "Try adjusting your search" : "Add your first item to get started"}
                        action={!search ? {
                            label: "Add Item",
                            onClick: () => window.location.href = "/dashboard/inventory/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Item Details</DrawerTitle>
                        <DrawerDescription>
                            {selectedItem?.sku ? `SKU: ${selectedItem.sku}` : 'Product Details'}
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedItem && (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                                        {selectedItem.image_path ? (
                                            <img src={selectedItem.image_path} alt={selectedItem.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <Package className="w-8 h-8 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedItem.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="secondary">{selectedItem.category || "Uncategorized"}</Badge>
                                            <Badge variant={selectedItem.active ? "success" : "secondary"}>
                                                {selectedItem.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <span className="text-xs text-slate-500 uppercase tracking-wide">Sale Price</span>
                                        <div className="text-xl font-bold text-slate-900 mt-1">
                                            ${selectedItem.sale_price.toFixed(2)}
                                        </div>
                                        <span className="text-xs text-slate-500">per {selectedItem.unit}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <span className="text-xs text-slate-500 uppercase tracking-wide">Taxable</span>
                                        <div className="flex items-center gap-2 mt-2">
                                            {selectedItem.taxable_default ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium">Yes</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Ban className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium">No</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-slate-500" />
                                        Description
                                    </h4>
                                    <div className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-200 p-3 rounded-md">
                                        {selectedItem.description || "No description provided for this item."}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <Link href={`/dashboard/inventory/${selectedItem?.id}`} className="w-full">
                            <Button className="w-full">Edit Item</Button>
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

