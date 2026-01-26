import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types/database'

export type TeamRole = UserRole
export type TeamStatus = 'active' | 'suspended' | 'deactivated' | 'invited'

export interface TeamMember {
    id: string
    full_name: string
    email: string
    phone: string
    role: TeamRole
    status: TeamStatus
    avatar_url?: string
}

export interface InviteEmployeeParams {
    email: string
    full_name?: string
    phone?: string
    role: TeamRole
}

export const TeamRepository = {
    async list(): Promise<TeamMember[]> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone, role, status')
            .neq('status', 'deactivated')
            .order('full_name', { ascending: true })

        if (error) {
            console.error('Error fetching team:', error)
            return []
        }

        // Fetch pending invitations as well
        const { data: invitations } = await supabase
            .from('employee_invitations')
            .select('*')
            .eq('status', 'pending')

        const members: TeamMember[] = (data || []).map(u => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            phone: u.phone || '',
            role: u.role as TeamRole,
            status: u.status as TeamStatus,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=random`
        }))

        const invitedMembers: TeamMember[] = (invitations || []).map(i => ({
            id: i.id,
            full_name: i.full_name || 'Invited User',
            email: i.email,
            phone: i.phone || '',
            role: 'technician', // Default or fetch if stored
            status: 'invited',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(i.email)}&background=random`
        }))

        return [...members, ...invitedMembers]
    },

    async invite(member: InviteEmployeeParams): Promise<void> {
        // Implementation adapted from team-repository.ts logic
        // For now, simpler insertion into invitations table
        const supabase = createClient()

        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', member.email)
            .single()

        if (existingUser) throw new Error('User already exists')

        // 2. Create Invitation
        const token = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const { error } = await supabase
            .from('employee_invitations')
            .insert({
                email: member.email,
                full_name: member.full_name,
                phone: member.phone,
                token,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
                invited_by: (await supabase.auth.getUser()).data.user?.id
            })

        if (error) throw error
    }
}
