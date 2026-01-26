import { createClient } from '@/lib/supabase/client'
import type { Visit, VisitStatus } from '@/lib/types/database'

export interface CreateVisitParams {
    job_id: string
    technician_id: string
    scheduled_start: string
    scheduled_end: string
}

export interface UpdateVisitParams {
    scheduled_start?: string
    scheduled_end?: string
    status?: VisitStatus
    actual_start?: string
    actual_end?: string
}

export class VisitRepository {
    /**
     * List visits with filters
     */
    static async list(filters?: {
        jobId?: string
        technicianId?: string
        status?: VisitStatus
        startDate?: string
        endDate?: string
    }): Promise<Visit[]> {
        const supabase = createClient()

        let query = supabase
            .from('visits')
            .select('*, job:jobs(*), technician:users(*)')
            .order('scheduled_start', { ascending: true })

        if (filters?.jobId) {
            query = query.eq('job_id', filters.jobId)
        }
        if (filters?.technicianId) {
            query = query.eq('technician_id', filters.technicianId)
        }
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }
        if (filters?.startDate) {
            query = query.gte('scheduled_start', filters.startDate)
        }
        if (filters?.endDate) {
            query = query.lte('scheduled_end', filters.endDate)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch visits: ${error.message}`)
        }

        return (data as any[]) || []
    }

    /**
     * Create a new visit
     */
    static async create(params: CreateVisitParams): Promise<Visit> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')

        const { data, error } = await supabase
            .from('visits')
            .insert({
                ...params,
                org_id: profile.org_id,
                status: 'scheduled',
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create visit: ${error.message}`)
        }

        return data as Visit
    }

    /**
     * Update a visit
     */
    static async update(id: string, updates: UpdateVisitParams): Promise<Visit> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('visits')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update visit: ${error.message}`)
        }

        return data as Visit
    }

    /**
     * Cancel a visit
     */
    static async cancel(id: string, reason?: string): Promise<Visit> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single()

        const { data, error } = await supabase
            .from('visits')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to cancel visit: ${error.message}`)
        }

        // Create audit log
        if (profile) {
            await supabase.from('audit_logs').insert({
                org_id: profile.org_id,
                entity: 'visits',
                entity_id: id,
                action: 'cancel',
                performed_by: user.id,
                payload: { reason },
            })
        }

        return data as Visit
    }
}
