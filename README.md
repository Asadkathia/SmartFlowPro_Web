# SmartFlowPro Web Admin Dashboard

A modern, full-stack web administration dashboard for SmartFlowPro - a field service management platform. Built with Next.js 14, TypeScript, and Supabase.

![SmartFlowPro](https://img.shields.io/badge/SmartFlowPro-Web%20Admin-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🚀 Features

### Core Modules
- **📊 Dashboard** - Real-time business metrics and KPIs
- **👥 Team Management** - Invite and manage team members (Admin, Dispatcher, Accountant, Technician)
- **👤 Customer Management** - Customer profiles with properties and service history
- **🔧 Job Management** - Create, assign, and track service jobs
- **📅 Schedule Calendar** - 24-hour calendar view with drag-and-drop (Week/Day views)
- **💰 Quotes & Invoices** - Financial management with payment tracking
- **📦 Inventory** - Parts and materials management
- **⚙️ Settings** - Organization and billing configuration

### Technical Highlights
- ✅ **Full Supabase Integration** - Real-time database with Row-Level Security (RLS)
- ✅ **Role-Based Access Control** - Admin, Dispatcher, Accountant roles (Technicians blocked)
- ✅ **Responsive Design** - Mobile-first approach with Tailwind CSS
- ✅ **Type-Safe** - Full TypeScript coverage
- ✅ **Server Components** - Next.js 14 App Router with RSC
- ✅ **Real-time Updates** - Live data synchronization via Supabase subscriptions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Material Symbols

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Asadkathia/SmartFlowPro_Web.git
   cd SmartFlowPro_Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Run the SQL migrations in your Supabase SQL editor:
     1. `DB_Complete.sql` - Complete schema
     2. `SETUP_RLS_POLICIES.sql` - Row-Level Security policies
     3. `CREATE_TEST_DATA.sql` - (Optional) Test data

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
SmartFlowPro_Web/
├── app/
│   ├── dashboard/          # Main dashboard routes
│   │   ├── customers/      # Customer management
│   │   ├── jobs/           # Job management
│   │   ├── schedule/       # Calendar view
│   │   ├── team/           # Team directory
│   │   ├── quotes/         # Quote pipeline
│   │   ├── invoices/       # Invoice management
│   │   └── inventory/      # Inventory management
│   ├── login/              # Authentication
│   └── test/               # Backend testing pages
├── components/
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── repositories/       # Data access layer
│   ├── supabase/           # Supabase client & middleware
│   └── types/              # TypeScript definitions
├── docs/                   # Documentation
└── supabase/
    └── migrations/         # Database migrations
```

## 🔐 Authentication & Authorization

### Roles
- **Admin** - Full access to all features
- **Dispatcher** - Job scheduling and customer management
- **Accountant** - Financial operations (quotes, invoices, payments)
- **Technician** - Mobile app only (blocked from web admin)

### Access Control
- Middleware enforces `channel: 'web_admin'` check
- RLS policies ensure org-level data isolation
- Helper functions: `get_user_org_id()`, `can_access_web_admin()`

## 📊 Database Schema

Key tables:
- `users` - Team members with roles
- `customers` - Client records
- `properties` - Service locations
- `jobs` - Service requests
- `visits` - Scheduled appointments
- `quotes` - Estimates
- `invoices` - Bills
- `payments` - Payment records
- `inventory_items` - Parts/materials
- `employee_invitations` - Pending team invites

See `DB_Complete.sql` for full schema.

## 🧪 Testing

Backend repository testing pages available at `/test/*`:
- `/test/customers` - Customer CRUD operations
- `/test/jobs` - Job creation and listing
- `/test/visits` - Visit scheduling
- `/test/invoices` - Invoice management
- `/test/payments` - Payment recording
- `/test/team` - Team invitations
- `/test/inventory` - Inventory operations

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Author

**Asad Kathia**
- GitHub: [@Asadkathia](https://github.com/Asadkathia)

## 🙏 Acknowledgments

- Design inspired by modern SaaS dashboards
- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

---

**Note**: This is the web admin dashboard. The companion mobile app for technicians is in a separate repository.
