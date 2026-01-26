import { createClient } from '@/lib/supabase/client'

export interface Customer {
    id: string
    name: string
    email: string
    phone: string
    status: 'active' | 'inactive'
    properties: Property[]
}

export interface Property {
    id: string
    address: string
    city: string
    state: string
    zip: string
}

export const CustomerRepository = {
    async list(): Promise<Customer[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('customers')
            .select('*, properties(*)')
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching customers:', error)
            return []
        }

        return (data || []).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            status: 'active' as const,
            properties: (c.properties || []).map((p: any) => ({
                id: p.id,
                address: p.address,
                city: '',
                state: '',
                zip: ''
            }))
        }))
    },

    async get(id: string): Promise<Customer | undefined> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('customers')
            .select('*, properties(*)')
            .eq('id', id)
            .single()

        if (error || !data) return undefined

        return {
            id: data.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            status: 'active',
            properties: (data.properties || []).map((p: any) => ({
                id: p.id,
                address: p.address,
                city: '',
                state: '',
                zip: ''
            }))
        }
    },

    async create(customer: Omit<Customer, 'id' | 'status'>): Promise<Customer> {
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
            .from('customers')
            .insert({
                org_id: profile.org_id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            status: 'active',
            properties: []
        }
    }
}
