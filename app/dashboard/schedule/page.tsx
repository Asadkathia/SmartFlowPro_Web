'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { VisitRepository } from "@/lib/repositories/visit-repository"
import { TeamRepository } from "@/lib/repositories/team-repository"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"
import { JobRepository } from "@/lib/repositories/job-repository"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Sparkles, X } from "lucide-react"
import { PageHeader } from "@/components/shell/PageHeader"
import { cn } from "@/lib/utils"

type ViewMode = 'day' | 'week'

type Priority = 'low' | 'medium' | 'high'

interface CalendarEvent {
    visitId: string
    jobId?: string
    techId?: string
    title: string
    serviceType: string
    customer: string
    jobNumber: string
    start: number
    duration: number
    date: Date
    status?: string
}

const SERVICE_TYPES = [
    "HVAC",
    "Plumbing",
    "Electrical",
    "Appliance Repair",
    "Installation",
    "Maintenance",
    "Inspection",
    "Emergency Service",
    "General Repair",
]

function formatLocalDateInput(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function formatLocalTimeInput(date: Date) {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
}

function getEventStyles(status?: string) {
    switch (status) {
        case 'scheduled':
            return {
                cardClass: 'bg-blue-100 border-blue-200 text-blue-700',
                strike: false,
            }
        case 'in_progress':
            return {
                cardClass: 'bg-amber-100 border-amber-200 text-amber-700',
                strike: false,
            }
        case 'completed':
            return {
                cardClass: 'bg-emerald-100 border-emerald-200 text-emerald-700',
                strike: true,
            }
        case 'cancelled':
            return {
                cardClass: 'bg-rose-100 border-rose-200 text-rose-700',
                strike: false,
            }
        default:
            return {
                cardClass: 'bg-slate-100 border-slate-200 text-slate-700',
                strike: false,
            }
    }
}

export default function SchedulePage() {
    const [view, setView] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [technicians, setTechnicians] = useState<any[]>([])
    const [customers, setCustomers] = useState<CustomerWithProperties[]>([])
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [creatingFromSlot, setCreatingFromSlot] = useState(false)
    const [enhancingDescription, setEnhancingDescription] = useState(false)
    const [modalError, setModalError] = useState("")
    const [modalSuccess, setModalSuccess] = useState("")

    const [createCustomerId, setCreateCustomerId] = useState("")
    const [createServiceType, setCreateServiceType] = useState("")
    const [createDescription, setCreateDescription] = useState("")
    const [createPriority, setCreatePriority] = useState<Priority>('medium')
    const [createDate, setCreateDate] = useState("")
    const [createStartTime, setCreateStartTime] = useState("")
    const [createEndTime, setCreateEndTime] = useState("")
    const [createTechnicianId, setCreateTechnicianId] = useState("")

    useEffect(() => {
        loadCustomers()
    }, [])

    useEffect(() => {
        loadScheduleData()
    }, [currentDate, view])

    async function loadCustomers() {
        try {
            const result = await CustomerRepository.list({ pageSize: 200 })
            setCustomers(result.data)
        } catch (error) {
            console.error('Error loading customers:', error)
        }
    }

    async function loadScheduleData() {
        setLoading(true)
        try {
            const { startDate, endDate } = getDateRange()

            const [visits, team] = await Promise.all([
                VisitRepository.list({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                }),
                TeamRepository.list()
            ])

            // Filter to only active technicians
            const techs = team.filter(t => t.role === 'technician' && t.status === 'active')
            setTechnicians(techs)

            const calendarEvents: CalendarEvent[] = visits
                .filter((visit: any) => visit?.scheduled_start && visit?.scheduled_end)
                .map((visit: any) => {
                    const start = new Date(visit.scheduled_start)
                    const end = new Date(visit.scheduled_end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const duration = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 0.25)

                    return {
                        visitId: visit.id,
                        jobId: visit.job?.id || visit.job_id,
                        techId: visit.technician_id,
                        title: visit.job?.service_type || "Service Visit",
                        serviceType: visit.job?.service_type || "Service",
                        customer: visit.job?.customer?.name || "Unknown Customer",
                        jobNumber: visit.job?.job_number || `VIS-${visit.id?.slice?.(0, 6) || '----'}`,
                        start: startHour,
                        duration,
                        date: start,
                        status: visit.status,
                    }
                })

            setEvents(calendarEvents)
        } catch (error) {
            console.error('Error loading schedule:', error)
        } finally {
            setLoading(false)
        }
    }

    function getDateRange() {
        if (view === 'day') {
            const start = new Date(currentDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(currentDate)
            end.setHours(23, 59, 59, 999)
            return { startDate: start, endDate: end }
        } else {
            const start = new Date(currentDate)
            const day = start.getDay()
            start.setDate(start.getDate() - day)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 6)
            end.setHours(23, 59, 59, 999)

            return { startDate: start, endDate: end }
        }
    }

    function getWeekDays() {
        const { startDate } = getDateRange()
        const days = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            days.push(date)
        }
        return days
    }

    function navigateDate(direction: 'prev' | 'next' | 'today') {
        if (direction === 'today') {
            setCurrentDate(new Date())
        } else {
            const newDate = new Date(currentDate)
            const offset = view === 'day' ? 1 : 7
            newDate.setDate(newDate.getDate() + (direction === 'next' ? offset : -offset))
            setCurrentDate(newDate)
        }
    }

    function isSameDay(d1: Date, d2: Date) {
        return d1.toDateString() === d2.toDateString()
    }

    function openCreateModalForSlot(day: Date, hour: number) {
        const slotStart = new Date(day)
        slotStart.setHours(hour, 0, 0, 0)
        const slotEnd = new Date(slotStart)
        slotEnd.setHours(slotEnd.getHours() + 1)

        setCreateDate(formatLocalDateInput(slotStart))
        setCreateStartTime(formatLocalTimeInput(slotStart))
        setCreateEndTime(formatLocalTimeInput(slotEnd))
        setCreateCustomerId("")
        setCreateServiceType("")
        setCreateDescription("")
        setCreatePriority('medium')
        setCreateTechnicianId("")
        setModalError("")
        setModalSuccess("")
        setIsCreateModalOpen(true)
    }

    function closeCreateModal() {
        if (creatingFromSlot) return
        setIsCreateModalOpen(false)
        setModalError("")
        setModalSuccess("")
    }

    async function handleEnhanceDescription() {
        if (!createDescription.trim() || enhancingDescription) return

        setModalError("")
        setEnhancingDescription(true)
        try {
            const response = await fetch('/api/ai/enhance-job-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: createDescription }),
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to enhance description')
            }

            if (data?.enhancedDescription) {
                setCreateDescription(data.enhancedDescription)
            }
        } catch (error: any) {
            setModalError(error?.message || 'Failed to enhance description')
        } finally {
            setEnhancingDescription(false)
        }
    }

    async function handleCreateJobFromSlot() {
        setModalError("")
        setModalSuccess("")

        if (!createCustomerId || !createServiceType || !createDate || !createStartTime || !createEndTime || !createTechnicianId) {
            setModalError('Please complete all required fields.')
            return
        }

        const selectedCustomer = customers.find(c => c.id === createCustomerId)
        const selectedTechnician = technicians.find(t => t.id === createTechnicianId)

        if (!selectedCustomer || !selectedTechnician) {
            setModalError('Invalid customer or technician selection.')
            return
        }

        const start = new Date(`${createDate}T${createStartTime}`)
        const end = new Date(`${createDate}T${createEndTime}`)

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            setModalError('Invalid date/time selection.')
            return
        }

        if (end <= start) {
            setModalError('End time must be after start time.')
            return
        }

        setCreatingFromSlot(true)
        try {
            await JobRepository.create({
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.name,
                service_type: createServiceType,
                priority: createPriority,
                scheduled_start: start.toISOString(),
                scheduled_end: end.toISOString(),
                technician_id: selectedTechnician.id,
                technician_name: selectedTechnician.full_name,
                location: selectedCustomer.properties?.[0]?.address || 'Unknown',
                status: 'scheduled',
                description: createDescription,
            })

            setModalSuccess('Job created successfully.')
            await loadScheduleData()

            setTimeout(() => {
                setIsCreateModalOpen(false)
                setModalSuccess("")
            }, 600)
        } catch (error: any) {
            setModalError(error?.message || 'Failed to create job from schedule.')
        } finally {
            setCreatingFromSlot(false)
        }
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const weekDays = view === 'week' ? getWeekDays() : [currentDate]

    const formatDateRange = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        }

        const days = getWeekDays()
        const start = days[0]
        const end = days[6]

        if (start.getMonth() === end.getMonth()) {
            return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
        }

        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-white rounded-lg border border-slate-200">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading schedule...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <PageHeader
                    title="Schedule"
                    subtitle="Manage technician assignments and appointments."
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setView('day')}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        view === 'day' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Day
                                </button>
                                <button
                                    onClick={() => setView('week')}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        view === 'week' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    Week
                                </button>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => navigateDate('prev')}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => navigateDate('today')}
                                    className="px-3 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-white hover:text-primary hover:shadow-sm rounded-md transition-all"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => navigateDate('next')}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <Link href="/dashboard/jobs/new">
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Job
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-lg">
                        <CalendarIcon className="w-5 h-5 text-slate-400" />
                        {formatDateRange()}
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            Scheduled
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            In Progress
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Completed
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            Cancelled
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
                        <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/30"></div>
                        {weekDays.map((day, idx) => {
                            const isToday = isSameDay(day, new Date())
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex-1 p-3 flex flex-col items-center justify-center border-r border-slate-100 last:border-0 transition-colors",
                                        isToday ? "bg-primary/5" : ""
                                    )}
                                >
                                    <span className={cn(
                                        "text-xs font-medium uppercase tracking-wider mb-1",
                                        isToday ? "text-primary" : "text-slate-500"
                                    )}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                                        isToday ? "bg-primary text-white shadow-sm" : "text-slate-900"
                                    )}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto relative bg-white">
                        {hours.map(hour => (
                            <div key={hour} className="flex h-20 border-b border-slate-100 last:border-0 group">
                                <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/30 flex items-start justify-center pt-2">
                                    <span className="text-xs font-medium text-slate-400 font-mono">
                                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                    </span>
                                </div>

                                {weekDays.map((day, dayIdx) => (
                                    <button
                                        key={dayIdx}
                                        type="button"
                                        onClick={() => openCreateModalForSlot(day, hour)}
                                        className="flex-1 border-r border-slate-100 last:border-0 relative hover:bg-primary/5 transition-colors cursor-pointer"
                                        aria-label={`Create job at ${hour}:00 on ${day.toDateString()}`}
                                    >
                                        <div className="absolute top-1/2 w-full border-t border-slate-50 border-dashed opacity-0 group-hover:opacity-100"></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[11px] font-medium text-primary bg-white/90 border border-primary/20 rounded px-1.5 py-0.5 shadow-sm">+ Create</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}

                        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                            <div className="flex h-full">
                                <div className="w-16 shrink-0"></div>
                                {weekDays.map((day, dayIdx) => {
                                    const dayEvents = events.filter(e => isSameDay(e.date, day))

                                    return (
                                        <div key={dayIdx} className="flex-1 relative border-r border-transparent last:border-0 h-full">
                                            {dayEvents.map(event => {
                                                const startOffset = event.start * 80
                                                const height = Math.max(event.duration * 80, 44)
                                                const style = getEventStyles(event.status)

                                                const eventCard = (
                                                    <div className={cn(
                                                        "h-full rounded-md border-l-4 p-2 text-xs shadow-sm hover:shadow-md transition-all overflow-hidden",
                                                        style.cardClass
                                                    )}>
                                                        <div className={cn("font-bold truncate", style.strike && "line-through opacity-70")}>{event.jobNumber}</div>
                                                        <div className={cn("font-medium truncate", style.strike && "line-through opacity-70")}>{event.title}</div>
                                                        <div className={cn("truncate opacity-80 mt-0.5", style.strike && "line-through opacity-70")}>{event.customer}</div>
                                                    </div>
                                                )

                                                return event.jobId ? (
                                                    <Link
                                                        key={event.visitId}
                                                        href={`/dashboard/jobs/${event.jobId}`}
                                                        className="pointer-events-auto block absolute z-10 left-1 right-1"
                                                        style={{ top: `${startOffset}px`, height: `${height}px` }}
                                                    >
                                                        {eventCard}
                                                    </Link>
                                                ) : (
                                                    <div
                                                        key={event.visitId}
                                                        className="pointer-events-none block absolute z-10 left-1 right-1"
                                                        style={{ top: `${startOffset}px`, height: `${height}px` }}
                                                    >
                                                        {eventCard}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {(() => {
                            const now = new Date()
                            const currentHour = now.getHours() + now.getMinutes() / 60
                            const isToday = weekDays.some(day => isSameDay(day, now))

                            if (isToday) {
                                const offset = currentHour * 80
                                const dayIndex = weekDays.findIndex(day => isSameDay(day, now))
                                const widthPercent = 100 / weekDays.length
                                const leftOffsetPct = dayIndex * widthPercent

                                return (
                                    <div
                                        className="absolute border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                                        style={{
                                            top: `${offset}px`,
                                            left: `calc(4rem + ${leftOffsetPct}%)`,
                                            width: `${widthPercent}%`
                                        }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 absolute left-0 -translate-y-1/2"></div>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeCreateModal}>
                    <div
                        className="w-full max-w-2xl bg-white rounded-lg border border-slate-200 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Create Job from Schedule</h3>
                                <p className="text-sm text-slate-500">New job at selected time slot</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Customer *</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        value={createCustomerId}
                                        onChange={(e) => setCreateCustomerId(e.target.value)}
                                    >
                                        <option value="">Select customer</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Service Type *</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        value={createServiceType}
                                        onChange={(e) => setCreateServiceType(e.target.value)}
                                    >
                                        <option value="">Select service type</option>
                                        {SERVICE_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <div className="relative">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="absolute top-2 right-2 z-10 gap-1.5 h-7 px-2"
                                        onClick={handleEnhanceDescription}
                                        disabled={!createDescription.trim() || enhancingDescription}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {enhancingDescription ? 'Enhancing...' : 'Enhance with AI'}
                                    </Button>
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-40 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        placeholder="Describe the issue..."
                                        value={createDescription}
                                        onChange={(e) => setCreateDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <div className="flex gap-2">
                                    {(['low', 'medium', 'high'] as const).map(p => (
                                        <Badge
                                            key={p}
                                            variant={createPriority === p ? (p === 'high' ? 'danger' : 'default') : 'outline'}
                                            className={cn(
                                                "cursor-pointer capitalize px-3 py-1",
                                                createPriority !== p && p === 'high' && 'text-red-500 border-red-200 hover:bg-red-50'
                                            )}
                                            onClick={() => setCreatePriority(p)}
                                        >
                                            {p}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date *</label>
                                    <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Time *</label>
                                    <Input type="time" value={createStartTime} onChange={(e) => setCreateStartTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Time *</label>
                                    <Input type="time" value={createEndTime} onChange={(e) => setCreateEndTime(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Technician *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={createTechnicianId}
                                    onChange={(e) => setCreateTechnicianId(e.target.value)}
                                >
                                    <option value="">Select technician</option>
                                    {technicians.map((tech) => (
                                        <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            {modalError && (
                                <p className="text-sm text-red-600">{modalError}</p>
                            )}
                            {modalSuccess && (
                                <p className="text-sm text-emerald-600">{modalSuccess}</p>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={closeCreateModal} disabled={creatingFromSlot}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateJobFromSlot} disabled={creatingFromSlot}>
                                {creatingFromSlot ? 'Creating...' : 'Create Job'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
