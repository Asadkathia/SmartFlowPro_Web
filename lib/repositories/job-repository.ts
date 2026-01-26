import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/lib/types/database'

export interface CreateJobParams {
    customer_id: string
    service_type: string
    priority?: 'low' | 'medium' | 'high'
    notes?: string
}

export class JobRepository {
    /**
     * List jobs with optional filters
     */
    static async list(filters?: { customerId?: string; status?: string }): Promise<Job[]> {
        const supabase = createClient()

        let query = supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })

        if (filters?.customerId) {
            query = query.eq('customer_id', filters.customerId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch jobs: ${error.message}`)
        }

        return (data as Job[]) || []
    }

    /**
     * Get job by ID with related data
     */
    static async getById(id: string): Promise<Job | null> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('jobs')
            .select('*, visits(*), customer:customers(*)')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch job: ${error.message}`)
        }

        return data as any // Extended type with relations
    }

    /**
     * Create a new job (admin only - RLS enforces this)
     */
    static async create(params: CreateJobParams): Promise<Job> {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')
        if (profile.role !== 'admin') {
            throw new Error('Only admins can create jobs')
        }

        // Generate job number using database function
        const { data: jobNumber, error: seqError } = await supabase.rpc('generate_job_number', {
            p_org_id: profile.org_id
        })

        if (seqError) {
            throw new Error(`Failed to generate job number: ${seqError.message}`)
        }

        // Create job
        const { data, error } = await supabase
            .from('jobs')
            .insert({
                org_id: profile.org_id,
                job_number: jobNumber,
                customer_id: params.customer_id,
                service_type: params.service_type,
                priority: params.priority || 'medium',
                notes: params.notes,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create job: ${error.message}`)
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            entity: 'jobs',
            entity_id: data.id,
            action: 'create',
            performed_by: user.id,
            payload: { job_number: jobNumber, customer_id: params.customer_id },
        })

        return data as Job
    }
}
