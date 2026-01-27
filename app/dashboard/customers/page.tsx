'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, User, Phone, Mail, MapPin } from "lucide-react"
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

export default function CustomersPage() {
    const [customers, setCustomers] = useState<CustomerWithProperties[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithProperties | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const result = await CustomerRepository.list({ pageSize: 100 })
            setCustomers(result.data)
        } catch (error) {
            console.error("Failed to load customers", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (c.phone?.includes(search) ?? false)
    )

    const handleRowClick = (customer: CustomerWithProperties) => {
        setSelectedCustomer(customer)
        setIsDrawerOpen(true)
    }

    const columns = [
        {
            key: "name",
            header: "Name",
            render: (customer: CustomerWithProperties) => (
                <span className="font-bold text-primary hover:underline">
                    {customer.name}
                </span>
            )
        },
        {
            key: "contact",
            header: "Contact",
            render: (customer: CustomerWithProperties) => (
                <div className="flex flex-col gap-1">
                    {customer.email && (
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                        </div>
                    )}
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "properties",
            header: "Properties",
            render: (customer: CustomerWithProperties) => (
                <Badge variant="secondary">
                    {customer.properties?.length || 0} Properties
                </Badge>
            )
        },
        // Mock status since it's not in DB yet
        {
            key: "status",
            header: "Status",
            render: () => (
                <Badge variant="success">Active</Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Customers"
                subtitle="Manage your client base and properties."
                actions={
                    <Link href="/dashboard/customers/new">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Customer
                        </Button>
                    </Link>
                }
            />

            <FilterBar
                searchPlaceholder="Search customers..."
                searchValue={search}
                onSearchChange={setSearch}
            />

            <DataTable
                columns={columns}
                data={filteredCustomers}
                loading={loading}
                getRowKey={(customer) => customer.id}
                onRowClick={handleRowClick}
                rowActions={() => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={User}
                        title="No customers found"
                        description={search ? "Try adjusting your search" : "Add your first customer to get started"}
                        action={!search ? {
                            label: "Add Customer",
                            onClick: () => window.location.href = "/dashboard/customers/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Customer Profile</DrawerTitle>
                        <DrawerDescription>
                            customer_{selectedCustomer?.id.substring(0, 8)}
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedCustomer && (
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                                        {selectedCustomer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                                        <Badge variant="success" className="mt-1">Active</Badge>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900">Contact Information</h4>
                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            {selectedCustomer.email || "No email provided"}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            {selectedCustomer.phone || "No phone provided"}
                                        </div>
                                    </div>
                                </div>

                                {/* Properties */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-900">Properties ({selectedCustomer.properties?.length || 0})</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedCustomer.properties?.map((prop) => (
                                            <div key={prop.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-md">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-slate-900">{prop.address}</p>
                                                    <p className="text-slate-500">
                                                        {[prop.city, prop.state, prop.zip_code].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedCustomer.properties || selectedCustomer.properties.length === 0) && (
                                            <p className="text-sm text-slate-500 italic">No properties listed</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <Link href={`/dashboard/customers/${selectedCustomer?.id}`} className="w-full">
                            <Button className="w-full">View Full Profile</Button>
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

