# SmartFlowPro Web Admin - Backend Implementation Guide

## Document Overview

This guide provides complete backend implementation specifications for the SmartFlowPro Web Admin Dashboard, aligned with the PRD (Product Requirements Document). The backend follows a **Supabase-first architecture** using PostgreSQL, Row-Level Security (RLS), and Edge Functions.

**Approach**: Backend-First Development  
**Backend Stack**: Supabase (Postgres + Auth + Realtime + Storage)  
**Reference**: PRD Sections 2, 3, 4, 29

> [!IMPORTANT]
> **IMPLEMENTATION DECISION (Jan 2026)**: Use **Direct Supabase Client + RLS Policies** instead of Edge Functions. This matches the mobile app architecture and simplifies development. The Edge Functions code in this guide serves as reference for the business logic, but should be implemented as frontend repository queries with RLS enforcement.
> 
> See: [Final Implementation Plan](./web_admin_backend_implementation_plan_final.md)

---

## Table of Contents

1. [Existing Infrastructure Analysis](#1-existing-infrastructure-analysis)
2. [Channel-Based Access Control](#2-channel-based-access-control)
3. [RLS Policy Updates for Web Admin](#3-rls-policy-updates-for-web-admin)
4. [Edge Functions Implementation](#4-edge-functions-implementation)
5. [API Endpoint Specifications](#5-api-endpoint-specifications)
6. [Database Schema Verification](#6-database-schema-verification)
7. [Real-time Subscriptions](#7-real-time-subscriptions)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Existing Infrastructure Analysis

### 1.1 Current Backend Status

Your existing Supabase backend (built for mobile app) includes:

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 23 tables with org_id scoping |
| RLS Policies | ✅ Complete | Technician-focused policies |
| Auth | ✅ Complete | JWT-based with role validation |
| Storage | ✅ Complete | Media, signatures, inventory images |
| Realtime | ✅ Complete | Chat, visits channels |

### 1.2 What Needs to Be Added for Web Admin

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Channel enforcement | ⚠️ Partial | Add `web_admin` channel validation |
| Admin RLS policies | ⚠️ Partial | Extend policies for non-technician access |
| Admin Edge Functions | ❌ Missing | Create 15+ new functions |
| Payment recording | ❌ Missing | Implement payment APIs |
| Team management | ❌ Missing | Invite/suspend/deactivate APIs |
| Reports/Analytics | ❌ Missing | Aggregation queries |

---

## 2. Channel-Based Access Control

### 2.1 PRD Requirement (Section 4.1)

```
| Role                    | Web Admin Dashboard | Mobile App |
|-------------------------|---------------------|------------|
| Owner / Admin           | ✅ Allowed          | ❌ Blocked |
| Dispatcher / Office     | ✅ Allowed          | ❌ Blocked |
| Accountant              | ✅ Allowed          | ❌ Blocked |
| Technician              | ❌ Blocked          | ✅ Allowed |
```

### 2.2 Implementation: Channel Validation Function

**File**: `supabase/migrations/20260122000000_add_channel_validation.sql`

```sql
-- ============================================
-- Channel Validation Function
-- ============================================

-- Create channel enum type
CREATE TYPE request_channel AS ENUM ('web_admin', 'mobile_technician');

-- Function to validate channel access based on role
CREATE OR REPLACE FUNCTION validate_channel_access(
  p_user_id UUID,
  p_channel request_channel
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role user_role;
BEGIN
  -- Get user's role
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validate channel access
  IF p_channel = 'web_admin' THEN
    -- Web Admin: Only admin, dispatcher, accountant
    RETURN v_user_role IN ('admin', 'dispatcher', 'accountant');
  ELSIF p_channel = 'mobile_technician' THEN
    -- Mobile: Only technician
    RETURN v_user_role = 'technician';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user can access web admin
CREATE OR REPLACE FUNCTION can_access_web_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'dispatcher', 'accountant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 3. RLS Policy Updates for Web Admin

### 3.1 Current vs Required Policies

The existing RLS policies are technician-focused. We need to extend them for web admin access.

**File**: `supabase/migrations/20260122000100_web_admin_rls_policies.sql`

```sql
-- ============================================
-- Web Admin RLS Policy Extensions
-- ============================================

-- =====================
-- CUSTOMERS TABLE
-- =====================
-- Web admin can view all customers in their org
CREATE POLICY "Web admin can view all org customers"
ON customers FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Web admin can create customers
CREATE POLICY "Web admin can create customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Web admin can update customers
CREATE POLICY "Web admin can update customers"
ON customers FOR UPDATE
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- PROPERTIES TABLE
-- =====================
CREATE POLICY "Web admin can manage properties"
ON properties FOR ALL
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- JOBS TABLE
-- =====================
-- Web admin can view all jobs
CREATE POLICY "Web admin can view all org jobs"
ON jobs FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Only admin can create jobs (PRD 3.5)
CREATE POLICY "Admin can create jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org_id()
  AND is_admin()
);

-- Web admin can update jobs
CREATE POLICY "Web admin can update jobs"
ON jobs FOR UPDATE
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- VISITS TABLE
-- =====================
-- Web admin can view all visits
CREATE POLICY "Web admin can view all org visits"
ON visits FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Web admin can create visits
CREATE POLICY "Web admin can create visits"
ON visits FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Web admin can update visits (including cancellation)
CREATE POLICY "Web admin can update visits"
ON visits FOR UPDATE
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- QUOTES TABLE
-- =====================
-- Web admin can view all quotes
CREATE POLICY "Web admin can view all org quotes"
ON quotes FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- INVOICES TABLE
-- =====================
-- Web admin can manage all invoices
CREATE POLICY "Web admin can manage all org invoices"
ON invoices FOR ALL
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- PAYMENTS TABLE
-- =====================
-- Only accountant/admin can record payments (PRD 8.2)
CREATE POLICY "Accountant/Admin can record payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org_id()
  AND get_user_role() IN ('admin', 'accountant')
);

-- Web admin can view payments
CREATE POLICY "Web admin can view payments"
ON payments FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- USERS TABLE (Team Management)
-- =====================
-- Web admin can view team members
CREATE POLICY "Web admin can view team"
ON users FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- Only admin can manage users
CREATE POLICY "Admin can manage users"
ON users FOR UPDATE
TO authenticated
USING (
  org_id = get_user_org_id()
  AND is_admin()
);

-- =====================
-- EMPLOYEE INVITATIONS TABLE
-- =====================
-- Only admin can create invitations
CREATE POLICY "Admin can create invitations"
ON employee_invitations FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org_id()
  AND is_admin()
);

-- Admin can view invitations
CREATE POLICY "Admin can view invitations"
ON employee_invitations FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND is_admin()
);

-- =====================
-- INVENTORY ITEMS TABLE
-- =====================
-- Web admin has full control over inventory
CREATE POLICY "Web admin can manage inventory"
ON inventory_items FOR ALL
TO authenticated
USING (
  org_id = get_user_org_id()
  AND can_access_web_admin()
);

-- =====================
-- BILLING SETTINGS TABLE
-- =====================
-- Only admin can manage billing settings
CREATE POLICY "Admin can manage billing settings"
ON billing_settings FOR ALL
TO authenticated
USING (
  org_id = get_user_org_id()
  AND is_admin()
);

-- =====================
-- AUDIT LOGS TABLE
-- =====================
-- Only admin can view audit logs
CREATE POLICY "Admin can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND is_admin()
);

-- =====================
-- ORGANIZATIONS TABLE
-- =====================
-- Admin can update org settings
CREATE POLICY "Admin can update organization"
ON organizations FOR UPDATE
TO authenticated
USING (
  id = get_user_org_id()
  AND is_admin()
);
```

---

## 4. Edge Functions Implementation

### 4.1 Edge Functions Directory Structure

```
supabase/functions/
├── _shared/
│   ├── cors.ts
│   ├── auth.ts
│   ├── response.ts
│   └── validation.ts
├── auth/
│   ├── login/index.ts
│   └── verify-channel/index.ts
├── customers/
│   ├── list/index.ts
│   ├── get/index.ts
│   ├── create/index.ts
│   └── update/index.ts
├── jobs/
│   ├── list/index.ts
│   ├── get/index.ts
│   └── create/index.ts
├── visits/
│   ├── list/index.ts
│   ├── create/index.ts
│   ├── update/index.ts
│   └── cancel/index.ts
├── invoices/
│   ├── list/index.ts
│   ├── get/index.ts
│   ├── void/index.ts
│   └── refund/index.ts
├── payments/
│   └── record/index.ts
├── team/
│   ├── list/index.ts
│   ├── invite/index.ts
│   ├── update/index.ts
│   └── deactivate/index.ts
├── reports/
│   ├── revenue/index.ts
│   ├── jobs-summary/index.ts
│   └── technician-performance/index.ts
└── settings/
    ├── org/index.ts
    └── billing/index.ts
```

### 4.2 Shared Utilities

**File**: `supabase/functions/_shared/auth.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface AuthContext {
  userId: string
  orgId: string
  role: 'admin' | 'dispatcher' | 'accountant' | 'technician'
  email: string
}

export async function validateWebAdminAccess(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Invalid or expired token')
  }
  
  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('org_id, role, email')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    throw new Error('User profile not found')
  }
  
  // Validate web admin channel access
  const allowedRoles = ['admin', 'dispatcher', 'accountant']
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('Access denied: Technicians cannot access web admin')
  }
  
  return {
    userId: user.id,
    orgId: profile.org_id,
    role: profile.role as AuthContext['role'],
    email: profile.email,
  }
}

