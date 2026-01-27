'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { JobRepository, type Job, type JobStatus } from "@/lib/repositories/job-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, Calendar, Clock, MapPin, User } from "lucide-react"
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

// Extended type to handle joined fields not in base Job type
interface ExtendedJob extends Job {
    customer_name: string
    technician_name?: string
    scheduled_start: string
    scheduled_end: string
    status: JobStatus
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<ExtendedJob[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
    const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await JobRepository.list()
            setJobs(data as unknown as ExtendedJob[])
        } catch (error) {
            console.error("Failed to load jobs", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.job_number.toLowerCase().includes(search.toLowerCase()) ||
            job.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            false
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusColors: Record<JobStatus, "info" | "warning" | "success" | "secondary" | "danger" | "default" | "outline"> = {
        scheduled: "info",
        in_progress: "warning",
        completed: "success",
        pending: "secondary",
        cancelled: "danger"
    }

    const handleRowClick = (job: ExtendedJob) => {
        setSelectedJob(job)
        setIsDrawerOpen(true)
    }

    const columns = [
        {
            key: "job_number",
            header: "Job ID",
            render: (job: ExtendedJob) => (
                <span className="font-bold text-primary hover:underline">
                    {job.job_number}
                </span>
            )
        },
        {
            key: "customer",
            header: "Client",
            render: (job: ExtendedJob) => (
                <span className="font-medium text-slate-900">
                    {job.customer_name}
                </span>
            )
        },
        {
            key: "service",
            header: "Service Type",
            render: (job: ExtendedJob) => (
                <span className="text-slate-600">
                    {job.service_type}
                </span>
            )
        },
        {
            key: "date",
            header: "Date & Time",
            render: (job: ExtendedJob) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-slate-900">
                        {new Date(job.scheduled_start).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500">
                        {new Date(job.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(job.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            key: "tech",
            header: "Tech",
            render: (job: ExtendedJob) => job.technician_name ? (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                        {job.technician_name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700">{job.technician_name}</span>
                </div>
            ) : (
                <span className="text-slate-400 italic">Unassigned</span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (job: ExtendedJob) => (
                <Badge variant={statusColors[job.status]}>
                    {job.status.replace('_', ' ')}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Jobs"
                subtitle="Manage and track service requests."
                actions={
                    <Link href="/dashboard/jobs/new">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Job
                        </Button>
                    </Link>
                }
            />

            <FilterBar
                searchPlaceholder="Search by ID, client..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={
                    <select
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                }
            />

            <DataTable
                columns={columns}
                data={filteredJobs}
                loading={loading}
                getRowKey={(job) => job.id}
                onRowClick={handleRowClick}
                rowActions={(job) => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={Calendar}
                        title="No jobs found"
                        description={search ? "Try adjusting your search or filters" : "Get started by creating your first job"}
                        action={!search ? {
                            label: "Create Job",
                            onClick: () => window.location.href = "/dashboard/jobs/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Job Details</DrawerTitle>
                        <DrawerDescription>
                            {selectedJob?.job_number} • {selectedJob?.status.replace('_', ' ')}
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedJob && (
                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        Customer
                                    </h4>
                                    <div className="bg-slate-50 p-3 rounded-md">
                                        <p className="font-medium">{selectedJob.customer_name}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {/* We don't have address in this payload, but would show it here */}
                                            Client address would go here
                                        </p>
                                    </div>
                                </div>

                                {/* Schedule Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        Schedule
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-md">
                                            <span className="text-xs text-slate-500 block">Start</span>
                                            <span className="text-sm font-medium">
                                                {new Date(selectedJob.scheduled_start).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-md">
                                            <span className="text-xs text-slate-500 block">End</span>
                                            <span className="text-sm font-medium">
                                                {new Date(selectedJob.scheduled_end).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Info */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        Service Details
                                    </h4>
                                    <div className="border border-slate-200 rounded-md p-4">
                                        <p className="font-medium text-primary">{selectedJob.service_type}</p>
                                        {selectedJob.notes && (
                                            <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                                {selectedJob.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <Link href={`/dashboard/jobs/${selectedJob?.id}`} className="w-full">
                            <Button className="w-full">View Full Job</Button>
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

