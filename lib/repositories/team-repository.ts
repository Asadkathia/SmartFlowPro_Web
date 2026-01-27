import { createClient } from '@/lib/supabase/client'
import type { User, UserRole, EmployeeInvitation, UserStatus } from '@/lib/types/database'

// Re-export types for convenience
export type { User, UserRole, EmployeeInvitation, UserStatus }
export type TeamMember = User
export type TeamRole = UserRole

export interface InviteEmployeeParams {
    email: string
    full_name?: string
    phone?: string
    role: UserRole
}

export interface InviteEmployeeResult {
    invitation: EmployeeInvitation
    invite_link: string
}

export class TeamRepository {
    /**
     * List team members
     */
    static async list(): Promise<User[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('full_name', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch team members: ${error.message}`)
        }

        return (data as User[]) || []
    }

    /**
     * Invite employee (admin only)
     */
    static async invite(params: InviteEmployeeParams): Promise<InviteEmployeeResult> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')
        if (profile.role !== 'admin') {
            throw new Error('Only admins can invite employees')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(params.email)) {
            throw new Error('Invalid email format')
        }

        // Check if email already exists in org
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('org_id', profile.org_id)
            .eq('email', params.email)
            .single()

        if (existingUser) {
            throw new Error('User with this email already exists in your organization')
        }

        // Check for pending invitation
        const { data: existingInvite } = await supabase
            .from('employee_invitations')
            .select('id')
            .eq('org_id', profile.org_id)
            .eq('email', params.email)
            .eq('status', 'pending')
            .single()

        if (existingInvite) {
            throw new Error('Pending invitation already exists for this email')
        }

        // Generate secure token
        const token = crypto.randomUUID() + '-' + crypto.randomUUID()

        // Set expiry (7 days from now per PRD)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Create invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('employee_invitations')
            .insert({
                org_id: profile.org_id,
                email: params.email,
                full_name: params.full_name,
                phone: params.phone,
                // role column missing in schema
                invited_by: user.id,
                token,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single()

        if (inviteError) {
            throw new Error(`Failed to create invitation: ${inviteError.message}`)
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            entity: 'employee_invitations',
            entity_id: invitation.id,
            action: 'create',
            performed_by: user.id,
            payload: { email: params.email },
        })

        // Generate invite link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const inviteLink = `${appUrl}/accept-invite?token=${token}`

        return {
            invitation: invitation as EmployeeInvitation,
            invite_link: inviteLink,
        }
    }

    /**
     * Update team member (admin only)
     */
    static async update(id: string, updates: Partial<Pick<User, 'full_name' | 'phone' | 'role' | 'status'>>): Promise<User> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            throw new Error('Only admins can update team members')
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update team member: ${error.message}`)
        }

        return data as User
    }

    /**
     * Deactivate team member (admin only)
     */
    static async deactivate(id: string): Promise<User> {
        return this.update(id, { status: 'deactivated' })
    }
}
