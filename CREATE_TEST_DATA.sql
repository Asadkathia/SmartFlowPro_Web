-- COMPREHENSIVE TEST DATA FOR SMARTFLOWPRO WEB ADMIN
-- This script creates a complete test dataset that satisfies all schema and RLS requirements
-- Run this after applying SETUP_RLS_POLICIES.sql

-- ============================================
-- CLEAN UP EXISTING TEST DATA (Optional)
-- ============================================
-- Uncomment to start fresh
-- DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com'));
-- DELETE FROM line_items WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com'));
-- DELETE FROM invoices WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com');
-- DELETE FROM visits WHERE job_id IN (SELECT id FROM jobs WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com'));
-- DELETE FROM jobs WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com');
-- DELETE FROM properties WHERE customer_id IN (SELECT id FROM customers WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com'));
-- DELETE FROM customers WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com');
-- DELETE FROM inventory_items WHERE org_id IN (SELECT org_id FROM users WHERE email LIKE '%@smartflowpro.com');

-- ============================================
-- HELPER: Get org_id for test users
-- ============================================
-- This assumes you have users created via Supabase Dashboard
-- Replace with your actual test user email if needed
DO $$
DECLARE
    v_org_id UUID;
    v_admin_id UUID;
    v_dispatcher_id UUID;
    v_customer1_id UUID;
    v_customer2_id UUID;
    v_customer3_id UUID;
    v_property1_id UUID;
    v_property2_id UUID;
    v_job1_id UUID;
    v_job2_id UUID;
    v_job3_id UUID;
    v_visit1_id UUID;
    v_visit2_id UUID;
    v_invoice1_id UUID;
    v_invoice2_id UUID;
BEGIN
    -- Get org_id from admin user
    SELECT org_id, id INTO v_org_id, v_admin_id
    FROM public.users
    WHERE email = 'admin@smartflowpro.com'
    LIMIT 1;

    -- Get dispatcher ID
    SELECT id INTO v_dispatcher_id
    FROM public.users
    WHERE email = 'dispatcher@smartflowpro.com'
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please create users via Supabase Dashboard first.';
    END IF;

    RAISE NOTICE 'Using org_id: %', v_org_id;

    -- ============================================
    -- 1. CUSTOMERS (3 test customers)
    -- ============================================
    
    INSERT INTO public.customers (org_id, name, email, phone, address)
    VALUES 
        (v_org_id, 'John Smith', 'john.smith@example.com', '555-0101', '123 Main St, San Francisco, CA 94102')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_customer1_id;

    INSERT INTO public.customers (org_id, name, email, phone, address)
    VALUES
        (v_org_id, 'Sarah Johnson', 'sarah.j@example.com', '555-0102', '456 Oak Ave, Oakland, CA 94601')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_customer2_id;

    INSERT INTO public.customers (org_id, name, email, phone, address)
    VALUES
        (v_org_id, 'Mike Williams', 'mike.w@example.com', '555-0103', '789 Pine Rd, Berkeley, CA 94704')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_customer3_id;

    RAISE NOTICE 'Created customers: %, %, %', v_customer1_id, v_customer2_id, v_customer3_id;

    -- ============================================
    -- 2. PROPERTIES (2 properties for customers)
    -- ============================================
    
    INSERT INTO public.properties (customer_id, address, property_type, is_primary)
    VALUES
        (v_customer1_id, '123 Main St, San Francisco, CA 94102', 'residential', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_property1_id;

    INSERT INTO public.properties (customer_id, address, property_type, is_primary)
    VALUES
        (v_customer2_id, '456 Oak Ave, Oakland, CA 94601', 'commercial', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_property2_id;

    RAISE NOTICE 'Created properties: %, %', v_property1_id, v_property2_id;

    -- ============================================
    -- 3. INVENTORY ITEMS (5 test items)
    -- ============================================
    
    INSERT INTO public.inventory_items (org_id, name, sku, unit, sale_price, taxable_default, active, category)
    VALUES
        (v_org_id, 'Copper Pipe 1/2"', 'PIPE-CU-HALF', 'each', 15.99, true, true, 'Plumbing'),
        (v_org_id, 'PVC Pipe 2"', 'PIPE-PVC-2', 'each', 8.50, true, true, 'Plumbing'),
        (v_org_id, 'Wire Nut #14', 'ELEC-NUT-14', 'box', 0.25, true, true, 'Electrical'),
        (v_org_id, 'Circuit Breaker 20A', 'ELEC-CB-20', 'each', 12.99, true, true, 'Electrical'),
        (v_org_id, 'Faucet Washer', 'PLUMB-WASH-01', 'each', 1.50, true, true, 'Plumbing')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created inventory items';

    -- ============================================
    -- 4. JOBS (3 test jobs with different statuses)
    -- ============================================
    
    INSERT INTO public.jobs (
        org_id, 
        customer_id, 
        service_type, 
        priority, 
        status, 
        notes,
        scheduled_date
    )
    VALUES
        (v_org_id, v_customer1_id, 'Plumbing', 'high', 'in_progress', 'Leaking pipe in bathroom', CURRENT_DATE + INTERVAL '1 day')
    RETURNING id INTO v_job1_id;

    INSERT INTO public.jobs (
        org_id, 
        customer_id, 
        service_type, 
        priority, 
        status, 
        notes,
        scheduled_date
    )
    VALUES
        (v_org_id, v_customer2_id, 'Electrical', 'medium', 'scheduled', 'Install new outlets', CURRENT_DATE + INTERVAL '3 days')
    RETURNING id INTO v_job2_id;

    INSERT INTO public.jobs (
        org_id, 
        customer_id, 
        service_type, 
        priority, 
        status, 
        notes,
        scheduled_date
    )
    VALUES
        (v_org_id, v_customer3_id, 'Plumbing', 'low', 'pending', 'Annual inspection', CURRENT_DATE + INTERVAL '7 days')
    RETURNING id INTO v_job3_id;

    RAISE NOTICE 'Created jobs: %, %, %', v_job1_id, v_job2_id, v_job3_id;

    -- ============================================
    -- 5. VISITS (2 scheduled visits)
    -- ============================================
    
    INSERT INTO public.visits (
        job_id,
        technician_id,
        scheduled_start,
        scheduled_end,
        status
    )
    VALUES
        (
            v_job1_id, 
            v_dispatcher_id,
            (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours')::timestamp,
            (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '11 hours')::timestamp,
            'scheduled'
        )
    RETURNING id INTO v_visit1_id;

    INSERT INTO public.visits (
        job_id,
        technician_id,
        scheduled_start,
        scheduled_end,
        status
    )
    VALUES
        (
            v_job2_id,
            v_admin_id,
            (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours')::timestamp,
            (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '16 hours')::timestamp,
            'scheduled'
        )
    RETURNING id INTO v_visit2_id;

    RAISE NOTICE 'Created visits: %, %', v_visit1_id, v_visit2_id;

    -- ============================================
    -- 6. INVOICES (2 test invoices)
    -- ============================================
    
    INSERT INTO public.invoices (
        org_id,
        visit_id,
        invoice_number,
        status,
        subtotal,
        tax_amount,
        total,
        due_date
    )
    VALUES
        (v_org_id, v_visit1_id, 'INV-001', 'unpaid', 250.00, 22.50, 272.50, CURRENT_DATE + INTERVAL '14 days')
    RETURNING id INTO v_invoice1_id;

    INSERT INTO public.invoices (
        org_id,
        visit_id,
        invoice_number,
        status,
        subtotal,
        tax_amount,
        total,
        due_date
    )
    VALUES
        (v_org_id, v_visit2_id, 'INV-002', 'unpaid', 380.00, 34.20, 414.20, CURRENT_DATE + INTERVAL '21 days')
    RETURNING id INTO v_invoice2_id;

    RAISE NOTICE 'Created invoices: %, %', v_invoice1_id, v_invoice2_id;

    -- ============================================
    -- 7. LINE ITEMS (for invoices)
    -- ============================================
    
    INSERT INTO public.line_items (invoice_id, description, quantity, unit_price, total)
    VALUES
        (v_invoice1_id, 'Plumbing repair - bathroom pipe', 1, 150.00, 150.00),
        (v_invoice1_id, 'Copper pipe replacement', 2, 50.00, 100.00);

    INSERT INTO public.line_items (invoice_id, description, quantity, unit_price, total)
    VALUES
        (v_invoice2_id, 'Electrical outlet installation', 4, 75.00, 300.00),
        (v_invoice2_id, 'Circuit breaker upgrade', 1, 80.00, 80.00);

    RAISE NOTICE 'Created line items for invoices';

    -- ============================================
    -- 8. PAYMENTS (1 partial payment)
    -- ============================================
    
    INSERT INTO public.payments (
        invoice_id,
        amount,
        method,
        reference,
        received_at,
        recorded_by
    )
    VALUES
        (v_invoice1_id, 100.00, 'cash', 'CASH-001', NOW(), v_admin_id);

    -- Update invoice amount_paid
    -- Update invoice status
    UPDATE public.invoices
    SET status = 'partial'
    WHERE id = v_invoice1_id;

    RAISE NOTICE 'Created payment for invoice %', v_invoice1_id;

    RAISE NOTICE 'Test data creation complete!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - 3 Customers';
    RAISE NOTICE '  - 2 Properties';
    RAISE NOTICE '  - 5 Inventory Items';
    RAISE NOTICE '  - 3 Jobs';
    RAISE NOTICE '  - 2 Visits';
    RAISE NOTICE '  - 2 Invoices';
    RAISE NOTICE '  - 1 Payment';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check created data
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers 
WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com')
UNION ALL
SELECT 'Properties', COUNT(*) FROM properties 
WHERE customer_id IN (SELECT id FROM customers WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com'))
UNION ALL
SELECT 'Jobs', COUNT(*) FROM jobs 
WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com')
UNION ALL
SELECT 'Visits', COUNT(*) FROM visits 
WHERE job_id IN (SELECT id FROM jobs WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com'))
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices 
WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com')
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments 
WHERE invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com'))
UNION ALL
SELECT 'Inventory', COUNT(*) FROM inventory_items 
WHERE org_id IN (SELECT org_id FROM users WHERE email = 'admin@smartflowpro.com');