export function requireRole(context: AuthContext, roles: string[]): void {
  if (!roles.includes(context.role)) {
    throw new Error(`Access denied: Requires one of [${roles.join(', ')}] role`)
  }
}
```

**File**: `supabase/functions/_shared/response.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      data,
      meta: {
        request_id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        ...meta,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function errorResponse(code: string, message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      error: { code, message },
      meta: {
        request_id: crypto.randomUUID(),
        ts: new Date().toISOString(),
      },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

### 4.3 Core Edge Functions

#### 4.3.1 Customers List (with Pagination)

**File**: `supabase/functions/customers/list/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validateWebAdminAccess } from '../../_shared/auth.ts'
import { successResponse, errorResponse, handleCors } from '../../_shared/response.ts'

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Validate auth + channel
    const auth = await validateWebAdminAccess(req)
    
    // Parse query params
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '20'), 100)
    const search = url.searchParams.get('search') || ''
    
    const offset = (page - 1) * pageSize
    
    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Build query
    let query = supabase
      .from('customers')
      .select('*, properties(*)', { count: 'exact' })
      .eq('org_id', auth.orgId)
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1)
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return successResponse(data, {
      page,
      page_size: pageSize,
      total: count,
      has_more: (offset + pageSize) < (count || 0),
    })
    
  } catch (error) {
    console.error('Error:', error.message)
    
    if (error.message.includes('Access denied')) {
      return errorResponse('FORBIDDEN', error.message, 403)
    }
    if (error.message.includes('Invalid') || error.message.includes('Missing')) {
      return errorResponse('UNAUTHORIZED', error.message, 401)
    }
    
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }
})
```

#### 4.3.2 Create Job (PRD Section 3.5)

**File**: `supabase/functions/jobs/create/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validateWebAdminAccess, requireRole } from '../../_shared/auth.ts'
import { successResponse, errorResponse, handleCors } from '../../_shared/response.ts'

interface CreateJobRequest {
  customer_id: string
  service_type: string
  priority?: 'low' | 'medium' | 'high'
  notes?: string
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await validateWebAdminAccess(req)
    
    // Only admin can create jobs (PRD requirement)
    requireRole(auth, ['admin'])
    
    const body: CreateJobRequest = await req.json()
    
    // Validate required fields
    if (!body.customer_id || !body.service_type) {
      return errorResponse('VALIDATION_ERROR', 'customer_id and service_type are required', 422)
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Generate job number using sequence counter
    const { data: jobNumber, error: seqError } = await supabase.rpc('generate_job_number', {
      p_org_id: auth.orgId
    })
    
    if (seqError) throw seqError
    
    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        org_id: auth.orgId,
        job_number: jobNumber,
        customer_id: body.customer_id,
        service_type: body.service_type,
        priority: body.priority || 'medium',
        notes: body.notes,
      })
      .select()
      .single()
    
    if (jobError) throw jobError
    
    // Create audit log
    await supabase.from('audit_logs').insert({
      org_id: auth.orgId,
      entity: 'jobs',
      entity_id: job.id,
      action: 'create',
      performed_by: auth.userId,
      payload: { job_number: jobNumber, customer_id: body.customer_id },
    })
    
    return successResponse(job)
    
  } catch (error) {
    console.error('Error:', error.message)
    
    if (error.message.includes('Requires')) {
      return errorResponse('FORBIDDEN', error.message, 403)
    }
    
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }
})
```

#### 4.3.3 Record Payment (PRD Section 8.2)

**File**: `supabase/functions/payments/record/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validateWebAdminAccess, requireRole } from '../../_shared/auth.ts'
import { successResponse, errorResponse, handleCors } from '../../_shared/response.ts'

interface RecordPaymentRequest {
  invoice_id: string
  amount: number
  method: 'cash' | 'bank_transfer' | 'card' | 'stripe_link'
  reference?: string
  received_at?: string // ISO date, defaults to now
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await validateWebAdminAccess(req)
    
    // Only admin/accountant can record payments (PRD requirement)
    requireRole(auth, ['admin', 'accountant'])
    
    const body: RecordPaymentRequest = await req.json()
    
    // Validate required fields
    if (!body.invoice_id || !body.amount || !body.method) {
      return errorResponse('VALIDATION_ERROR', 'invoice_id, amount, and method are required', 422)
    }
    
    // Validate amount > 0
    if (body.amount <= 0) {
      return errorResponse('VALIDATION_ERROR', 'Payment amount must be greater than zero', 422)
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Get invoice and calculate remaining balance
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, payments(amount)')
      .eq('id', body.invoice_id)
      .eq('org_id', auth.orgId)
      .single()
    
    if (invoiceError || !invoice) {
      return errorResponse('NOT_FOUND', 'Invoice not found', 404)
    }
    
    // Calculate paid amount
    const paidAmount = invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const remainingBalance = invoice.total - paidAmount
    
    // Validate payment doesn't exceed remaining balance
    if (body.amount > remainingBalance) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Payment amount exceeds remaining balance of $${remainingBalance.toFixed(2)}`,
        422
      )
    }
    
    // Record payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        org_id: auth.orgId,
        invoice_id: body.invoice_id,
        amount: body.amount,
        method: body.method,
        reference: body.reference,
        received_by: auth.userId,
        received_at: body.received_at || new Date().toISOString(),
      })
      .select()
      .single()
    
    if (paymentError) throw paymentError
    
    // Update invoice status
    const newPaidAmount = paidAmount + body.amount
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
        .eq('id', body.invoice_id)
    }
    
    // Create audit log
    await supabase.from('audit_logs').insert({
      org_id: auth.orgId,
      entity: 'payments',
      entity_id: payment.id,
      action: 'create',
      performed_by: auth.userId,
      payload: {
        invoice_id: body.invoice_id,
        amount: body.amount,
        method: body.method,
        new_status: newStatus,
      },
    })
    
    return successResponse({
      payment,
      invoice_status: newStatus,
      remaining_balance: invoice.total - newPaidAmount,
    })
    
  } catch (error) {
    console.error('Error:', error.message)
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }
})
```

#### 4.3.4 Invite Employee (PRD Section 5.2)

**File**: `supabase/functions/team/invite/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validateWebAdminAccess, requireRole } from '../../_shared/auth.ts'
import { successResponse, errorResponse, handleCors } from '../../_shared/response.ts'

