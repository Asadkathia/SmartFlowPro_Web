import { createClient } from '@/lib/supabase/client'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced'
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue' | 'void'

export interface Quote {
    id: string
    quote_number: string
    customer_name: string
    title: string
    value: number
    status: QuoteStatus
    created_at: string
    expiry_date: string
}

export interface Invoice {
    id: string
    invoice_number: string
    customer_name: string
    customer_email: string
    customer_address: string
    issue_date: string
    due_date: string
    items: InvoiceItem[]
    subtotal: number
    tax: number
    total: number
    status: InvoiceStatus
}

export interface InvoiceItem {
    description: string
    qty: number
    unit_price: number
    total: number
}

export const QuoteRepository = {
    async list(): Promise<Quote[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('quotes')
            .select(`
                *,
                visit:visits(
                    job:jobs(
                        customer:customers(name)
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching quotes:', error)
            return []
        }

        return (data || []).map((q: any) => ({
            id: q.id,
            quote_number: q.quote_number,
            customer_name: q.visit?.job?.customer?.name || 'Unknown',
            title: q.notes || 'Quote',
            value: q.grand_total || 0,
            status: (q.status || 'draft') as QuoteStatus,
            created_at: q.created_at,
            expiry_date: q.expiration_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
    },

    async create(quote: Omit<Quote, 'id' | 'quote_number' | 'status'>): Promise<Quote> {
        const supabase = createClient()

        // For now, return a placeholder since quotes require a visit_id
        // This would need proper visit creation flow
        throw new Error('Quote creation requires a visit. Please create a job first.')
    }
}

export const InvoiceRepository = {
    async list(): Promise<Invoice[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching invoices:', error)
            return []
        }

        return (data || []).map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            customer_name: inv.customer_name || 'Unknown',
            customer_email: inv.customer_email || '',
            customer_address: inv.property_address || '',
            issue_date: inv.created_at,
            due_date: inv.due_date || '',
            items: [],
            subtotal: inv.subtotal || 0,
            tax: inv.tax_amount || 0,
            total: inv.total || 0,
            status: (inv.status || 'draft') as InvoiceStatus
        }))
    },

    async get(id: string): Promise<Invoice | undefined> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return undefined

        return {
            id: data.id,
            invoice_number: data.invoice_number,
            customer_name: data.customer_name || 'Unknown',
            customer_email: data.customer_email || '',
            customer_address: data.property_address || '',
            issue_date: data.created_at,
            due_date: data.due_date || '',
            items: [],
            subtotal: data.subtotal || 0,
            tax: data.tax_amount || 0,
            total: data.total || 0,
            status: (data.status || 'draft') as InvoiceStatus
        }
    },

    async create(invoice: Omit<Invoice, 'id' | 'invoice_number' | 'status'>): Promise<Invoice> {
        const supabase = createClient()

        // For now, return a placeholder since invoices require a visit_id
        throw new Error('Invoice creation requires a visit. Please create a job first.')
    }
}
