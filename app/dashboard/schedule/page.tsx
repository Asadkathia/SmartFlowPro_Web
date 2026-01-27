'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VisitRepository } from "@/lib/repositories/visit-repository"
import { TeamRepository } from "@/lib/repositories/team-repository"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from "lucide-react"
import { PageHeader } from "@/components/shell/PageHeader"
import { cn } from "@/lib/utils"

type ViewMode = 'day' | 'week'

export default function SchedulePage() {
    const [view, setView] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [technicians, setTechnicians] = useState<any[]>([])
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadScheduleData()
    }, [currentDate, view])

    async function loadScheduleData() {
        setLoading(true)
        try {
            const [visits, team] = await Promise.all([
                VisitRepository.list(),
                TeamRepository.list()
            ])

            // Filter to only active technicians
            const techs = team.filter(t => t.role === 'technician' && t.status === 'active')
            setTechnicians(techs)

            // Get date range based on view
            const { startDate, endDate } = getDateRange()

            // Filter and convert visits to calendar events
            const calendarEvents = visits
                .filter(visit => {
                    if (!visit.scheduled_start || !visit.technician_id) {
                        return false
                    }

                    const visitDate = new Date(visit.scheduled_start)
                    const inRange = visitDate >= startDate && visitDate <= endDate
                    return inRange
                })
                .map((visit: any) => {
                    const start = new Date(visit.scheduled_start)
                    const end = new Date(visit.scheduled_end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

                    // Determine color based on status
                    let color = 'bg-blue-100 border-blue-200 text-blue-700'
                    if (visit.status === 'in_progress') {
                        color = 'bg-amber-100 border-amber-200 text-amber-700'
                    } else if (visit.status === 'completed') {
                        color = 'bg-green-100 border-green-200 text-green-700'
                    } else if (visit.status === 'cancelled') {
                        color = 'bg-slate-100 border-slate-200 text-slate-500 line-through'
                    }

                    return {
                        id: visit.id,
                        techId: visit.technician_id,
                        title: visit.job?.service_type || "Service Visit",
                        customer: visit.job?.customer?.name || "Unknown Customer",
                        jobNumber: visit.job?.job_number,
                        start: startHour,
                        duration,
                        date: start,
                        status: visit.status,
                        color
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
            // Week view - get Sunday to Saturday
            const start = new Date(currentDate)
            const day = start.getDay()
            start.setDate(start.getDate() - day) // Go to Sunday
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 6) // Go to Saturday
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

    const hours = Array.from({ length: 24 }, (_, i) => i) // 0 to 23
    const weekDays = view === 'week' ? getWeekDays() : [currentDate]

    const formatDateRange = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        } else {
            const days = getWeekDays()
            const start = days[0]
            const end = days[6]

            if (start.getMonth() === end.getMonth()) {
                return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
            } else {
                return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
        }
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
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Schedule"
                subtitle="Manage technician assignments and appointments."
                actions={
                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
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

                        {/* Date Navigation */}
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

            {/* Date Display Bar */}
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
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        Completed
                    </div>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {/* Day Headers */}
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

                {/* Scrollable Grid */}
                <div className="flex-1 overflow-y-auto relative bg-white">
                    {/* Time Rows */}
                    {hours.map(hour => (
                        <div key={hour} className="flex h-20 border-b border-slate-100 last:border-0 group">
                            {/* Time Column */}
                            <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/30 flex items-start justify-center pt-2">
                                <span className="text-xs font-medium text-slate-400 font-mono">
                                    {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </span>
                            </div>

                            {/* Day Columns */}
                            {weekDays.map((day, dayIdx) => (
                                <div
                                    key={dayIdx}
                                    className="flex-1 border-r border-slate-100 last:border-0 relative hover:bg-slate-50/50 transition-colors"
                                >
                                    {/* Half hour guideline */}
                                    <div className="absolute top-1/2 w-full border-t border-slate-50 border-dashed opacity-0 group-hover:opacity-100"></div>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Events Layer */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                        <div className="flex h-full">
                            <div className="w-16 shrink-0"></div>
                            {weekDays.map((day, dayIdx) => {
                                const dayEvents = events.filter(e => isSameDay(e.date, day))

                                return (
                                    <div key={dayIdx} className="flex-1 relative border-r border-transparent last:border-0 h-full">
                                        {dayEvents.map(event => {
                                            const startOffset = event.start * 80 // 80px per hour
                                            const height = Math.max(event.duration * 80, 44) // Min height

                                            return (
                                                <Link
                                                    key={event.id}
                                                    href={`/dashboard/jobs/${event.id}`}
                                                    className="pointer-events-auto block absolute z-10 left-1 right-1"
                                                    style={{
                                                        top: `${startOffset}px`,
                                                        height: `${height}px`
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "h-full rounded-md border-l-4 p-2 text-xs shadow-sm hover:shadow-md transition-all overflow-hidden",
                                                        event.color
                                                    )}>
                                                        <div className="font-bold truncate">{event.jobNumber}</div>
                                                        <div className="font-medium truncate">{event.title}</div>
                                                        <div className="truncate opacity-80 mt-0.5">{event.customer}</div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Current Time Indicator */}
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
    )
}

