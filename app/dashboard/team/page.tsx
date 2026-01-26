'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { TeamRepository, type TeamMember, type TeamRole } from "@/lib/repositories/TeamRepository"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await TeamRepository.list()
            setMembers(data)
        } finally {
            setLoading(false)
        }
    }

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.full_name.toLowerCase().includes(search.toLowerCase()) ||
            member.email.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === 'all' || member.role === roleFilter
        return matchesSearch && matchesRole
    })

    const roleColors: Record<TeamRole, "info" | "warning" | "default" | "secondary" | "success" | "danger" | "outline"> = {
        admin: "default", // or "purple" if we had it
        dispatcher: "warning", // Orange
        technician: "info", // Blue
        accountant: "secondary"
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Team Directory</h1>
                    <p className="text-slate-500">Manage your technicians and office staff.</p>
                </div>
                <Link href="/dashboard/team/new">
                    <Button className="gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Invite Member
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
                        placeholder="Search by name or email..."
                        className="pl-10 border-none bg-slate-50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {(['all', 'technician', 'dispatcher', 'admin'] as const).map((role) => (
                        <Button
                            key={role}
                            variant={roleFilter === role ? "default" : "outline"}
                            size="sm"
                            className="capitalize"
                            onClick={() => setRoleFilter(role)}
                        >
                            {role}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading team...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMembers.map((member) => (
                        <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                            <div className="p-6 flex flex-col items-center text-center gap-4 border-b border-slate-100 relative">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-slate-400 hover:text-primary">
                                        <span className="material-symbols-outlined">more_horiz</span>
                                    </button>
                                </div>
                                <div className="relative">
                                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                                        <AvatarImage src={member.avatar_url} />
                                        <AvatarFallback>{member.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {member.status === 'active' && (
                                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{member.full_name}</h3>
                                    <Badge variant={roleColors[member.role] || "outline"} className="mt-2 capitalize">
                                        {member.role}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                                    {member.phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <span className="material-symbols-outlined text-[18px] text-primary">mail</span>
                                    <span className="truncate">{member.email}</span>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between border-t border-slate-100">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-xs font-medium",
                                        member.status === 'active' ? "text-slate-700" : "text-slate-400"
                                    )}>
                                        {member.status === 'active' ? "Active" : "Inactive"}
                                    </span>
                                    {/* Toggle Switch Mock */}
                                    <div className={cn(
                                        "w-10 h-6 rounded-full relative transition-colors cursor-pointer",
                                        member.status === 'active' ? "bg-primary" : "bg-slate-200"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                                            member.status === 'active' ? "translate-x-4" : "translate-x-0"
                                        )}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function cn(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
