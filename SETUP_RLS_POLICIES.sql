-- RLS Policies for SmartFlowPro Web Admin Testing
-- This script adds the necessary RLS policies to allow web admin users to interact with data

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN v_org_id;
END;
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN v_role;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$;

-- Function to check if user can access web admin
CREATE OR REPLACE FUNCTION public.can_access_web_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := get_user_role();
    RETURN v_role IN ('admin', 'dispatcher', 'accountant');
END;
$$;

-- ============================================
-- CUSTOMERS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;

-- SELECT: Users can view customers from their org
CREATE POLICY "customers_select_policy"
ON public.customers
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

-- INSERT: Web admin users can create customers in their org
CREATE POLICY "customers_insert_policy"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id() AND can_access_web_admin());

-- UPDATE: Web admin users can update customers in their org
CREATE POLICY "customers_update_policy"
ON public.customers
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin())
WITH CHECK (org_id = get_user_org_id());

-- ============================================
-- PROPERTIES TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_update_policy" ON public.properties;

CREATE POLICY "properties_select_policy"
ON public.properties
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.customers
        WHERE customers.id = properties.customer_id
        AND customers.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

CREATE POLICY "properties_insert_policy"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.customers
        WHERE customers.id = properties.customer_id
        AND customers.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

CREATE POLICY "properties_update_policy"
ON public.properties
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.customers
        WHERE customers.id = properties.customer_id
        AND customers.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

-- ============================================
-- JOBS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;

CREATE POLICY "jobs_select_policy"
ON public.jobs
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

-- Only admins can create jobs
CREATE POLICY "jobs_insert_policy"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id() AND is_admin());

CREATE POLICY "jobs_update_policy"
ON public.jobs
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin())
WITH CHECK (org_id = get_user_org_id());

-- ============================================
-- VISITS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visits_select_policy" ON public.visits;
DROP POLICY IF EXISTS "visits_insert_policy" ON public.visits;
DROP POLICY IF EXISTS "visits_update_policy" ON public.visits;

CREATE POLICY "visits_select_policy"
ON public.visits
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = visits.job_id
        AND jobs.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

CREATE POLICY "visits_insert_policy"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = visits.job_id
        AND jobs.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

CREATE POLICY "visits_update_policy"
ON public.visits
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = visits.job_id
        AND jobs.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

-- ============================================
-- INVOICES TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON public.invoices;

CREATE POLICY "invoices_select_policy"
ON public.invoices
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

CREATE POLICY "invoices_insert_policy"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id() AND can_access_web_admin());

-- Only admins can void invoices (update status to 'void')
CREATE POLICY "invoices_update_policy"
ON public.invoices
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin())
WITH CHECK (org_id = get_user_org_id());

-- ============================================
-- PAYMENTS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;

CREATE POLICY "payments_select_policy"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = payments.invoice_id
        AND invoices.org_id = get_user_org_id()
    )
    AND can_access_web_admin()
);

-- Only admin and accountant can record payments
CREATE POLICY "payments_insert_policy"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = payments.invoice_id
        AND invoices.org_id = get_user_org_id()
    )
    AND get_user_role() IN ('admin', 'accountant')
);

-- ============================================
-- USERS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

CREATE POLICY "users_select_policy"
ON public.users
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin())
WITH CHECK (org_id = get_user_org_id());

-- ============================================
-- INVENTORY_ITEMS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_insert_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_update_policy" ON public.inventory_items;

CREATE POLICY "inventory_select_policy"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

CREATE POLICY "inventory_insert_policy"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id() AND can_access_web_admin());

-- Only admins can deactivate inventory items
CREATE POLICY "inventory_update_policy"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin())
WITH CHECK (org_id = get_user_org_id());

-- ============================================
-- EMPLOYEE_INVITATIONS TABLE RLS POLICIES
-- ============================================

ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_policy" ON public.employee_invitations;
DROP POLICY IF EXISTS "invitations_insert_policy" ON public.employee_invitations;

CREATE POLICY "invitations_select_policy"
ON public.employee_invitations
FOR SELECT
TO authenticated
USING (org_id = get_user_org_id() AND can_access_web_admin());

-- Only admins can invite users
CREATE POLICY "invitations_insert_policy"
ON public.employee_invitations
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_user_org_id() AND is_admin());

COMMENT ON FUNCTION public.get_user_org_id IS 'Returns the org_id of the currently authenticated user';
COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION public.is_admin IS 'Returns true if the current user is an admin';
COMMENT ON FUNCTION public.can_access_web_admin IS 'Returns true if the current user can access web admin (admin, dispatcher, or accountant)';
