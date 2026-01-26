// User roles matching mobile app
export type UserRole = 'admin' | 'dispatcher' | 'accountant' | 'technician'

// User status
export type UserStatus = 'active' | 'suspended' | 'deactivated'

// Visit status
export type VisitStatus = 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

// Quote status
export type QuoteStatus = 'draft' | 'finalized' | 'invoiced'

// Invoice status
export type InvoiceStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'void' | 'refunded'

// Payment method
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'stripe_link'

// Database types
export interface User {
    id: string
    org_id: string
    full_name: string
    email: string
    phone?: string
    role: UserRole
    status: UserStatus
    created_at: string
    updated_at: string
}

export interface Customer {
    id: string
    org_id: string
    name: string
    email?: string
    phone?: string
    created_at: string
    updated_at: string
}

export interface Property {
    id: string
    org_id: string
    customer_id: string
    address: string
    city?: string
    state?: string
    zip_code?: string
    latitude?: number
    longitude?: number
    created_at: string
}

export interface Job {
    id: string
    org_id: string
    job_number: string
    customer_id: string
    service_type: string
    priority: 'low' | 'medium' | 'high'
    notes?: string
    created_at: string
    updated_at: string
}

export interface Visit {
    id: string
    org_id: string
    job_id: string
    technician_id: string
    scheduled_start: string
    scheduled_end: string
    actual_start?: string
    actual_end?: string
    status: VisitStatus
    created_at: string
    updated_at: string
}

export interface Quote {
    id: string
    org_id: string
    visit_id: string
    quote_number: string
    status: QuoteStatus
    taxable: boolean
    subtotal: number
    discount_total: number
    tax_total: number
    grand_total: number
    created_at: string
    updated_at: string
}

export interface Invoice {
    id: string
    org_id: string
    visit_id: string
    quote_id?: string
    invoice_number: string
    status: InvoiceStatus
    total: number
    due_date?: string
    created_at: string
    updated_at: string
}

export interface Payment {
    id: string
    org_id: string
    invoice_id: string
    amount: number
    method: PaymentMethod
    reference?: string
    received_by: string
    received_at: string
    created_at: string
}

export interface InventoryItem {
    id: string
    org_id: string
    name: string
    sku?: string
    unit: string
    sale_price: number
    taxable_default: boolean
    active: boolean
    image_path?: string
    category?: string
    description?: string
    ai_suggested_price?: number
    created_by?: string
    version: number
    updated_at: string
    created_at: string
}

export interface EmployeeInvitation {
    id: string
    org_id: string
    email: string
    full_name?: string
    phone?: string
    invited_by: string
    token: string
    status: 'pending' | 'accepted' | 'expired'
    expires_at: string
    created_at: string
}
