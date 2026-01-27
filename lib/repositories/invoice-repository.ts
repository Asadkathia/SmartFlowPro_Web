import { createClient } from '@/lib/supabase/client'
import type { Invoice, InvoiceStatus } from '@/lib/types/database'

// Re-export types
export type { Invoice, InvoiceStatus }

export interface ListInvoicesParams {
    status?: InvoiceStatus
    customerId?: string
    startDate?: string
    endDate?: string
}

export class InvoiceRepository {
    /**
     * List invoices with filters
     */
    static async list(params: ListInvoicesParams = {}): Promise<Invoice[]> {
        const supabase = createClient()

        let query = supabase
            .from('invoices')
            .select('*, visit:visits(*), payments(*)')
            .order('created_at', { ascending: false })

        if (params.status) {
            query = query.eq('status', params.status)
        }
        if (params.startDate) {
            query = query.gte('created_at', params.startDate)
        }
        if (params.endDate) {
            query = query.lte('created_at', params.endDate)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`)
        }

        return (data as any[]) || []
    }

    /**
     * Get invoice by ID
     */
    static async getById(id: string): Promise<any | null> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('invoices')
            .select('*, visit:visits(*, job:jobs(*, customer:customers(*, properties(*)))), quote:quotes(*), payments(*), items:invoice_items(*)')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch invoice: ${error.message}`)
        }

        return data
    }

    /**
     * Void an invoice (admin only)
     */
    static async void(id: string, reason?: string): Promise<Invoice> {
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
            throw new Error('Only admins can void invoices')
        }

        const { data, error } = await supabase
            .from('invoices')
            .update({ status: 'void' })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to void invoice: ${error.message}`)
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            entity: 'invoices',
            entity_id: id,
            action: 'void',
            performed_by: user.id,
            payload: { reason },
        })

        return data as Invoice
    }
}