interface InviteEmployeeRequest {
  email: string
  full_name?: string
  phone?: string
  role: 'admin' | 'dispatcher' | 'accountant' | 'technician'
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await validateWebAdminAccess(req)
    
    // Only admin can invite employees
    requireRole(auth, ['admin'])
    
    const body: InviteEmployeeRequest = await req.json()
    
    // Validate required fields
    if (!body.email || !body.role) {
      return errorResponse('VALIDATION_ERROR', 'email and role are required', 422)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email format', 422)
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Check if email already exists in org
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', auth.orgId)
      .eq('email', body.email)
      .single()
    
    if (existingUser) {
      return errorResponse('CONFLICT', 'User with this email already exists in your organization', 409)
    }
    
    // Check for pending invitation
    const { data: existingInvite } = await supabase
      .from('employee_invitations')
      .select('id')
      .eq('org_id', auth.orgId)
      .eq('email', body.email)
      .eq('status', 'pending')
      .single()
    
    if (existingInvite) {
      return errorResponse('CONFLICT', 'Pending invitation already exists for this email', 409)
    }
    
    // Generate secure token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID()
    
    // Set expiry (7 days from now per PRD)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('employee_invitations')
      .insert({
        org_id: auth.orgId,
        email: body.email,
        full_name: body.full_name,
        phone: body.phone,
        role: body.role,
        invited_by: auth.userId,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()
    
    if (inviteError) throw inviteError
    
    // Create audit log
    await supabase.from('audit_logs').insert({
      org_id: auth.orgId,
      entity: 'employee_invitations',
      entity_id: invitation.id,
      action: 'create',
      performed_by: auth.userId,
      payload: { email: body.email, role: body.role },
    })
    
    // TODO: Send invitation email via external service
    // For now, return the invite link
    const inviteLink = `${Deno.env.get('APP_URL')}/accept-invite?token=${token}`
    
    return successResponse({
      invitation,
      invite_link: inviteLink,
    })
    
  } catch (error) {
    console.error('Error:', error.message)
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }
})
```

#### 4.3.5 Revenue Report

**File**: `supabase/functions/reports/revenue/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { validateWebAdminAccess } from '../../_shared/auth.ts'
import { successResponse, errorResponse, handleCors } from '../../_shared/response.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await validateWebAdminAccess(req)
    
