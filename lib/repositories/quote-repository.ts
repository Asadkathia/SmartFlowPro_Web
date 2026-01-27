import { createClient } from '@/lib/supabase/client'
import type { Quote, QuoteStatus } from '@/lib/types/database'

// Re-export types
export type { Quote, QuoteStatus }

export class QuoteRepository {
    /**
     * List quotes with filters
     */
    static async list(filters?: { status?: QuoteStatus }): Promise<any[]> {
        const supabase = createClient()

        let query = supabase
            .from('quotes')
            .select(`
                *,
                visit:visits (
                    *,
                    job:jobs (
                        *,
                        customer:customers (*)
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get quote by ID
     */
    static async getById(id: string): Promise<any | null> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('quotes')
            .select(`
                *,
                visit:visits (
                    *,
                    job:jobs (
                        *,
                        customer:customers (*)
                    )
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch quote: ${error.message}`)
        }

        return data
    }
}
