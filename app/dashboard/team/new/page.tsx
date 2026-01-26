'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamRepository, TeamRole } from "@/lib/repositories/TeamRepository"

export default function InviteMemberPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<TeamRole>("technician")

    async function handleInvite() {
        if (!name || !email) return
        setSaving(true)
        await TeamRepository.invite({
            full_name: name,
            email,
            phone: '',
            role
        })
        setSaving(false)
        router.push('/dashboard/team')
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Link href="/dashboard/team" className="hover:text-primary hover:underline">Team</Link>
                <span>/</span>
                <span>Invite Member</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Invite Team Member</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Member Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input placeholder="john@smartflow.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <div className="flex gap-2">
                            {(['technician', 'dispatcher', 'admin', 'accountant'] as const).map(r => (
                                <Button
                                    key={r}
                                    variant={role === r ? 'default' : 'outline'}
                                    className="capitalize"
                                    onClick={() => setRole(r)}
                                >
                                    {r}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={!name || !email || saving}>
                            {saving ? 'Sending Invite...' : 'Send Invite'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