    // Parse date range from query params
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date') || getFirstDayOfMonth()
    const endDate = url.searchParams.get('end_date') || new Date().toISOString()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Get total revenue (paid invoices)
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount, received_at')
      .eq('org_id', auth.orgId)
      .gte('received_at', startDate)
      .lte('received_at', endDate)
    
    if (revenueError) throw revenueError
    
    const totalRevenue = revenueData?.reduce((sum, p) => sum + p.amount, 0) || 0
    
    // Get outstanding amount (unpaid + partially_paid invoices)
    const { data: outstandingData, error: outstandingError } = await supabase
      .from('invoices')
      .select('total, status, payments(amount)')
      .eq('org_id', auth.orgId)
      .in('status', ['unpaid', 'partially_paid'])
    
    if (outstandingError) throw outstandingError
    
    const outstanding = outstandingData?.reduce((sum, inv) => {
      const paid = inv.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0
      return sum + (inv.total - paid)
    }, 0) || 0
    
    // Get overdue amount
    const now = new Date().toISOString()
    const { data: overdueData } = await supabase
      .from('invoices')
      .select('total, payments(amount)')
      .eq('org_id', auth.orgId)
      .in('status', ['unpaid', 'partially_paid'])
      .lt('due_date', now)
    
    const overdue = overdueData?.reduce((sum, inv) => {
      const paid = inv.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0
      return sum + (inv.total - paid)
    }, 0) || 0
    
