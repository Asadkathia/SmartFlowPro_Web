'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { JobRepository, type Job, type JobStatus } from "@/lib/repositories/JobRepository"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await JobRepository.list()
            setJobs(data)
        } finally {
            setLoading(false)
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.job_number.toLowerCase().includes(search.toLowerCase()) ||
            job.customer_name.toLowerCase().includes(search.toLowerCase())
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Jobs</h1>
                    <p className="text-slate-500">Manage and track service requests.</p>
                </div>
                <Link href="/dashboard/jobs/new">
                    <Button className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Create Job
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <Input
                        placeholder="Search by ID, client..."
                        className="pl-10 border-none bg-slate-50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                </div>
            </div>

            {/* Jobs Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Job ID</th>
                                <th className="px-6 py-3 font-medium">Client</th>
                                <th className="px-6 py-3 font-medium">Service Type</th>
                                <th className="px-6 py-3 font-medium">Date & Time</th>
                                <th className="px-6 py-3 font-medium">Tech</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading jobs...</td>
                                </tr>
                            ) : filteredJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/dashboard/jobs/${job.id}`} className="font-bold text-primary hover:text-blue-600 hover:underline">
                                            {job.job_number}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {job.customer_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {job.service_type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span className="font-medium text-slate-900">
                                                {new Date(job.scheduled_start).toLocaleDateString()}
                                            </span>
                                            <span className="text-slate-500">
                                                {new Date(job.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(job.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {job.technician_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                    {job.technician_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-slate-700">{job.technician_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={statusColors[job.status]}>
                                            {job.status.replace('_', ' ')}
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
