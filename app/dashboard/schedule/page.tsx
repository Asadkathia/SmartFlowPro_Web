'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { JobRepository } from "@/lib/repositories/JobRepository"
import { TeamRepository } from "@/lib/repositories/TeamRepository"

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
            const [jobs, team] = await Promise.all([
                JobRepository.list(),
                TeamRepository.list()
            ])

            console.log('=== SCHEDULE DEBUG ===')
            console.log('Total jobs fetched:', jobs.length)
            console.log('Sample job data:', jobs[0])

            // Filter to only active technicians
            const techs = team.filter(t => t.role === 'technician' && t.status === 'active')
            setTechnicians(techs)
            console.log('Active technicians:', techs.length)

            // Get date range based on view
            const { startDate, endDate } = getDateRange()
            console.log('Date range:', { startDate, endDate })

            // Filter and convert jobs to calendar events
            const calendarEvents = jobs
                .filter(job => {
                    console.log('Checking job:', {
                        id: job.id,
                        scheduled_start: job.scheduled_start,
                        technician_id: job.technician_id,
                        has_start: !!job.scheduled_start,
                        has_tech: !!job.technician_id
                    })

                    if (!job.scheduled_start || !job.technician_id) {
                        console.log('Job filtered out - missing start or tech')
                        return false
                    }

                    const jobDate = new Date(job.scheduled_start)
                    const inRange = jobDate >= startDate && jobDate <= endDate
                    console.log('Job date check:', {
                        jobDate,
                        inRange,
                        startDate,
                        endDate
                    })
                    return inRange
                })
                .map(job => {
                    const start = new Date(job.scheduled_start)
                    const end = new Date(job.scheduled_end)
                    const startHour = start.getHours() + start.getMinutes() / 60
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

                    // Determine color based on status
                    let color = 'bg-blue-100 border-blue-300 text-blue-900'
                    if (job.status === 'in_progress') {
                        color = 'bg-amber-100 border-amber-300 text-amber-900'
                    } else if (job.status === 'completed') {
                        color = 'bg-green-100 border-green-300 text-green-900'
                    }

                    return {
                        id: job.id,
                        techId: job.technician_id,
                        title: job.service_type,
                        customer: job.customer_name,
                        jobNumber: job.job_number,
                        start: startHour,
                        duration,
                        date: start,
                        status: job.status,
                        color
                    }
                })

            console.log('Calendar events created:', calendarEvents.length)
            console.log('Sample event:', calendarEvents[0])
            console.log('=== END DEBUG ===')

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

    const hours = Array.from({ length: 24 }, (_, i) => i) // 0 (12 AM) to 23 (11 PM)
    const weekDays = view === 'week' ? getWeekDays() : [currentDate]

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        })
    }

    const formatDayHeader = (date: Date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dayNum = date.getDate()
        const isToday = date.toDateString() === new Date().toDateString()
        return { dayName, dayNum, isToday }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading schedule...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        {formatDate(currentDate)}
                    </h1>
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigateDate('prev')}
                            className="h-8 w-8 p-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigateDate('today')}
                            className="h-8 px-3"
                        >
                            Today
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigateDate('next')}
                            className="h-8 w-8 p-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Button
                        size="sm"
                        variant={view === 'day' ? 'default' : 'ghost'}
                        onClick={() => setView('day')}
                    >
                        Day
                    </Button>
                    <Button
                        size="sm"
                        variant={view === 'week' ? 'default' : 'ghost'}
                        onClick={() => setView('week')}
                    >
                        Week
                    </Button>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-slate-200 shadow-sm bg-white">
                {/* Day Headers */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <div className="w-20 shrink-0 border-r border-slate-200"></div>
                    {weekDays.map((day, idx) => {
                        const { dayName, dayNum, isToday } = formatDayHeader(day)
                        return (
                            <div
                                key={idx}
                                className={`flex-1 p-3 flex flex-col items-center justify-center border-r border-slate-200 last:border-0 ${isToday ? 'bg-primary/5' : ''
                                    }`}
                            >
                                <span className="text-xs font-medium text-slate-500 uppercase">{dayName}</span>
                                <span className={`text-lg font-bold mt-1 ${isToday ? 'text-primary' : 'text-slate-700'
                                    }`}>
                                    {dayNum}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Time Rows */}
                    {hours.map(hour => (
                        <div key={hour} className="flex h-20 border-b border-slate-100 last:border-0">
                            <div className="w-20 shrink-0 border-r border-slate-200 bg-slate-50/50 flex items-start justify-end pr-2 pt-1 text-xs text-slate-400 font-medium">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, dayIdx) => (
                                <div
                                    key={dayIdx}
                                    className="flex-1 border-r border-slate-100 last:border-0 relative hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="absolute top-1/2 w-full border-t border-slate-50"></div>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Events Layer */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                        <div className="flex h-full">
                            <div className="w-20 shrink-0"></div>

                            {weekDays.map((day, dayIdx) => {
                                const dayEvents = events.filter(e =>
                                    e.date.toDateString() === day.toDateString()
                                )

                                return (
                                    <div key={dayIdx} className="flex-1 relative border-r border-transparent last:border-0 h-full">
                                        {dayEvents.map(event => {
                                            const startOffset = event.start * 80 // Start from hour 0
                                            const height = Math.max(event.duration * 80, 40)

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`absolute left-1 right-1 rounded-md border-l-4 p-2 text-xs font-medium cursor-pointer hover:shadow-md transition-all pointer-events-auto ${event.color}`}
                                                    style={{
                                                        top: `${startOffset}px`,
                                                        height: `${height}px`,
                                                        zIndex: 10
                                                    }}
                                                    title={`${event.title} - ${event.customer}`}
                                                >
                                                    <div className="font-bold truncate">{event.title}</div>
                                                    <div className="opacity-80 truncate text-[10px]">{event.customer}</div>
                                                    {event.jobNumber && (
                                                        <div className="opacity-60 text-[10px] mt-0.5">#{event.jobNumber}</div>
                                                    )}
                                                </div>
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
                        const isToday = weekDays.some(day => day.toDateString() === now.toDateString())

                        if (isToday) {
                            const offset = currentHour * 80
                            const dayIndex = weekDays.findIndex(day => day.toDateString() === now.toDateString())
                            const leftOffset = 80 + (dayIndex * (100 / weekDays.length)) + '%'

                            return (
                                <div
                                    className="absolute border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                                    style={{
                                        top: `${offset}px`,
                                        left: '80px',
                                        right: 0
                                    }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                                </div>
                            )
                        }
                        return null
                    })()}
                </div>
            </Card>

            {/* Empty State */}
            {events.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-slate-400">
                        <p className="text-lg font-medium">No visits scheduled</p>
                        <p className="text-sm mt-1">Create a job to see it on the calendar</p>
                    </div>
                </div>
            )}
        </div>
    )
}
