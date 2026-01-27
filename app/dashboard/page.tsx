'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { JobRepository } from "@/lib/repositories/job-repository"
import { TeamRepository } from "@/lib/repositories/team-repository"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { VisitRepository } from "@/lib/repositories/visit-repository"
import { PageHeader } from "@/components/shell/PageHeader"
import {
    Briefcase,
    DollarSign,
    FileText,
    Users,
    Plus,
    UserPlus,
    Package,
    ArrowRight,
    Calendar
} from "lucide-react"

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
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const [jobs, team, invoices, visits] = await Promise.all([
                JobRepository.list(),
                TeamRepository.list(),
                InvoiceRepository.list(),
                VisitRepository.list({
                    startDate: today.toISOString(),
                    endDate: tomorrow.toISOString()
                })
            ])

            // Calculate stats
            setStats({
                totalJobs: jobs.length,
                revenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
                pendingInvoices: invoices.filter(i => i.status === 'unpaid').length,
                activeTechs: team.filter(t => t.status === 'active' && t.role === 'technician').length
            })

            // Get recent jobs (top 5)
            setRecentJobs(jobs.slice(0, 5))

            // Get today's visits
            setTodayVisits(visits.slice(0, 4))
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusVariant = (status: string | undefined) => {
        if (!status) return 'secondary'
        switch (status) {
            case 'in_progress': return 'warning'
            case 'scheduled': return 'info'
            case 'completed': return 'success'
            default: return 'secondary'
        }
    }

    const getStatusLabel = (status: string | undefined) => {
        if (!status) return 'Unknown'
        switch (status) {
            case 'in_progress': return 'In Progress'
            case 'scheduled': return 'Scheduled'
            case 'completed': return 'Completed'
            default: return status.charAt(0).toUpperCase() + status.slice(1)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading overview...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Dashboard"
                subtitle="Overview of your business performance."
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Jobs</CardTitle>
                        <Briefcase className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.totalJobs}</div>
                        <p className="text-xs text-slate-500 mt-1">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Revenue</CardTitle>
                        <DollarSign className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Total invoiced</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
                        <FileText className="w-4 h-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.pendingInvoices}</div>
                        <p className="text-xs text-slate-500 mt-1">Unpaid invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Team</CardTitle>
                        <Users className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.activeTechs}</div>
                        <p className="text-xs text-slate-500 mt-1">Active technicians</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Schedule Preview */}
                <Card className="lg:col-span-1 flex flex-col h-full border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-900">Today's Schedule</CardTitle>
                        <Calendar className="w-4 h-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                        {todayVisits.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center gap-2 text-slate-400">
                                <Calendar className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No visits scheduled for today</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayVisits.map((visit, idx) => (
                                    <div key={visit.id} className="flex gap-3 items-start group">
                                        <div className="w-12 pt-1 text-xs font-medium text-slate-400 text-right">
                                            {new Date(visit.scheduled_start).getHours()}:00
                                        </div>
                                        <div className={`flex-1 border-l-4 rounded-md p-3 transition-all hover:shadow-md cursor-pointer bg-white border border-slate-200 ${visit.status === 'completed' ? 'border-l-green-500' :
                                            visit.status === 'in_progress' ? 'border-l-amber-500' : 'border-l-blue-500'
                                            }`}>
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{visit.job?.service_type || "Service"}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                {visit.job?.customer?.name || "Unknown Customer"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href="/dashboard/schedule" className="mt-auto pt-4">
                            <Button variant="outline" className="w-full gap-2">
                                View Calendar
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Right Col: Recent Activity */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-bold text-slate-900">Recent Jobs</CardTitle>
                            <Link href="/dashboard/jobs">
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {recentJobs.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p>No jobs yet</p>
                                    <Link href="/dashboard/jobs/new">
                                        <Button className="mt-4">Create First Job</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {recentJobs.map((job) => (
                                        <div key={job.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-slate-900">{job.service_type}</span>
                                                <span className="text-xs text-slate-500">Client: {job.customer_name}</span>
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

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-bold text-slate-900">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <Link href="/dashboard/jobs/new">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <Plus className="w-4 h-4 text-primary" />
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-slate-900">New Job</span>
                                            <span className="text-[10px] text-slate-500">Schedule work</span>
                                        </div>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/customers/new">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <UserPlus className="w-4 h-4 text-primary" />
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-slate-900">Client</span>
                                            <span className="text-[10px] text-slate-500">Add customer</span>
                                        </div>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/invoices/new">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-slate-900">Invoice</span>
                                            <span className="text-[10px] text-slate-500">Create bill</span>
                                        </div>
                                    </Button>
                                </Link>
                                <Link href="/dashboard/inventory/new">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <Package className="w-4 h-4 text-primary" />
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-slate-900">Item</span>
                                            <span className="text-[10px] text-slate-500">Add product</span>
                                        </div>
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

