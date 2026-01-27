import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/lib/types/database'

// Re-export types for convenience
export type { Job }
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'cancelled'

export interface CreateJobParams {
    customer_id: string
    service_type: string
    priority?: 'low' | 'medium' | 'high'
    notes?: string
    description?: string // maps to notes
    scheduled_start?: string
    scheduled_end?: string
    technician_id?: string
    technician_name?: string
    customer_name?: string // Included for type compatibility
    location?: string
    status?: string
}

export class JobRepository {
    /**
     * List jobs with optional filters
     */
    static async list(filters?: { customerId?: string; status?: string }): Promise<any[]> {
        const supabase = createClient()

        let query = supabase
            .from('jobs')
            .select('*, customer:customers(name), visits(status, scheduled_start, scheduled_end, technician:users(full_name))')
            .order('created_at', { ascending: false })

        if (filters?.customerId) {
            query = query.eq('customer_id', filters.customerId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch jobs: ${error.message}`)
        }

        const mappedData = (data || []).map((job: any) => {
            const primaryVisit = job.visits?.[0]
            return {
                ...job,
                customer_name: job.customer?.name,
                status: primaryVisit?.status || 'pending',
                scheduled_start: primaryVisit?.scheduled_start,
                scheduled_end: primaryVisit?.scheduled_end,
                technician_name: primaryVisit?.technician?.full_name
            }
        })

        if (filters?.status) {
            return mappedData.filter(job => job.status === filters.status)
        }

        return mappedData
    }

    /**
     * Get job by ID with related data
     */
    static async getById(id: string): Promise<any | null> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('jobs')
            .select('*, visits(*, technician:users(*)), customer:customers(*, properties(*))')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch job: ${error.message}`)
        }

        return data
    }

    /**
     * Create a new job and optional visit
     */
    static async create(params: CreateJobParams): Promise<Job> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')

        // Generate a simple job number (in production this should be a sequence or function)
        const jobNumber = `JOB-${Date.now().toString().slice(-6)}`

        const { data: job, error } = await supabase
            .from('jobs')
            .insert({
                org_id: profile.org_id,
                job_number: jobNumber,
                customer_id: params.customer_id,
                service_type: params.service_type,
                priority: params.priority || 'medium',
                notes: params.notes || params.description,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create job: ${error.message}`)
        }

        // Create visit if schedule is provided
        if (params.scheduled_start && params.scheduled_end) {
            const { error: visitError } = await supabase
                .from('visits')
                .insert({
                    org_id: profile.org_id,
                    job_id: job.id,
                    technician_id: params.technician_id,
                    scheduled_start: params.scheduled_start,
                    scheduled_end: params.scheduled_end,
                    status: (params.status as any) || 'scheduled'
                })

            if (visitError) {
                console.error("Failed to create visit for job", visitError)
            }
        }

        return job
    }
}
