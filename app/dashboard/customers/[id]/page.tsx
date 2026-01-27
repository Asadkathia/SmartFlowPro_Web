'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Plus, MapPin } from "lucide-react"

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
    const [customer, setCustomer] = useState<CustomerWithProperties | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        CustomerRepository.getById(params.id).then(c => {
            setCustomer(c)
            setLoading(false)
        })
    }, [params.id])

    if (loading) return <div className="p-8 text-center text-slate-500">Loading customer...</div>
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Link href="/dashboard/customers" className="hover:text-primary hover:underline">Customers</Link>
                        <span>/</span>
                        <span>{customer.name}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">{customer.name}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Profile</Button>
                    <Button>New Job</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs text-slate-500 font-medium">Email</span>
                                    <span className="text-sm font-medium truncate">{customer.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 font-medium">Phone</span>
                                    <span className="text-sm font-medium">{customer.phone}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Tags</CardTitle>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            <Badge variant="secondary">VIP Client</Badge>
                            <Badge variant="outline">Commercial</Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Properties */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Properties</CardTitle>
                            <Button variant="outline" size="sm">Add Property</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {customer.properties.map(prop => (
                                    <div key={prop.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-slate-400" />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{prop.address}</span>
                                                <span className="text-sm text-slate-500">{prop.city}, {prop.state} {prop.zip_code}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">View</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Jobs (Mock) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6 text-slate-500 text-sm">
                                No recent jobs found.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