    // Get job counts
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)
      .gte('created_at', startDate)
    
    const { count: completedVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)
      .eq('status', 'completed')
      .gte('actual_end', startDate)
    
    return successResponse({
      period: { start_date: startDate, end_date: endDate },
      revenue: {
        total: totalRevenue,
        outstanding,
        overdue,
      },
      jobs: {
        total: totalJobs || 0,
        completed_visits: completedVisits || 0,
      },
    })
    
  } catch (error) {
    console.error('Error:', error.message)
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }
})

function getFirstDayOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}
```

---

## 5. API Endpoint Specifications

### 5.1 Complete Endpoint List (PRD Section 29.2)

| Method | Endpoint | Channel | Role Required | Description |
|--------|----------|---------|---------------|-------------|
| **Auth** |
| POST | `/v1/auth/login` | both | any | Login with channel validation |
| POST | `/v1/auth/logout` | both | any | Logout |
| **Organization** |
| GET | `/v1/orgs/me` | web_admin | admin | Get org details |
| PATCH | `/v1/orgs/me` | web_admin | admin | Update org settings |
| **Team Management** |
| GET | `/v1/team/members` | web_admin | any | List team members |
| POST | `/v1/team/invite` | web_admin | admin | Invite employee |
| PATCH | `/v1/team/members/:id` | web_admin | admin | Update member |
| POST | `/v1/team/members/:id/deactivate` | web_admin | admin | Deactivate |
| **Customers** |
| GET | `/v1/customers` | web_admin | any | List customers |
| GET | `/v1/customers/:id` | web_admin | any | Get customer |
| POST | `/v1/customers` | web_admin | any | Create customer |
| PATCH | `/v1/customers/:id` | web_admin | any | Update customer |
| **Properties** |
| POST | `/v1/customers/:id/properties` | web_admin | any | Add property |
| GET | `/v1/properties/:id` | web_admin | any | Get property |
| **Jobs** |
| GET | `/v1/jobs` | web_admin | any | List jobs |
| GET | `/v1/jobs/:id` | web_admin | any | Get job |
| POST | `/v1/jobs` | web_admin | admin | Create job |
| **Visits** |
| GET | `/v1/visits` | web_admin | any | List visits |
| POST | `/v1/visits` | web_admin | any | Create visit |
| PATCH | `/v1/visits/:id` | web_admin | any | Update visit |
| POST | `/v1/visits/:id/cancel` | web_admin | any | Cancel visit |
| **Quotes** |
| GET | `/v1/quotes` | web_admin | any | List quotes |
| GET | `/v1/quotes/:id` | web_admin | any | Get quote |
| **Invoices** |
| GET | `/v1/invoices` | web_admin | any | List invoices |
| GET | `/v1/invoices/:id` | web_admin | any | Get invoice |
| POST | `/v1/invoices/:id/void` | web_admin | admin | Void invoice |
| POST | `/v1/invoices/:id/refund` | web_admin | admin/accountant | Refund |
| **Payments** |
| POST | `/v1/invoices/:id/payments` | web_admin | admin/accountant | Record payment |
| **Inventory** |
| GET | `/v1/inventory/items` | web_admin | any | List items |
| POST | `/v1/inventory/items` | web_admin | any | Create item |
| PATCH | `/v1/inventory/items/:id` | web_admin | any | Update item |
| POST | `/v1/inventory/items/:id/deactivate` | web_admin | admin | Deactivate |
| **Billing Settings** |
| GET | `/v1/billing-settings` | web_admin | any | Get settings |
| PATCH | `/v1/billing-settings` | web_admin | admin | Update settings |
| **Reports** |
| GET | `/v1/reports/revenue` | web_admin | any | Revenue report |
| GET | `/v1/reports/jobs-summary` | web_admin | any | Jobs summary |
| **Audit Logs** |
| GET | `/v1/audit-logs` | web_admin | admin | View logs |

---

## 6. Database Schema Verification

### 6.1 Required Tables Checklist

Run this SQL to verify all required tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables (23):
-- ai_interaction_logs
-- audit_logs
-- billing_settings
-- chat_messages
-- chat_participants
-- chat_threads
-- customers
-- employee_invitations
-- inventory_items
-- invoices
-- jobs
-- line_items
-- notes
-- organizations
-- payments
-- properties
-- quote_approvals
-- quotes
-- sequence_counters
-- users
-- visit_media
-- visit_signatures
-- visits
```

