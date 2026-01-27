import { createClient } from '@/lib/supabase/client'
import type { Customer, Property } from '@/lib/types/database'

// Re-export types for convenience
export type { Customer, Property }

export interface CustomerWithProperties extends Customer {
    properties: Property[]
}

export interface ListCustomersParams {
    page?: number
    pageSize?: number
    search?: string
}

export interface ListCustomersResult {
    data: CustomerWithProperties[]
    count: number
    page: number
    pageSize: number
    hasMore: boolean
}

export class CustomerRepository {
    /**
     * List customers with pagination and search
     */
    static async list(params: ListCustomersParams = {}): Promise<ListCustomersResult> {
        const { page = 1, pageSize = 20, search = '' } = params
        const offset = (page - 1) * pageSize

        const supabase = createClient()

        // Get current user's org_id (RLS will enforce this automatically)
        let query = supabase
            .from('customers')
            .select('*, properties(*)', { count: 'exact' })
            .order('name', { ascending: true })
            .range(offset, offset + pageSize - 1)

        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to fetch customers: ${error.message}`)
        }

        return {
            data: (data as CustomerWithProperties[]) || [],
            count: count || 0,
            page,
            pageSize,
            hasMore: (offset + pageSize) < (count || 0),
        }
    }

    /**
     * Get single customer by ID
     */
    static async getById(id: string): Promise<CustomerWithProperties | null> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('customers')
            .select('*, properties(*)')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null // Not found
            }
            throw new Error(`Failed to fetch customer: ${error.message}`)
        }

        return data as CustomerWithProperties
    }

    /**
     * Create a new customer
     */
    static async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'org_id'>): Promise<Customer> {
        const supabase = createClient()

        // Get current user to get org_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('org_id')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('User profile not found')

        const { data, error } = await supabase
            .from('customers')
            .insert({
                ...customer,
                org_id: profile.org_id,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create customer: ${error.message}`)
        }

        return data as Customer
    }

    /**
     * Update a customer
     */
    static async update(id: string, updates: Partial<Omit<Customer, 'id' | 'org_id' | 'created_at'>>): Promise<Customer> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update customer: ${error.message}`)
        }

        return data as Customer
    }
}
