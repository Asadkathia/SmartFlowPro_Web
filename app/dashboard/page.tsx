'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { JobRepository } from "@/lib/repositories/JobRepository"
import { TeamRepository } from "@/lib/repositories/TeamRepository"
import { InvoiceRepository } from "@/lib/repositories/FinanceRepository"

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalJobs: 0,
        revenue: 0,
        pendingInvoices: 0,
        activeTechs: 0
    })
    const [recentJobs, setRecentJobs] = useState<any[]>([])
    const [todayVisits, setTodayVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    async function loadDashboardData() {
        try {
            const [jobs, team, invoices] = await Promise.all([
                JobRepository.list(),
                TeamRepository.list(),
                InvoiceRepository.list()
            ])

            // Calculate stats
            setStats({
                totalJobs: jobs.length,
                revenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
                pendingInvoices: invoices.filter(i => i.status === 'unpaid').length,
                activeTechs: team.filter(t => t.status === 'active' && t.role === 'technician').length
            })

            // Get recent jobs (top 3)
            setRecentJobs(jobs.slice(0, 3))

            // Get today's visits (mock for now - would need visit filtering)
            setTodayVisits(jobs.slice(0, 3))
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'in_progress': return 'warning'
            case 'scheduled': return 'info'
            case 'completed': return 'success'
            default: return 'default'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'in_progress': return 'In Progress'
            case 'scheduled': return 'Scheduled'
            case 'completed': return 'Completed'
            default: return status
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Overview of your business performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Total Jobs</CardTitle>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded text-[20px]">work</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                        <p className="text-xs text-text-secondary mt-1">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Revenue</CardTitle>
                        <span className="material-symbols-outlined text-green-600 bg-green-100 p-1 rounded text-[20px]">payments</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-text-secondary mt-1">Total invoiced</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Pending Invoices</CardTitle>
                        <span className="material-symbols-outlined text-orange-600 bg-orange-100 p-1 rounded text-[20px]">receipt_long</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                        <p className="text-xs text-text-secondary mt-1">Awaiting payment</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Active Techs</CardTitle>
                        <span className="material-symbols-outlined text-blue-600 bg-blue-100 p-1 rounded text-[20px]">group</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTechs}</div>
                        <p className="text-xs text-text-secondary mt-1">Team members</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Schedule Preview */}
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                        {todayVisits.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <p>No visits scheduled for today</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todayVisits.map((job, idx) => (
                                    <div key={job.id} className="flex gap-4">
                                        <div className={`flex-1 border-l-4 rounded-r-md p-3 hover:shadow-sm transition-shadow cursor-pointer ${idx === 0 ? 'bg-blue-50 border-blue-500' :
                                                idx === 1 ? 'bg-orange-50 border-orange-500' :
                                                    'bg-purple-50 border-purple-500'
                                            }`}>
                                            <h4 className="text-sm font-bold text-slate-900">{job.service_type}</h4>
                                            <p className={`text-xs mt-1 ${idx === 0 ? 'text-blue-700' :
                                                    idx === 1 ? 'text-orange-700' :
                                                        'text-purple-700'
                                                }`}>
                                                {job.customer_name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/dashboard/schedule">
                            <Button variant="outline" className="w-full mt-auto border-dashed text-slate-500 hover:text-primary hover:border-solid">
                                View Full Calendar
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Right Col: Recent Activity */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Jobs</CardTitle>
                            <Link href="/dashboard/jobs">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentJobs.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p>No jobs yet</p>
                                    <Link href="/dashboard/jobs/new">
                                        <Button className="mt-4">Create First Job</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentJobs.map((job) => (
                                        <div key={job.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{job.service_type}</span>
                                                <span className="text-xs text-text-secondary">Client: {job.customer_name}</span>
                                            </div>
                                            <Badge variant={getStatusVariant(job.status)}>
                                                {getStatusLabel(job.status)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/dashboard/jobs/new">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        New Job
                                    </Button>
                                </Link>
                                <Link href="/dashboard/customers/new">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                                        New Customer
                                    </Button>
                                </Link>
                                <Link href="/dashboard/team/new">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <span className="material-symbols-outlined text-[18px]">group_add</span>
                                        Invite Team
                                    </Button>
                                </Link>
                                <Link href="/dashboard/inventory/new">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                        Add Item
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