### 6.2 Missing Columns Check

Verify invoice table has all required fields:

```sql
-- Check invoices table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Required columns per PRD 3.12:
-- id, org_id, visit_id, quote_id, invoice_number, status, total, version, updated_at, created_at
```

---

## 7. Real-time Subscriptions

### 7.1 Channels for Web Admin

```typescript
// supabase/functions/realtime-config.ts

export const REALTIME_CHANNELS = {
  // Visits updates for calendar
  visits: (orgId: string) => `visits:${orgId}`,
  
  // Invoice status changes
  invoices: (orgId: string) => `invoices:${orgId}`,
  
  // New requests/quotes
  quotes: (orgId: string) => `quotes:${orgId}`,
  
  // Chat (shared with mobile)
  chat: (chatId: string) => `chat:${chatId}`,
}
```

### 7.2 Frontend Subscription Example

```typescript
// In Next.js component
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeVisits(orgId: string) {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel(`visits:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          console.log('Visit update:', payload)
          // Trigger React Query invalidation
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId])
}
```

---

## 8. Testing Strategy

### 8.1 Backend Testing Checklist

#### Authentication Tests
- [ ] Valid admin login succeeds
- [ ] Valid dispatcher login succeeds
- [ ] Valid accountant login succeeds
- [ ] Technician login to web admin fails with 403
- [ ] Invalid credentials return 401
- [ ] Expired token returns 401

#### RLS Policy Tests
- [ ] Admin can access all org data
- [ ] Dispatcher can access customers, jobs, visits
- [ ] Accountant can access invoices, payments
- [ ] Cross-org access is blocked
- [ ] Technician cannot access web admin endpoints

#### Edge Function Tests
- [ ] Customers CRUD operations
- [ ] Jobs creation (admin-only)
- [ ] Payment recording (admin/accountant only)
- [ ] Team invitation (admin-only)
- [ ] Reports return correct aggregations

### 8.2 Test Script

**File**: `supabase/tests/web_admin_tests.sql`

```sql
-- Test 1: Channel validation
SELECT validate_channel_access(
  '00000000-0000-0000-0000-000000000001', -- admin user
  'web_admin'
); -- Should return TRUE

