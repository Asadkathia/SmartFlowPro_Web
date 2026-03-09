'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { JobRepository } from "@/lib/repositories/job-repository"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Plus, Clock, User } from "lucide-react"

export default function JobDetailPage() {
    const params = useParams<{ id: string }>()
    const [job, setJob] = useState<any | undefined>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [params.id])

    async function loadData() {
        setLoading(true)
        try {
            const data = await JobRepository.getById(params.id)
            setJob(data)
        } catch (error) {
            console.error("Failed to load job", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-500">Loading job details...</div>
    if (!job) return <div className="p-12 text-center text-red-500">Job not found</div>

    // Use primary visit for display
    const visit = job.visits?.[0]
    const status = visit?.status || 'scheduled'
    const technician = visit?.technician
    const customer = job.customer
    const property = customer?.properties?.[0]

    const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
        scheduled: "secondary",
        in_progress: "warning",
        completed: "success",
        pending: "secondary",
        cancelled: "danger"
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Link href="/dashboard/jobs" className="hover:text-primary hover:underline">Jobs</Link>
                        <span>/</span>
                        <span>{job.job_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900">{job.service_type}</h1>
                        <Badge variant={statusColors[status] || "default"} className="text-sm px-3 py-1">
                            {status.toUpperCase().replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit Job</Button>
                    <Button variant="destructive">Cancel Job</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">Customer</span>
                                <Link href={`/dashboard/customers/${job.customer_id}`} className="text-primary font-bold hover:underline text-lg">
                                    {customer?.name || "Unknown"}
                                </Link>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">Location</span>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                                    <span className="text-slate-900 font-medium">
                                        {property ? `${property.address}, ${property.city}` : "No address on file"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Schedule & Assignment</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Date & Time</span>
                                {visit ? (
                                    <>
                                        <div className="flex items-center gap-2 font-medium text-slate-900 text-lg">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            {new Date(visit.scheduled_start).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 font-medium text-slate-700 ml-7">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>
                                                {new Date(visit.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(visit.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-500 italic">No visit scheduled</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Assigned Technician</span>
                                {technician ? (
                                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                            {technician.full_name?.substring(0, 2).toUpperCase() || "T"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{technician.full_name}</p>
                                            <span className="text-xs text-green-600 font-medium">Notify</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="ml-auto text-primary">Reassign</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="border-dashed">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Assign Technician
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Line Items & Billing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                No line items added yet.
                                <br />
                                <Button variant="link" className="mt-2">Create Quote</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border-l-2 border-slate-100 pl-4 space-y-6">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100"></div>
                                    <p className="text-sm text-slate-900">Job created</p>
                                    <span className="text-xs text-slate-500">
                                        {new Date(job.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {technician && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-100"></div>
                                        <p className="text-sm text-slate-900">Assigned to <strong>{technician.full_name}</strong></p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

