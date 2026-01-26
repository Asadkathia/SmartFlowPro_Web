# Repository API Schema Requirements

This document maps each repository method to the exact database schema requirements.

## 1. CustomerRepository

### Schema Requirements
```typescript
customers table:
  - id: UUID (auto-generated)
  - org_id: UUID (auto-set via RLS/repository)
  - name: TEXT (required)
  - email: TEXT (optional)
  - phone: TEXT (optional)
  - address: TEXT (optional)
  - created_at: TIMESTAMP (auto)
  - updated_at: TIMESTAMP (auto)
```

### create() Method
**Current Parameters:**
```typescript
{
  name: string;          // REQUIRED
  phone?: string;        // OPTIONAL
  email?: string;        // OPTIONAL
  preferred_contact_method?: string; // REMOVE - not in schema
}
```

**Fix Required:** Remove `preferred_contact_method` field (doesn't exist in schema)

### Test Data Template
```javascript
{
  name: "John Smith",
  phone: "555-0101",
  email: "john@example.com"
}
```

---

## 2. JobRepository

### Schema Requirements
```typescript
jobs table:
  - id: UUID (auto)
  - org_id: UUID (auto-set)
  - customer_id: UUID (required - FK to customers)
  - job_number: TEXT (auto-generated via trigger)
  - service_type: TEXT (required)
  - priority: TEXT (required: 'low', 'medium', 'high')
  - status: TEXT (default: 'pending')
  - notes: TEXT (optional)
  - scheduled_date: DATE (optional)
  - created_at: TIMESTAMP (auto)
```

### create() Method - RLS: Admin Only
**Current Parameters:**
```typescript
{
  customer_id: string;   // REQUIRED - must exist in customers table
  service_type: string;  // REQUIRED
  priority: string;      // REQUIRED ('low'|'medium'|'high')
  notes?: string;        // OPTIONAL
}
```

**Missing:** scheduled_date field

### Test Data Template
```javascript
{
  customer_id: "<valid-customer-uuid>",
  service_type: "Plumbing",
  priority: "medium",
  notes: "Test job created",
  scheduled_date: "2026-01-25" // Add this
}
```

---

## 3. VisitRepository

### Schema Requirements
```typescript
visits table:
  - id: UUID (auto)
  - job_id: UUID (required - FK to jobs)
  - technician_id: UUID (optional - FK to users)
  - scheduled_start: TIMESTAMP (required)
  - scheduled_end: TIMESTAMP (required)
  - actual_start: TIMESTAMP (optional)
  - actual_end: TIMESTAMP (optional)
  - status: visit_status enum (required)
  - notes: TEXT (optional)
  - created_at: TIMESTAMP (auto)
```

### create() Method
**Current Parameters:**
```typescript
{
  job_id: string;              // REQUIRED
  scheduled_start: string;     // REQUIRED (ISO timestamp)
  scheduled_end: string;       // REQUIRED (ISO timestamp)
  status?: string;             // REMOVE - should not be set on create (defaults to 'scheduled')
}
```

**Fix Required:** Remove status from create params (auto-defaults to 'scheduled')

### Test Data Template
```javascript
{
  job_id: "<valid-job-uuid>",
  scheduled_start: "2026-01-25T09:00:00Z",
  scheduled_end: "2026-01-25T11:00:00Z"
  // status removed - auto-defaults
}
```

---

## 4. InvoiceRepository

### Schema Requirements
```typescript
invoices table:
  - id: UUID (auto)
  - org_id: UUID (auto-set)
  - job_id: UUID (required - FK to jobs)
  - invoice_number: TEXT (auto-generated)
  - status: invoice_status ('unpaid'|'partial'|'paid'|'void')
  - subtotal: DECIMAL (required)
  - tax: DECIMAL (required)
  - total: DECIMAL (required)
  - amount_paid: DECIMAL (default: 0)
  - due_date: DATE (optional)
  - created_at: TIMESTAMP (auto)
```

### void() Method - RLS: Admin Only
**Parameters:**
```typescript
invoiceId: string  // Must exist and be owned by user's org
```

**Side Effect:** Sets status = 'void'

---

## 5. PaymentRepository

### Schema Requirements
```typescript
payments table:
  - id: UUID (auto)
  - invoice_id: UUID (required - FK to invoices)
  - amount: DECIMAL (required, must be > 0, cannot exceed remaining balance)
  - method: payment_method ('cash'|'check'|'card'|'bank_transfer')
  - reference: TEXT (optional)
  - received_at: TIMESTAMP (required)
  - recorded_by: UUID (auto-set to current user)
  - created_at: TIMESTAMP (auto)
```

### recordPayment() Method - RLS: Admin/Accountant Only
**Current Parameters:**
```typescript
{
  invoice_id: string;     // REQUIRED
  amount: number;         // REQUIRED (> 0, <= invoice.remaining)
  method: string;         // REQUIRED
  reference?: string;     // OPTIONAL
  received_at: string;    // REQUIRED (ISO timestamp)
}
```

**Validation:** Must check that amount doesn't exceed (invoice.total - invoice.amount_paid)

### Test Data Template
```javascript
{
  invoice_id: "<valid-invoice-uuid>",
  amount: 100.00,
  method: "cash",
  reference: "CASH-001",
  received_at: new Date().toISOString()
}
```

---

## 6. TeamRepository

### Schema Requirements
```typescript
employee_invitations table:
  - id: UUID (auto)
  - org_id: UUID (auto-set)
  - email: TEXT (required, unique per org)
  - role: user_role (required: 'admin'|'dispatcher'|'accountant'|'technician')
  - invited_by: UUID (auto-set)
  - status: TEXT (default: 'pending')
  - created_at: TIMESTAMP (auto)

users table:
  - id: UUID (from auth.users)
  - org_id: UUID
  - email: TEXT
  - full_name: TEXT
  - role: user_role
  - is_active: BOOLEAN (default: true)
```

### invite() Method - RLS: Admin Only
**Current Parameters:**
```typescript
{
  email: string;   // REQUIRED, must be unique
  role: string;    // REQUIRED ('admin'|'dispatcher'|'accountant')
  name?: string;   // OPTIONAL (for user table after signup)
}
```

**Validation:** Check email doesn't already exist in users or pending invitations

### Test Data Template
```javascript
{
  email: "newuser@example.com",
  role: "dispatcher",
  name: "New Employee"
}
```

---

## 7. InventoryRepository

### Schema Requirements
```typescript
inventory_items table:
  - id: UUID (auto)
  - org_id: UUID (auto-set)
  - name: TEXT (required)
  - sku: TEXT (required, unique per org)
  - category: TEXT (optional)
  - unit_price: DECIMAL (required)
  - quantity_in_stock: INTEGER (default: 0)
  - is_active: BOOLEAN (default: true)
  - created_at: TIMESTAMP (auto)
  - updated_at: TIMESTAMP (auto)
```

### create() Method
**Current Parameters:**
```typescript
{
  name: string;              // REQUIRED
  sku: string;               // REQUIRED (must be unique)
  category?: string;         // OPTIONAL
  unit_price: number;        // REQUIRED
  quantity_in_stock?: number;// OPTIONAL (defaults to 0)
}
```

### deactivate() Method - RLS: Admin Only
Sets `is_active = false`

### Test Data Template
```javascript
{
  name: "Copper Pipe 1/2\"",
  sku: "PIPE-CU-HALF",
  category: "Plumbing",
  unit_price: 15.99,
  quantity_in_stock: 50
}
```

---

## Summary of Fixes Needed

1. **CustomerRepository.create()** - Remove `preferred_contact_method` field
2. **JobRepository.create()** - Add support for `scheduled_date` field  
3. **VisitRepository.create()** - Remove `status` from create params (auto-defaults)
4. **All test pages** - Update test data to match schema exactly

## RLS Policy Summary

- **SELECT**: All authenticated web admin users (admin, dispatcher, accountant)
- **INSERT Customers/Inventory/Invoices**: All web admin users
- **INSERT Jobs**: Admin only
- **INSERT Payments**: Admin and Accountant only
- **UPDATE**: All web admin users (on their org's data)
- **VOID Invoices**: Admin only
- **DEACTIVATE Inventory**: Admin only
- **INVITE Users**: Admin only
