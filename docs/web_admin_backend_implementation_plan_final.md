# SmartFlowPro Web Admin - Backend Implementation Plan (FINAL)

> **Approach**: Direct Supabase Client + RLS Policies (No Edge Functions)

This is the finalized backend implementation plan using the Direct Supabase Client method, aligned with the existing mobile app architecture.

---

## Architecture Overview

| Component | Mobile App | Web Admin |
|-----------|------------|-----------|
| **Client** | `supabase_flutter` | `@supabase/supabase-js` |
| **Auth** | JWT + RLS | Same JWT + RLS |
| **Data Access** | `supabase.from().select()` | Same pattern |
| **Realtime** | Channel subscriptions | Same pattern |
| **API Style** | Direct client calls | Direct client calls |

> [!IMPORTANT]
> **No Edge Functions Required** - All data access is handled via the Supabase JS client with Row-Level Security (RLS) policies enforcing access control.

---

## Implementation Phases

### ~~Phase 1: Database Migrations (P0 - Foundation)~~ ✅ COMPLETED

#### ~~Migration 1: Channel Validation Functions~~
- [x] ~~Create `request_channel` enum type~~
- [x] ~~Create `validate_channel_access()` function~~
- [x] ~~Create `get_user_org_id()` helper function~~
- [x] ~~Create `get_user_role()` helper function~~
- [x] ~~Create `is_admin()` helper function~~
- [x] ~~Create `can_access_web_admin()` helper function~~

#### ~~Migration 2: Web Admin RLS Policies~~
- [x] ~~Customers table policies (SELECT, INSERT, UPDATE)~~
- [x] ~~Properties table policies (ALL)~~
- [x] ~~Jobs table policies (SELECT, INSERT-admin only, UPDATE)~~
- [x] ~~Visits table policies (SELECT, INSERT, UPDATE)~~
- [x] ~~Quotes table policies (SELECT)~~
- [x] ~~Invoices table policies (ALL)~~
- [x] ~~Payments table policies (INSERT-admin/accountant only, SELECT)~~
- [x] ~~Users table policies (SELECT, UPDATE-admin only)~~
- [x] ~~Employee invitations policies (INSERT, SELECT-admin only)~~
- [x] ~~Inventory items policies (ALL)~~
- [x] ~~Billing settings policies (ALL-admin only)~~
- [x] ~~Audit logs policies (SELECT-admin only)~~
- [x] ~~Organizations table policies (UPDATE-admin only)~~

---

### Phase 2: Frontend Supabase Integration (P1)

#### Supabase Client Setup
- [ ] Create `lib/supabase/client.ts` - Initialize Supabase JS client
- [ ] Create `lib/supabase/middleware.ts` - Auth session handling
- [ ] Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

#### Auth Implementation
- [ ] Login with channel validation (`web_admin` channel)
- [ ] Role-based route protection (admin, dispatcher, accountant only)
- [ ] Session management with JWT refresh

---

### Phase 3: Data Access Layer (P1)

#### Repository Pattern (matching mobile app architecture)

Each feature module will have a repository for Supabase queries:

```
lib/
├── features/
│   ├── customers/
│   │   └── repositories/customer-repository.ts
│   ├── jobs/
│   │   └── repositories/job-repository.ts
│   ├── visits/
│   │   └── repositories/visit-repository.ts
│   ├── invoices/
│   │   └── repositories/invoice-repository.ts
│   ├── payments/
│   │   └── repositories/payment-repository.ts
│   ├── team/
│   │   └── repositories/team-repository.ts
│   └── inventory/
│       └── repositories/inventory-repository.ts
```

#### Example Query Patterns

```typescript
// List customers with pagination
const { data, count } = await supabase
  .from('customers')
  .select('*, properties(*)', { count: 'exact' })
  .eq('org_id', orgId)
  .range(offset, offset + pageSize - 1)

// Record payment (RLS enforces admin/accountant role)
const { data, error } = await supabase
  .from('payments')
  .insert({ invoice_id, amount, method, received_by: userId })
```

---

### Phase 4: Realtime Subscriptions (P2)

- [ ] Visits channel - Calendar updates
- [ ] Invoices channel - Payment status changes
- [ ] Quotes channel - New quote notifications
- [ ] Chat channel - Messaging (shared with mobile)

---

### Phase 5: Testing & Verification

- [ ] SQL test script for RLS policy verification
- [ ] Manual testing of role-based access
- [ ] Cross-org access denial verification

---

## Database Tables (Existing - 23 Tables)

All tables already exist from mobile app:

| Table | Web Admin Access |
|-------|------------------|
| organizations | Read/Update (admin) |
| users | Read/Update (admin) |
| customers | Full CRUD |
| properties | Full CRUD |
| jobs | Read/Create(admin)/Update |
| visits | Full CRUD |
| quotes | Read only |
| invoices | Full CRUD |
| payments | Create (admin/accountant) |
| inventory_items | Full CRUD |
| billing_settings | Admin only |
| audit_logs | Admin read only |
| employee_invitations | Admin only |

---

## Summary

| Phase | Status | Components |
|-------|--------|------------|
| 1. Database Migrations | ✅ COMPLETED | 2 migrations |
| 2. Supabase Client Setup | ⬜ TODO | 3 files |
| 3. Data Access Layer | ⬜ TODO | 7 repositories |
| 4. Realtime | ⬜ TODO | 4 channels |
| 5. Testing | ⬜ TODO | 1 test file |

**Estimated Timeline**: 2-3 days (significantly reduced from 5 days by using Direct method)

---

## Key Decision: Direct Client vs Edge Functions

| Aspect | Direct Client (CHOSEN) | Edge Functions |
|--------|------------------------|----------------|
| Complexity | ✅ Simpler | ❌ More code |
| Maintenance | ✅ Less files | ❌ 27 functions |
| Security | ✅ RLS policies | ✅ Code-based |
| Consistency | ✅ Same as mobile | ❌ Different pattern |
| Deploy | ✅ Nothing extra | ❌ Function deploys |

**Conclusion**: Direct Supabase Client with RLS is the optimal choice for consistency with the mobile app architecture.
