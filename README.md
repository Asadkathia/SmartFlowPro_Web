# SmartFlowPro Web Admin

Backend implementation for SmartFlowPro Web Admin Dashboard using Direct Supabase Client + RLS approach.

## ✅ Implementation Status

### Completed
- ✅ **Phase 1**: Database Migrations (Channel validation + RLS policies)
- ✅ **Phase 2**: Supabase Client Setup (Browser + Server + Middleware)
- ✅ **Phase 3**: Data Access Layer (7 repositories)
- ✅ Basic UI (Login, Dashboard, Unauthorized pages)

### Remaining
- ⬜ **Phase 4**: Realtime Subscriptions
- ⬜ **Phase 5**: Testing & Verification
- ⬜ Full Dashboard UI

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (SmartFlowPro color palette)
- **Backend**: Supabase (Direct Client + RLS)
- **Auth**: Supabase Auth with JWT

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   └── unauthorized/       # Unauthorized access page
├── lib/
│   ├── supabase/           # Supabase client configuration
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Auth middleware
│   ├── types/              # TypeScript types
│   │   └── database.ts     # Database types
│   └── repositories/       # Data access layer
│       ├── customer-repository.ts
│       ├── job-repository.ts
│       ├── visit-repository.ts
│       ├── payment-repository.ts
│       ├── invoice-repository.ts
│       ├── team-repository.ts
│       └── inventory-repository.ts
└── docs/                   # Documentation
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Features

### Authentication
- Email/password login
- Channel-based access control (blocks technicians)
- JWT session management
- Auto-redirect based on auth state

### Data Access (Repositories)
All repositories use Direct Supabase Client with RLS enforcement:

- **CustomerRepository**: List, get, create, update customers
- **JobRepository**: List, get, create jobs (admin only)
- **VisitRepository**: List, create, update, cancel visits
- **PaymentRepository**: Record payments (admin/accountant only)
- **InvoiceRepository**: List, get, void invoices
- **TeamRepository**: List, invite, update, deactivate team members
- **InventoryRepository**: List, create, update, deactivate items

### Security
- Row-Level Security (RLS) policies enforce org-level access
- Role-based access control (admin, dispatcher, accountant)
- Technicians blocked from web admin
- Audit logging for critical operations

## Role-Based Access

| Role | Access Level |
|------|--------------|
| **Admin** | Full access to all features |
| **Dispatcher** | Customers, jobs, visits (no payments) |
| **Accountant** | Invoices, payments (no job creation) |
| **Technician** | ❌ Blocked (mobile app only) |

## Documentation

- [Backend Implementation Guide](./docs/web_admin_backend_implementation_guide.md)
- [Final Implementation Plan](./docs/web_admin_backend_implementation_plan_final.md)
- [Mobile App README](./MOBILE_APP_README.md)

## Next Steps

1. Implement realtime subscriptions for live updates
2. Build full dashboard UI with data tables
3. Add comprehensive testing
4. Deploy to production
