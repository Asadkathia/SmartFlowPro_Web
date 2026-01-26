import { createClient } from '@/lib/supabase/client'

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'cancelled'
export type JobPriority = 'low' | 'medium' | 'high'

export interface Job {
    id: string
    job_number: string
    customer_id: string
    customer_name: string
    service_type: string
    status: JobStatus
    priority: JobPriority
    scheduled_start: string
    scheduled_end: string
    technician_id?: string
    technician_name?: string
    location: string
    description?: string
}

export const JobRepository = {
    async list(): Promise<Job[]> {
        const supabase = createClient()

        const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select(`
                *,
                customer:customers(name),
                visits(
                    id,
                    scheduled_start,
                    scheduled_end,
                    status,
                    technician_id,
                    technician:users(full_name)
                )
            `)
            .order('created_at', { ascending: false })

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError)
            return []
        }

        return (jobs || []).map((j: any) => {
            const visit = j.visits?.[0]
            return {
                id: j.id,
                job_number: j.job_number,
                customer_id: j.customer_id,
                customer_name: j.customer?.name || 'Unknown',
                service_type: j.service_type,
                status: (visit?.status || 'pending') as JobStatus,
                priority: j.priority as JobPriority,
                scheduled_start: visit?.scheduled_start || new Date().toISOString(),
                scheduled_end: visit?.scheduled_end || new Date().toISOString(),
                technician_id: visit?.technician_id,
                technician_name: visit?.technician?.full_name,
                location: '',
                description: j.notes
            }
        })
    },

    async get(id: string): Promise<Job | undefined> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                customer:customers(name),
                visits(
                    id,
                    scheduled_start,
                    scheduled_end,
                    status,
                    technician_id,
                    technician:users(full_name)
                )
            `)
            .eq('id', id)
            .single()

        if (error || !data) return undefined

        const visit = data.visits?.[0]
        return {
            id: data.id,
            job_number: data.job_number,
            customer_id: data.customer_id,
            customer_name: data.customer?.name || 'Unknown',
            service_type: data.service_type,
            status: (visit?.status || 'pending') as JobStatus,
            priority: data.priority as JobPriority,
            scheduled_start: visit?.scheduled_start || new Date().toISOString(),
            scheduled_end: visit?.scheduled_end || new Date().toISOString(),
            technician_id: visit?.technician_id,
            technician_name: visit?.technician?.full_name,
            location: '',
            description: data.notes
        }
    },

    async create(job: Omit<Job, 'id' | 'job_number'>): Promise<Job> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')

        // Generate job number
        const { data: jobNumber, error: seqError } = await supabase.rpc('generate_job_number', {
            p_org_id: profile.org_id
        })

        if (seqError) {
            // Fallback if function doesn't exist
            const jobNum = `JOB-${Date.now()}`
            console.warn('Using fallback job number:', jobNum)
        }

        // Create job
        const { data: newJob, error: jobError } = await supabase
            .from('jobs')
            .insert({
                org_id: profile.org_id,
                job_number: jobNumber || `JOB-${Date.now()}`,
                customer_id: job.customer_id,
                service_type: job.service_type,
                priority: job.priority,
                notes: job.description
            })
            .select()
            .single()

        if (jobError) throw jobError

        // Create visit
        const { data: newVisit, error: visitError } = await supabase
            .from('visits')
            .insert({
                org_id: profile.org_id,
                job_id: newJob.id,
                technician_id: job.technician_id,
                scheduled_start: job.scheduled_start,
                scheduled_end: job.scheduled_end,
                status: job.status || 'scheduled'
            })
            .select()
            .single()

        if (visitError) throw visitError

        return {
            id: newJob.id,
            job_number: newJob.job_number,
            customer_id: newJob.customer_id,
            customer_name: job.customer_name,
            service_type: newJob.service_type,
            status: job.status,
            priority: newJob.priority as JobPriority,
            scheduled_start: job.scheduled_start,
            scheduled_end: job.scheduled_end,
            technician_id: job.technician_id,
            technician_name: job.technician_name,
            location: job.location,
            description: newJob.notes
        }
    },

    async updateStatus(id: string, status: JobStatus): Promise<void> {
        const supabase = createClient()

        // Update the visit status instead of job
        const { error } = await supabase
            .from('visits')
            .update({ status })
            .eq('job_id', id)

        if (error) throw error
    }
}