SELECT validate_channel_access(
  '00000000-0000-0000-0000-000000000002', -- technician user
  'web_admin'
); -- Should return FALSE

-- Test 2: Payment validation
-- Attempt to record payment exceeding balance
-- Should fail with error

-- Test 3: Job creation
-- Non-admin user should fail
```

---

## 9. Deployment Steps

### 9.1 Apply Migrations

```bash
# 1. Navigate to project
cd ~/Desktop/smartflowpro

# 2. Apply new migrations
supabase db push

# 3. Deploy Edge Functions
supabase functions deploy --all

# 4. Verify deployment
supabase functions list
```

### 9.2 Environment Variables

Set in Supabase Dashboard → Settings → Edge Functions:

```
APP_URL=https://admin.smartflowpro.com
SUPABASE_URL=https://pbqbsdmwbjpsvxuuwjiv.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 10. Summary

### Backend Components to Create

| Component | Files | Priority |
|-----------|-------|----------|
| Channel validation SQL | 1 migration | P0 |
| Web admin RLS policies | 1 migration | P0 |
| Shared Edge Function utils | 4 files | P0 |
| Customers functions | 4 functions | P1 |
| Jobs functions | 3 functions | P1 |
| Visits functions | 4 functions | P1 |
| Payments functions | 1 function | P1 |
| Team functions | 4 functions | P1 |
| Reports functions | 3 functions | P2 |
| Settings functions | 2 functions | P2 |

**Total**: ~2 migrations + ~25 Edge Functions

### Estimated Time

- **Day 1**: Migrations + shared utilities
- **Day 2-3**: Core CRUD functions (Customers, Jobs, Visits)
- **Day 4**: Payment + Team management functions
- **Day 5**: Reports + Settings + Testing

**Total**: 5 days for backend completion

---

## Next Steps

1. ✅ Review this implementation guide
2. ⬜ Create new migrations in `/supabase/migrations/`
3. ⬜ Create Edge Functions in `/supabase/functions/`
4. ⬜ Deploy and test
5. ⬜ Move to frontend development
