import { createClient } from '@/lib/supabase/client'

export interface InventoryItem {
    id: string
    name: string
    sku: string
    category: string
    quantity: number
    unit: string
    price: number
    image_url?: string
}

export const InventoryRepository = {
    async list(): Promise<InventoryItem[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching inventory:', error)
            return []
        }

        return (data || []).map(item => ({
            id: item.id,
            name: item.name,
            sku: item.sku || '',
            category: item.category || 'General',
            quantity: 0, // Quantity tracking not in current schema
            unit: item.unit,
            price: item.sale_price || 0,
            image_url: item.image_path
        }))
    },

    async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
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
            .from('inventory_items')
            .insert({
                org_id: profile.org_id,
                name: item.name,
                sku: item.sku,
                category: item.category,
                unit: item.unit,
                sale_price: item.price,
                taxable_default: true,
                active: true,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            sku: data.sku || '',
            category: data.category || 'General',
            quantity: 0,
            unit: data.unit,
            price: data.sale_price,
            image_url: data.image_path
        }
    }
}
