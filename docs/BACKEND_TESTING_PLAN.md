# Backend Testing Plan - SmartFlowPro Web Admin

**Purpose**: Verify all backend features work correctly before building the complete UI.

**Current Status**: ✅ Authentication working, admin user logged in

---

## Test Environment Setup

### Test Users (Already Created)
- ✅ `admin@smartflowpro.com` - Admin role
- ✅ `dispatcher@smartflowpro.com` - Dispatcher role
- ✅ `accountant@smartflowpro.com` - Accountant role

### Prerequisites
- [x] Development server running (`npm run dev`)
- [x] Logged in as admin user
- [ ] Browser console open (for debugging)
- [ ] Supabase Dashboard open (to verify data)

---

## Phase 1: Repository Function Testing

We'll create simple test pages to verify each repository works.

### 1.1 Customer Repository Test
**Test Page**: `/app/test/customers/page.tsx`

Test scenarios:
- [ ] **List customers** - Fetch all customers for org
- [ ] **Create customer** - Add new customer with name, phone, email
- [ ] **Update customer** - Change customer details
- [ ] **Search customers** - Filter by name/phone
- [ ] **Pagination** - Test limit/offset

Expected behavior:
- ✅ Only see customers from your org
- ✅ Cannot see customers from other orgs
- ✅ All CRUD operations work

### 1.2 Job Repository Test
**Test Page**: `/app/test/jobs/page.tsx`

Test scenarios:
- [ ] **Create job (admin)** - As admin, create job
- [ ] **Auto job number** - Verify job_number is auto-generated (e.g., ORG-J-001)
- [ ] **List jobs** - Fetch all jobs
- [ ] **Get job by ID** - Fetch single job with customer details

Expected behavior:
- ✅ Job number auto-increments
- ✅ Only admin can create jobs
- ✅ Job includes customer info when fetched

### 1.3 Visit Repository Test
**Test Page**: `/app/test/visits/page.tsx`

Test scenarios:
- [ ] **Create visit** - Create visit for a job
- [ ] **List visits** - Fetch visits with filters (by technician, by status)
- [ ] **Update visit** - Change status, actual start/end times
- [ ] **Cancel visit** - Cancel with reason (creates audit log)

Expected behavior:
- ✅ Visit can be scheduled, in-progress, completed, cancelled
- ✅ Audit log created on cancellation
- ✅ Can filter by technician_id and status

### 1.4 Payment Repository Test
**Test Page**: `/app/test/payments/page.tsx`

Test scenarios:
- [ ] **Record payment (admin)** - As admin, record payment
- [ ] **Record payment (accountant)** - As accountant, record payment
- [ ] **Validate amount** - Try to overpay invoice (should fail)
- [ ] **Auto invoice status** - Verify invoice status updates to 'paid'
- [ ] **List payments** - Fetch payments for invoice

Expected behavior:
- ✅ Only admin/accountant can record payments
- ✅ Cannot overpay an invoice
- ✅ Invoice status auto-updates when fully paid
- ✅ Audit log created

### 1.5 Invoice Repository Test
**Test Page**: `/app/test/invoices/page.tsx`

Test scenarios:
- [ ] **List invoices** - Fetch all invoices
- [ ] **Get invoice by ID** - Fetch single invoice with line items
- [ ] **Filter invoices** - By status (draft, sent, paid, void)
- [ ] **Void invoice (admin)** - As admin, void an invoice

Expected behavior:
- ✅ Only admin can void invoices
- ✅ Voided invoices cannot be paid
- ✅ Filters work correctly

### 1.6 Team Repository Test
**Test Page**: `/app/test/team/page.tsx`

Test scenarios:
- [ ] **List team members** - Fetch all users in org
- [ ] **Invite user (admin)** - As admin, send invitation
- [ ] **Duplicate check** - Try to invite existing email (should fail)
- [ ] **Update user** - Change user details
- [ ] **Deactivate user** - Deactivate a user

Expected behavior:
- ✅ Only admin can invite users
- ✅ Cannot invite duplicate email
- ✅ Invitation token generated
- ✅ Audit log created

### 1.7 Inventory Repository Test
**Test Page**: `/app/test/inventory/page.tsx`

Test scenarios:
- [ ] **List inventory** - Fetch all items
- [ ] **Create item** - Add new inventory item
- [ ] **Update item** - Change price, details
- [ ] **Deactivate item (admin)** - Mark item as inactive
- [ ] **Filter active items** - Only show active=true

