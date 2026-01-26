import { createClient } from '@/lib/supabase/client'
import type { InventoryItem } from '@/lib/types/database'

export interface CreateInventoryItemParams {
    name: string
    sku?: string
    unit: string
    sale_price: number
    taxable_default?: boolean
    active?: boolean
    image_path?: string
    category?: string
    description?: string
}

export class InventoryRepository {
    /**
     * List inventory items
     */
    static async list(filters?: { active?: boolean; search?: string }): Promise<InventoryItem[]> {
        const supabase = createClient()

        let query = supabase
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true })

        if (filters?.active !== undefined) {
            query = query.eq('active', filters.active)
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch inventory items: ${error.message}`)
        }

        return (data as InventoryItem[]) || []
    }

    /**
     * Create inventory item
     */
    static async create(params: CreateInventoryItemParams): Promise<InventoryItem> {
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
                ...params,
                org_id: profile.org_id,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create inventory item: ${error.message}`)
        }

        return data as InventoryItem
    }

    /**
     * Update inventory item
     */
    static async update(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'org_id' | 'created_at'>>): Promise<InventoryItem> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update inventory item: ${error.message}`)
        }

        return data as InventoryItem
    }

    /**
     * Delete inventory item (admin only)
     */
    static async delete(id: string): Promise<void> {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            throw new Error('Only admins can delete inventory items')
        }

        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Failed to delete inventory item: ${error.message}`)
        }
    }
}
