'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JobRepository } from "@/lib/repositories/job-repository"
import { CustomerRepository, type CustomerWithProperties } from "@/lib/repositories/customer-repository"
import { TeamRepository, TeamMember } from "@/lib/repositories/team-repository"
import { Sparkles } from "lucide-react"

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

export default function CreateJobPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [enhancing, setEnhancing] = useState(false)
    const [enhanceError, setEnhanceError] = useState("")

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithProperties | null>(null)
    const [serviceType, setServiceType] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>("medium")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [selectedTech, setSelectedTech] = useState<TeamMember | null>(null)

    // Data
    const [customers, setCustomers] = useState<CustomerWithProperties[]>([])
    const [technicians, setTechnicians] = useState<TeamMember[]>([])

    useEffect(() => {
        CustomerRepository.list().then(res => setCustomers(res.data))
        TeamRepository.list().then(data => setTechnicians(data.filter(m => m.role === 'technician')))
    }, [])

    async function handleCreate() {
        if (!selectedCustomer || !selectedTech || !date || !startTime || !endTime) return

        setSaving(true)
        const scheduledStart = new Date(`${date}T${startTime}`).toISOString()
        const scheduledEnd = new Date(`${date}T${endTime}`).toISOString()

        await JobRepository.create({
            customer_id: selectedCustomer.id,
            customer_name: selectedCustomer.name,
            service_type: serviceType,
            priority,
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
            technician_id: selectedTech.id,
            technician_name: selectedTech.full_name,
            location: selectedCustomer.properties[0]?.address || 'Unknown',
            status: 'scheduled',
            description
        })

        setSaving(false)
        router.push('/dashboard/jobs')
    }

    async function handleEnhanceDescription() {
        if (!description.trim() || enhancing) return

        setEnhanceError("")
        setEnhancing(true)

        try {
            const response = await fetch('/api/ai/enhance-job-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to enhance description')
            }

            if (data?.enhancedDescription) {
                setDescription(data.enhancedDescription)
            }
        } catch (error: any) {
            setEnhanceError(error?.message || 'Failed to enhance description')
        } finally {
            setEnhancing(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/jobs" className="hover:text-primary hover:underline">Jobs</Link>
                <span>/</span>
                <span>New Job</span>
            </div>

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-900">Create New Job</h1>

                {/* Progress Steps UI (Simplified) */}
                <div className="flex items-center w-full mt-4 mb-8">
                    <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-primary' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>1</div>
                        <span className="text-sm font-medium">Customer</span>
                    </div>
                    <div className={`h-[2px] w-full flex-1 mb-6 ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-primary' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>2</div>
                        <span className="text-sm font-medium">Details</span>
                    </div>
                    <div className={`h-[2px] w-full flex-1 mb-6 ${step >= 3 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    <div className={`flex flex-col items-center flex-1 ${step >= 3 ? 'text-primary' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>3</div>
                        <span className="text-sm font-medium">Schedule</span>
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="p-8">
                    {step === 1 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold">Select Customer</h2>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Service Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                >
                                    <option value="">Select service type</option>
                                    {SERVICE_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                                {customers.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedCustomer(c)}
                                        className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-50 transition-all ${selectedCustomer?.id === c.id ? 'border-primary ring-1 ring-primary bg-slate-50' : 'border-slate-200'}`}
                                    >
                                        <div className="font-bold text-slate-900">{c.name}</div>
                                        <div className="text-sm text-slate-500">{c.email} • {c.properties.length} Properties</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button disabled={!selectedCustomer || !serviceType} onClick={() => setStep(2)}>Next Step</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold">Job Details</h2>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-500">Service Type:</span>
                                    <Badge variant="outline">{serviceType}</Badge>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="absolute top-2 right-2 z-10 gap-1.5 h-7 px-2"
                                            onClick={handleEnhanceDescription}
                                            disabled={!description.trim() || enhancing}
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            {enhancing ? 'Enhancing...' : 'Enhance with AI'}
                                        </Button>
                                        <textarea
                                            className="flex min-h-[110px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-40 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Describe the issue..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>
                                    {enhanceError && <p className="text-xs text-red-600">{enhanceError}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <div className="flex gap-2">
                                        {(['low', 'medium', 'high'] as const).map(p => (
                                            <Badge
                                                key={p}
                                                variant={priority === p ? (p === 'high' ? 'danger' : 'default') : 'outline'}
                                                className={`cursor-pointer capitalize px-3 py-1 ${priority !== p && p === 'high' ? 'text-red-500 border-red-200 hover:bg-red-50' : ''}`}
                                                onClick={() => setPriority(p)}
                                            >
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-4">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button disabled={!serviceType} onClick={() => setStep(3)}>Next Step</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-bold">Schedule & Assign</h2>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Date</label>
                                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">Start Time</label>
                                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium">End Time</label>
                                            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Assign Technician</label>
                                    <div className="grid grid-cols-1 gap-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
                                        {technicians.map(tech => (
                                            <div
                                                key={tech.id}
                                                onClick={() => setSelectedTech(tech)}
                                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-slate-50 transition-colors ${selectedTech?.id === tech.id ? 'bg-slate-100 ring-1 ring-slate-200' : ''}`}                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">
                                                        {tech.full_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-sm">{tech.full_name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-4">
                                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                <Button
                                    disabled={!selectedTech || !date || !startTime || !endTime || saving}
                                    className="bg-green-600 hover:bg-green-700 w-full ml-4"
                                    onClick={handleCreate}
                                >
                                    {saving ? 'Creating...' : 'Confirm & Create Job'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