Expected behavior:
- ✅ Items are org-specific
- ✅ Only admin can deactivate
- ✅ Filters work correctly

---

## Phase 2: Role-Based Access Control Testing

Test that RLS policies properly restrict access based on user role.

### 2.1 Admin Role Tests
Login as `admin@smartflowpro.com`:
- [ ] Can create jobs ✅
- [ ] Can void invoices ✅
- [ ] Can record payments ✅
- [ ] Can invite team members ✅
- [ ] Can deactivate inventory ✅

### 2.2 Accountant Role Tests
Login as `accountant@smartflowpro.com`:
- [ ] **Cannot** create jobs ❌
- [ ] **Cannot** void invoices ❌
- [ ] Can record payments ✅
- [ ] **Cannot** invite team members ❌
- [ ] **Cannot** deactivate inventory ❌

### 2.3 Dispatcher Role Tests
Login as `dispatcher@smartflowpro.com`:
- [ ] **Cannot** create jobs ❌
- [ ] **Cannot** void invoices ❌
- [ ] **Cannot** record payments ❌
- [ ] **Cannot** invite team members ❌
- [ ] Can view customers ✅
- [ ] Can create/update visits ✅

### 2.4 Technician Blocking Test
Try to access web admin as technician:
- [ ] Redirected to `/unauthorized` page ✅
- [ ] Cannot access any protected routes ✅

---

## Phase 3: Integration Flow Testing

Test complete business workflows.

### 3.1 Customer → Job → Visit Flow
- [ ] 1. Create customer
- [ ] 2. Create job for that customer
- [ ] 3. Create visit for that job
- [ ] 4. Verify all relationships work
- [ ] 5. Fetch visit with job and customer details

### 3.2 Quote → Invoice → Payment Flow
- [ ] 1. Create quote for a visit
- [ ] 2. Convert quote to invoice
- [ ] 3. Record partial payment
- [ ] 4. Verify invoice status = 'partial'
- [ ] 5. Record remaining payment
- [ ] 6. Verify invoice status = 'paid'

### 3.3 Team Invitation Flow
- [ ] 1. Admin invites new user
- [ ] 2. Verify invitation created with token
- [ ] 3. Verify email validation works
- [ ] 4. Verify duplicate detection works

---

## Phase 4: Cross-Org Access Testing

Verify RLS policies prevent cross-org data leaks.

### Setup
Create a second test user in a **different org** via Supabase Dashboard.

### Tests
- [ ] User A cannot see User B's customers
- [ ] User A cannot see User B's jobs
- [ ] User A cannot create visits for User B's jobs
- [ ] User A cannot see User B's invoices
- [ ] User A cannot see User B's team members

---

## Implementation Approach

### Step 1: Create Test Routes
Create `/app/test/` directory with test pages for each repository:

```typescript
// Example: app/test/customers/page.tsx
'use client';

import { useState } from 'react';
import { customerRepository } from '@/lib/repositories/customer-repository';

export default function CustomerTest() {
  const [result, setResult] = useState<any>(null);

  const testList = async () => {
    const { data, error } = await customerRepository.list();
    setResult({ data, error });
  };

  const testCreate = async () => {
    const { data, error } = await customerRepository.create({
      name: 'Test Customer',
      phone: '555-0100',
      email: 'test@example.com'
    });
    setResult({ data, error });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Customer Repository Test</h1>
      
      <div className="space-x-2 mb-4">
        <button onClick={testList} className="px-4 py-2 bg-blue-600 text-white rounded">
          Test List
        </button>
        <button onClick={testCreate} className="px-4 py-2 bg-green-600 text-white rounded">
          Test Create
        </button>
      </div>

      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
```

### Step 2: Test Each Repository
Work through each test page systematically.

### Step 3: Document Results
Create a test results document showing:
- ✅ Pass / ❌ Fail for each test
- Any errors encountered
- Screenshots of working features

---

## Success Criteria

Backend is considered **fully tested** when:
- ✅ All 7 repositories work correctly
- ✅ Role-based access control verified
- ✅ Cross-org access properly blocked
- ✅ All integration flows complete successfully
- ✅ No console errors
- ✅ Data persists correctly in Supabase

Once all tests pass, you're ready to build the complete UI using your Stitch mockups!

---

## Next Steps After Testing

1. **Import Stitch mockups** - Add designs to project
2. **Build UI components** - Create reusable components
3. **Implement screens** - Build each dashboard screen
4. **Add realtime subscriptions** - Live updates for visit/invoice changes
5. **Final testing** - End-to-end testing with UI
