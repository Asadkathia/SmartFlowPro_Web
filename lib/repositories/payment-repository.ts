import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentMethod, Invoice } from '@/lib/types/database'

export interface RecordPaymentParams {
    invoice_id: string
    amount: number
    method: PaymentMethod
    reference?: string
    received_at?: string
}

export interface RecordPaymentResult {
    payment: Payment
    invoice_status: string
    remaining_balance: number
}

export class PaymentRepository {
    /**
     * Record a payment (admin/accountant only - RLS enforces this)
     */
    static async record(params: RecordPaymentParams): Promise<RecordPaymentResult> {
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

        // Validate role
        if (!['admin', 'accountant'].includes(profile.role)) {
            throw new Error('Only admin or accountant can record payments')
        }

        // Validate amount
        if (params.amount <= 0) {
            throw new Error('Payment amount must be greater than zero')
        }

        // Get invoice and calculate remaining balance
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*, payments(amount)')
            .eq('id', params.invoice_id)
            .eq('org_id', profile.org_id)
            .single()

        if (invoiceError || !invoice) {
            throw new Error('Invoice not found')
        }

        // Calculate paid amount
        const paidAmount = (invoice.payments as any[])?.reduce((sum, p) => sum + p.amount, 0) || 0
        const remainingBalance = invoice.total - paidAmount

        // Validate payment doesn't exceed remaining balance
        if (params.amount > remainingBalance) {
            throw new Error(`Payment amount exceeds remaining balance of $${remainingBalance.toFixed(2)}`)
        }

        // Record payment
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                org_id: profile.org_id,
                invoice_id: params.invoice_id,
                amount: params.amount,
                method: params.method,
                reference: params.reference,
                received_by: user.id,
                received_at: params.received_at || new Date().toISOString(),
            })
            .select()
            .single()

        if (paymentError) {
            throw new Error(`Failed to record payment: ${paymentError.message}`)
        }

        // Update invoice status
        const newPaidAmount = paidAmount + params.amount
        let newStatus = invoice.status

        if (newPaidAmount >= invoice.total) {
            newStatus = 'paid'
        } else if (newPaidAmount > 0) {
            newStatus = 'partially_paid'
        }

        if (newStatus !== invoice.status) {
            await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', params.invoice_id)
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            entity: 'payments',
            entity_id: payment.id,
            action: 'create',
            performed_by: user.id,
            payload: {
                invoice_id: params.invoice_id,
                amount: params.amount,
                method: params.method,
                new_status: newStatus,
            },
        })

        return {
            payment: payment as Payment,
            invoice_status: newStatus,
            remaining_balance: invoice.total - newPaidAmount,
        }
    }

    /**
     * List payments for an invoice
     */
    static async listByInvoice(invoiceId: string): Promise<Payment[]> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('received_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch payments: ${error.message}`)
        }

        return (data as Payment[]) || []
    }
}
