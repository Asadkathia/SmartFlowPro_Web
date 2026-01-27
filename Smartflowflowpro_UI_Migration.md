 SmartFlowPro Web Admin → Jobber-Style UI Migration Plan (CLEAN)
**Objective:** Convert the current SmartFlowPro Web Admin UI into a **Jobber-like admin experience** (layout, density, patterns, interactions) **while keeping SmartFlowPro’s existing brand colors unchanged**.

**Repo reviewed:** `Smartflow-webAdmin` (Next.js 15 App Router + React 19 + Tailwind + Radix + Supabase)  
**Deliverable:** One execution plan to move from current UI → Jobber-style UI with clear phases, component refactors, and page-by-page instructions.

---

## 1) Current Codebase – What You Have Today (Deep Review)

### 1.1 Tech Stack (confirmed)
- **Next.js 15.1.6** (App Router), **React 19**
- **TailwindCSS 3.4**
- **Radix UI** primitives (`@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`)
- Utility libs: `clsx`, `tailwind-merge`, `class-variance-authority`
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`)
- Icons: **Material Symbols** (global font) + `lucide-react` in deps

Repo structure (important paths):
- Layout: `components/layout/Sidebar.tsx`, `components/layout/Header.tsx`, `app/dashboard/layout.tsx`
- UI primitives: `components/ui/*` (shadcn-like patterns)
- Pages: `app/dashboard/*` (jobs/customers/invoices/quotes/schedule/team/inventory/settings)
- Prototypes: `app/test/*` (older/experimental UI)

### 1.2 UI Architecture Pattern (what’s happening)
Most pages are built as:
- A custom page header (H1 + subtitle + CTA)
- A custom filter box (search/select/buttons)
- A raw HTML table (jobs/customers/invoices)
- One-off card layouts (dashboard/team/quotes)

This is **not** a reusable page system yet—Jobber-style parity requires page-level standardization.

### 1.3 “Hard” UI Problems Blocking Consistency (must fix first)

#### A) Missing Semantic Tokens (major)
Your UI components are shadcn-inspired and use classes like:
- `ring-ring`, `border-input`, `placeholder:text-muted-foreground`
- `bg-accent`, `text-foreground`, `text-card-foreground`
- `bg-secondary`, `bg-destructive`, `text-secondary-foreground`, etc.

But `tailwind.config.ts` only defines:
- `primary`, `background`, `surface`, `text.primary/secondary`, and some status colors.

✅ Result: **multiple variants are either broken, inconsistent, or silently falling back** to defaults.  
**Fix:** Implement a proper token layer (Section 3).

#### B) Auth Pages Ignore Tokens
`app/login/page.tsx` uses non-configured classes like:
- `bg-cream`, `text-darkGrey`, `bg-darkGrey`

This is a visual “different product” experience.

#### C) Mixed Icon Systems
- Material Symbols used across layout/pages
- `lucide-react` included but not consistently used  
**Fix:** choose one system (Jobber-like = consistent icon language).

#### D) Prototype Routes Pollute Design Language
`app/test/*` contains older/alternate UI patterns.
**Fix:** remove/lock behind feature flag, or migrate fully.

---

## 2) Jobber UI – What You’re Replicating (Style + System)

### 2.1 What makes Jobber “feel” like Jobber
Jobber’s admin UI is not about colors. It’s about:
- **Navigation rail discipline** (compact, icon-first, tooltips)
- **Information density** (14px text, 44–52px table rows, stable layouts)
- **Reusable page shell** (header → filters → table → pagination)
- **Operational language** (workflows + statuses)
- **Row-based actions** (hover reveals, kebab menus, quick actions)
- **Minimal shadow** (borders and subtle surfaces)
- **Drawers/side panels** for details (fast “in context” editing)

Jobber maintains an open design system called **Atlantis** (components + tokens).  
Reference: Atlantis repo & docs.  
- Atlantis repo: https://github.com/GetJobber/atlantis  
- Atlantis Storybook: https://atlantis.getjobber.com/storybook/

**Important:** You are NOT adopting Jobber colors. You are adopting the **system and patterns**.

---

## 3) Foundation Phase (Week 1) — Make Consistency Possible

### 3.1 Implement Semantic Design Tokens (Tailwind + CSS variables)
You must decide **one** of these approaches:

#### Option A (Recommended): Tailwind semantic colors (no CSS variables)
Add missing token names into `tailwind.config.ts` so existing component classes resolve correctly.

Add:
- `border`, `input`, `ring`
- `muted`, `muted-foreground`
- `foreground`, `card-foreground`
- `accent`, `accent-foreground`
- `secondary`, `secondary-foreground`
- `destructive`, `destructive-foreground`

**Rule:** keep your brand colors exactly. Use neutrals derived from slate/gray only where needed for borders/backgrounds.

#### Option B: shadcn-style CSS variables (more scalable)
Create CSS variables in `app/globals.css` and map them to Tailwind config.
This gives you Jobber-level theme control.

**Either option is acceptable. Pick one and apply everywhere.**

---

### 3.2 Create “Jobber Density” Base Styles
Define global defaults:
- Base font size: **14px** on app pages (not on marketing pages)
- H1 size should drop from `text-3xl` to ~`text-2xl` or `text-[22px]`
- Reduce CardTitle default from `text-2xl` to `text-base` or `text-lg`
- Remove unnecessary bold weights (`font-black` is non-Jobber)

Concrete edits:
- `components/ui/card.tsx`: change CardTitle default
- Page headers: replace repeated H1 patterns with `PageHeader` component (Section 4)

---

### 3.3 Pick One Icon System
Jobber-style: simple, consistent icons with predictable stroke weight.

**Recommendation:** Use `lucide-react` everywhere (already installed).
- Keep Material Symbols only if you want, but do not mix.

Tasks:
- Replace sidebar icons (Material → lucide)
- Replace header icons (notifications/help)
- Replace common row icons in tables

---

## 4) Build the “Jobber Page System” (Week 1–2)

This is the core migration. If you skip this, pages will remain inconsistent forever.

### 4.1 Create Core Layout + Page Primitives
Add these components:

1) `components/shell/AppShell.tsx`
- Wraps sidebar rail + topbar + main container
- Controls widths, padding, background, sticky header rules

2) `components/shell/PageHeader.tsx`
- Title + subtitle + right-side actions
- Optional breadcrumb slot
- Optional “tabs” row under header (for Jobber-like sections)

3) `components/shell/FilterBar.tsx`
- Search input
- Status dropdown
- Date range
- Quick filter pills (e.g., Needs action)
- Right side: export / bulk actions

4) `components/tables/DataTable.tsx`
- Table shell with:
  - sticky header (optional)
  - empty state
  - loading skeleton rows
  - row hover reveal actions slot
  - consistent padding and row height
- Do not build raw tables per page anymore.

5) `components/feedback/EmptyState.tsx`
- One primary action
- Neutral copy
- Optional helper text

6) `components/overlay/Drawer.tsx` (Radix Dialog-based)
- Side panel for details/edit (Jobber-like)
- Use for “View job”, “Edit customer”, etc.

---

### 4.2 Standard Page Template (enforced)
Every operational list page must use:

**`PageHeader → FilterBar → DataTable → Pagination`**

Rules:
- Filters never float randomly in a white card box unless needed
- Tables look the same across Jobs/Customers/Invoices/Inventory/Team
- Row actions appear on hover (kebab + quick action)

---

## 5) Navigation Refactor (Week 2)

### 5.1 Convert Sidebar to Jobber-like Rail
Current: `Sidebar.tsx` is `w-64` with labels.

Target:
- **Icon-only rail** (56–72px)
- Tooltip on hover
- Active indicator: subtle pill highlight
- Bottom user avatar menu remains

Implementation:
- `SidebarRail.tsx`:
  - icon buttons as links
  - `title` + tooltip component
  - active state styling with your brand colors

Optional (Jobber-like):
- Rail + secondary nav panel for some sections (e.g., Settings)
- Keep it simple initially: rail only.

### 5.2 Topbar Improvements
Current: search only + notifications/help.

Target:
- Search (global)
- “Create” button (Jobber pattern: quick create)
- Notifications (optional)
- Help

Add:
- `CreateMenu` dropdown: New Job, New Customer, New Invoice, New Quote, Invite Member

---

## 6) Component System Cleanup (Week 2)

### 6.1 Fix `components/ui/*` to match your tokens
You have shadcn-like components but missing theme support.

Tasks:
- Update `button.tsx` variants:
  - Remove `bg-secondary` if not defined (or define it)
  - Remove `bg-destructive` if not defined (or define it)
  - Ensure `outline`, `ghost`, `link` match Jobber restraint
- Update `input.tsx`:
  - Replace `placeholder:text-muted-foreground` with actual token
  - Ensure focus ring uses brand primary but subtle (opacity)
- Update `badge.tsx`:
  - Ensure status badges are readable and consistent
  - Make badge height consistent (Jobber uses compact pills)

### 6.2 Remove “local cn() clones”
`app/dashboard/team/page.tsx` defines its own `cn()` at bottom.
Replace with `cn` from `lib/utils.ts`.

### 6.3 Remove duplicate repository naming
You have both:
- `lib/repositories/JobRepository.ts` and `job-repository.ts` (same for others)

Pick one convention:
- **Preferred:** `JobRepository.ts` (PascalCase) OR `job.repository.ts` (consistent)
Then delete the duplicates.

---

## 7) Page-by-Page Migration Plan (Week 3–5)

### 7.1 Dashboard (convert to Jobber-style “Action Dashboard”)
Current:
- Stats cards: totals + revenue
- Recent jobs list
- Schedule preview cards

Target:
- “Needs attention” tiles:
  - Jobs unassigned
  - Jobs scheduled today
  - Quotes awaiting approval
  - Invoices overdue / unpaid
- Recent activity table (not card list)
- Quick create menu stays in topbar

Implementation:
- Use `StatTiles` with a strict card template:
  - label, count, tiny helper, action link
- Replace colored schedule blocks with neutral list/table
- Use consistent typography (no `font-black`)

---

### 7.2 Jobs List (`/dashboard/jobs`)
Current:
- Custom filter card
- Raw table

Target:
- Use `PageHeader + FilterBar + DataTable`
- Default filter: “Needs action” (Jobber mindset)
- Row hover actions:
  - View
  - Edit
  - Assign tech
  - Create invoice
- Clicking row opens **Drawer** with job summary

Also fix:
- Remove `hover:text-blue-600` (blue is not your brand)
- Replace with brand primary hover style

---

### 7.3 Job Create (`/dashboard/jobs/new`)
Current:
- 3-step wizard inside a Card

Target:
- Single-page Jobber-style form:
  - Section 1: Customer
  - Section 2: Job details
  - Section 3: Schedule & assign
  - Section 4: Notes/attachments (future)
- Sticky bottom bar:
  - Cancel (left)
  - Save job (right)

Optional:
- Customer selection via searchable combobox (drawer or modal)
- “New customer” as secondary action

This is a big Jobber feel upgrade.

---

### 7.4 Customers List + Detail
Current:
- Table list is okay but inconsistent token usage
- Detail page likely basic

Target:
- Customers list uses DataTable + Drawer details
- Detail page uses:
  - left: customer profile + contact
  - right: properties + job history + invoices
- Keep everything in consistent sections, no random cards

---

### 7.5 Quotes
Current:
- Kanban pipeline UI

Target:
- Default = table list view with statuses (Jobber-like)
- Optional secondary tab: Pipeline (keep your Kanban as a secondary view if you want)

Implementation:
- Quotes page becomes:
  - Tabs: “List” (default) / “Pipeline”
  - List uses DataTable
  - Pipeline uses existing UI but with normalized card styles

---

### 7.6 Invoices
Current:
- Table list, no filters

Target:
- FilterBar with:
  - status (paid/unpaid/overdue)
  - date range
  - amount range (optional)
- Row hover actions:
  - Send invoice
  - Mark as paid
  - Void

Invoice detail:
- Drawer summary first, full page for deep view

---

### 7.7 Schedule
Current:
- Custom week/day grid
- Debug logs
- Hard-coded colors

Target:
- Jobber-style scheduling:
  - Clear header controls (date, view, filters)
  - Tech filter
  - Drag & drop (optional later)
  - Event blocks consistent, subtle, readable
- Remove debug logs
- Replace event colors with:
  - status badge + subtle tint (derived from your palette, not random)

Implementation notes:
- Keep your existing grid initially
- Add:
  - technician column grouping (optional)
  - click event → opens Job drawer
  - hover shows quick actions (reassign, reschedule)
- If you want full parity later, introduce a calendar lib + DnD.

---

### 7.8 Team
Current:
- Card grid directory

Target:
- Table list (Jobber-like) with:
  - Name, Role, Status, Phone, Email
  - Row hover actions: edit, deactivate, reset password (future)
- Member detail drawer: permissions, assignments, stats (future)

---

### 7.9 Inventory
Target:
- DataTable + filterbar
- Inline quantity + reorder threshold visuals (Jobber-like)

---

### 7.10 Settings
Target:
- Left vertical nav inside settings
- Right panel content (Jobber pattern)
- Remove “random” standalone layout

---

## 8) UI/UX Rules to Enforce (Jobber Discipline)

### 8.1 Visual hierarchy
- H1 small, strong
- Use spacing, not size
- Avoid over-bold
- Status = pills, not loud colors

### 8.2 Shadows
- Only for overlays (drawer/modal)
- Cards and lists = borders

### 8.3 Density
- Base text 14px
- Table row height: 48px
- Table padding: 16px (cell), 12px vertical

### 8.4 Actions
- One primary action per page
- Row actions hidden until hover (kebab + 1 quick action)
- Confirm destructive actions

---

## 9) Implementation Checklist (Phased)

### Phase 0 — Cleanup (1–2 days)
- Remove or isolate `app/test/*`
- Remove duplicate repositories (`*Repository.ts` vs `*-repository.ts`)
- Standardize icons (choose lucide)
- Normalize auth page styling to tokens

### Phase 1 — Token Layer (2–3 days)
- Add missing semantic colors
- Implement base typography + density rules
- Ensure UI primitives compile with token classes

### Phase 2 — Page System (3–5 days)
- AppShell + SidebarRail + Topbar
- PageHeader + FilterBar + DataTable + EmptyState + Drawer
- Convert Jobs list first (as reference)

### Phase 3 — Convert Core Pages (1–2 weeks)
- Customers list + drawer detail
- Invoices list + filters
- Team list (table)
- Inventory list

### Phase 4 — Workflow + Advanced UX (1–2 weeks)
- Quotes default list + optional pipeline
- Job create refactor (wizard → sections)
- Schedule parity improvements
- Global create menu + quick actions

---

## 10) Definition of Done (Jobber-style parity)
You’re “there” when:
- Every page uses the same page shell
- All list pages share the same DataTable
- Sidebar is rail-based and calm
- Typography is dense and readable
- Row actions feel operational
- Forms are sectioned, predictable, and fast
- No page looks like a different app (auth, dashboard, settings all match)

---

## 11) Antigravity Execution Notes (How to use this plan in your IDE)

When implementing each phase, use this structure:
1) Create/modify components in `components/shell/*`, `components/tables/*`, `components/overlay/*`
2) Replace page code one route at a time (Jobs as reference)
3) Run UI review checklist:
   - spacing, density, tokens, hover actions, empty state, loading state

Recommended order to refactor pages:
1) `/dashboard/jobs`
2) `/dashboard/customers`
3) `/dashboard/invoices`
4) `/dashboard/team`
5) `/dashboard/inventory`
6) `/dashboard/quotes`
7) `/dashboard/schedule`
8) `/dashboard/settings`
9) `/login`

---

## Appendix A — Concrete “Gap List” (by file)

### Tokens & theme
- `components/ui/button.tsx` uses undefined tokens: `ring-ring`, `border-input`, `bg-accent`, `bg-secondary`, `bg-destructive`, etc.
- `components/ui/input.tsx` uses `muted-foreground`
- `components/ui/card.tsx` uses `text-card-foreground`
- `components/ui/badge.tsx` uses `ring-ring`, `secondary`, `foreground`

### Layout
- `components/layout/Sidebar.tsx`: wide sidebar with labels (not Jobber rail)
- `components/layout/Header.tsx`: missing create menu + inconsistent button variants

### Pages
- `app/login/page.tsx`: uses classes not defined in Tailwind theme
- `app/dashboard/quotes/page.tsx`: pipeline-first (Jobber is list-first)
- `app/dashboard/team/page.tsx`: card grid (Jobber is list-first)
- `app/dashboard/jobs/new/page.tsx`: wizard (Jobber is sectioned single form)
- `app/dashboard/schedule/page.tsx`: debug logs + hard-coded color classes
