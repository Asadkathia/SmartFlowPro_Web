'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { TeamRepository, type TeamMember, type TeamRole, type UserStatus } from "@/lib/repositories/team-repository"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Plus, User, Phone, Mail, Shield, UserX, UserCheck } from "lucide-react"
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

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const data = await TeamRepository.list()
            setMembers(data)
        } catch (error) {
            console.error("Failed to load team members", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    )

    const handleRowClick = (member: TeamMember) => {
        setSelectedMember(member)
        setIsDrawerOpen(true)
    }

    const statusColors: Record<UserStatus, "success" | "secondary" | "danger"> = {
        active: "success",
        suspended: "secondary",
        deactivated: "danger"
    }

    const roleColors: Record<TeamRole, "default" | "outline" | "secondary"> = {
        admin: "default",
        technician: "outline",
        dispatcher: "secondary",
        accountant: "secondary"
    }

    const columns = [
        {
            key: "member",
            header: "Member",
            render: (member: TeamMember) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {member.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{member.full_name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: "role",
            header: "Role",
            render: (member: TeamMember) => (
                <Badge variant={roleColors[member.role]}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
            )
        },
        {
            key: "contact",
            header: "Phone",
            render: (member: TeamMember) => (
                <span className="text-slate-600 font-mono text-xs">
                    {member.phone || "—"}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (member: TeamMember) => (
                <Badge variant={statusColors[member.status]}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <PageHeader
                title="Team"
                subtitle="Manage your team members and permissions."
                actions={
                    <Link href="/dashboard/team/new">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Invite Member
                        </Button>
                    </Link>
                }
            />

            <FilterBar
                searchPlaceholder="Search team members..."
                searchValue={search}
                onSearchChange={setSearch}
            />

            <DataTable
                columns={columns}
                data={filteredMembers}
                loading={loading}
                getRowKey={(member) => member.id}
                onRowClick={handleRowClick}
                rowActions={() => (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                )}
                emptyState={
                    <EmptyState
                        icon={User}
                        title="No team members found"
                        description={search ? "Try adjusting your search" : "Invite your first team member to get started"}
                        action={!search ? {
                            label: "Invite Member",
                            onClick: () => window.location.href = "/dashboard/team/new"
                        } : undefined}
                    />
                }
                className="border-none rounded-none"
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Member Profile</DrawerTitle>
                        <DrawerDescription>
                            Detailed information and permissions for this team member.
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerBody>
                        {selectedMember && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                                        {selectedMember.full_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedMember.full_name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant={roleColors[selectedMember.role]}>
                                                {selectedMember.role}
                                            </Badge>
                                            <Badge variant={statusColors[selectedMember.status]}>
                                                {selectedMember.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900">Contact Information</h4>
                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            {selectedMember.email}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            {selectedMember.phone || "No phone number"}
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions/Role Info */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-slate-500" />
                                        Role & Access
                                    </h4>
                                    <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                                        <p className="font-medium text-slate-900 capitalize">{selectedMember.role}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {selectedMember.role === 'admin' && "Has full access to all settings, billing, and team management."}
                                            {selectedMember.role === 'technician' && "Can view assigned jobs, schedule, and complete invoices."}
                                            {selectedMember.role === 'dispatcher' && "Can schedule jobs, manage customers, and view reports."}
                                            {selectedMember.role === 'accountant' && "Can view invoices, quotes, and financial reports."}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-semibold text-slate-900">Actions</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <UserCheck className="w-4 h-4" />
                                            Edit Profile
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <UserX className="w-4 h-4" />
                                            Deactivate
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
