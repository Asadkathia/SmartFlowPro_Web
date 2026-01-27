# SmartFlowPro Web Admin → Jobber-Style UI Migration Plan (CLEAN)

**Goal:** Replicate Jobber admin UI patterns (layout, density, navigation, tables, forms, interactions) while keeping SmartFlowPro colors unchanged.

**Scope:** SmartFlowPro Web Admin repo: `Smartflow-webAdmin`.

---
## 1) Current UI — Deep Review (from code)

### 1.1 Confirmed stack
- Next.js 15.1.6 (App Router) + React 19
- TailwindCSS 3.4, `clsx`, `tailwind-merge`, `class-variance-authority`
- Radix primitives (avatar/dialog/slot)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Icons: Material Symbols (google font) + `lucide-react` installed

Key folders:
- `app/login`, `app/dashboard/*`
- `components/layout/*`, `components/ui/*`
- `lib/repositories/*`

### 1.2 Current UI patterns (inventory)
- **Sidebar**: wide `w-64` icon+label nav (`components/layout/Sidebar.tsx`).
- **Topbar**: search + notifications/help (`components/layout/Header.tsx`).
- **Dashboard**: card-heavy, mixed hierarchy (`app/dashboard/page.tsx`).
- **List pages** (Jobs/Customers/Invoices/Inventory): custom filter card + raw `<table>`.
- **Quotes**: Kanban/pipeline is the default view (`app/dashboard/quotes/page.tsx`).
- **Team**: profile card grid (`app/dashboard/team/page.tsx`).
- **Schedule**: custom week/day grid with debug logs (`app/dashboard/schedule/page.tsx`).

### 1.3 Biggest gaps vs Jobber (found in code)
1) **Token mismatch in `components/ui/*`:** many classes assume shadcn tokens that are not defined in `tailwind.config.ts`.
   - Examples: `ring-ring`, `border-input`, `muted-foreground`, `accent`, `secondary`, `destructive`, `card-foreground`.
   - Impact: variants look inconsistent or silently fall back.
2) **Auth page not using theme:** `app/login/page.tsx` uses `bg-cream`, `text-darkGrey`, `bg-darkGrey` (not in Tailwind theme).
3) **Mixed icon language:** Material Symbols are used everywhere but `lucide-react` is also installed.
4) **Page shell not standardized:** each route re-implements its own header, filters, table layout.
5) **Workflow mismatch:** Quotes pipeline-first and Team card-grid are not Jobber-like defaults.
6) **Schedule page has debug logging + hard-coded status colors**, which breaks polish and theming.
7) **Duplicate repository files** exist (`JobRepository.ts` and `job-repository.ts` patterns) → increases maintenance and UI drift.

---

## 2) Jobber UI — What to replicate (without copying colors)

Jobber’s “feel” comes from:
- **Navigation rail discipline**: compact, icon-first, tooltip-driven.
- **High information density**: 14px body, stable spacing, tables as the default view.
- **Standard page template**: header → filter bar → table → pagination.
- **Operational interactions**: hover-reveal row actions, kebab menus, quick actions.
- **Minimal shadows**: borders + subtle surfaces; shadows mainly for overlays.
- **Side drawers** for fast in-context details/edit.

Jobber’s open-source design system is **Atlantis** (components + tokens). Useful reference for patterns:
- Repo: https://github.com/GetJobber/atlantis
- Storybook: https://atlantis.getjobber.com/storybook/

---

## 3) Foundation Phase — Fix consistency first (keep colors)

### 3.1 Add missing semantic tokens (required)
Your shadcn-style UI components assume these token names exist. Add them to Tailwind theme so existing variants render correctly:
- `border`, `input`, `ring`
- `foreground`, `card-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `secondary`, `secondary-foreground`
- `destructive`, `destructive-foreground`

**Rule:** Do not change primary/background/surface colors. For newly introduced tokens, derive values from the existing neutrals.

### 3.2 Typography + density (Jobber-style)
- Make the app default body size **14px**.
- Reduce heading heaviness: replace most `font-black` with `font-semibold`.
- Normalize spacing: fewer oversized paddings and fewer “big hero” headers.

### 3.3 Pick one icon system
Recommendation: switch to **lucide-react** everywhere for consistent stroke and sizing.
- Replace sidebar icons
- Replace header icons
- Replace row action icons

### 3.4 Remove prototype UI drift
- Remove, move, or lock `app/test/*` behind an internal route flag.

### 3.5 Remove duplicate repository implementations
Unify `lib/repositories/*` naming and delete duplicates (`JobRepository.ts` vs `job-repository.ts`) so pages stop diverging.

---

## 4) Build the Jobber-like Page System (core migration)

### 4.1 Create reusable shell primitives
Create these new components (names suggested):

1) `components/shell/AppShell.tsx`
- Wraps SidebarRail + Topbar + main container.
- Controls background, padding, max widths, and sticky header behavior.

2) `components/shell/PageHeader.tsx`
- Title + subtitle + right-side actions.
- Optional breadcrumb slot.
- Optional tabs row (Jobs: Active / Requests / Archived).

3) `components/shell/FilterBar.tsx`
- Search input, status dropdown, date range, quick filter pills.
- Right side: export, bulk actions.

4) `components/tables/DataTable.tsx`
- One table shell used by all list pages.
- Loading skeleton rows + empty states.
- Row hover reveals actions (kebab + 1 quick action).

5) `components/overlay/Drawer.tsx` (Radix Dialog)
- Side drawer for details/edit (Jobber pattern).

### 4.2 Enforce a single page template
Every operational list page should follow:

`PageHeader → FilterBar → DataTable → Pagination`

Rule: avoid recreating page headers and filter cards per route.

---

## 5) Navigation + Header Refactor (Jobber rail)

### 5.1 Sidebar: wide → rail
Current: `components/layout/Sidebar.tsx` is a wide left sidebar.

Target:
- Icon-only rail (56–72px)
- Tooltips
- Active state highlight (use your `primary`)
- Bottom user menu

Implementation:
- Create `SidebarRail.tsx` and move nav items there.
- Keep existing route list; change presentation only.

### 5.2 Topbar: add “Create” menu
Current topbar has search + notifications/help.

Add a primary “Create” dropdown (Jobber pattern):
- New Job
- New Customer
- New Quote
- New Invoice
- Invite Member

---

## 6) UI Component System Cleanup

### 6.1 Fix `components/ui/*` to match your tokens
Update these to avoid broken variants:
- `components/ui/button.tsx`: ensure `default/outline/ghost/link` are clean and consistent; remove undefined token classes or define them.
- `components/ui/input.tsx`: ensure placeholder + focus ring uses tokenized colors.
- `components/ui/badge.tsx`: normalize status pills (height, padding, text size) and map to your existing status colors.
- `components/ui/card.tsx`: reduce `CardTitle` aggressiveness (Jobber avoids huge card headings).

### 6.2 Remove local `cn()` clones
`app/dashboard/team/page.tsx` defines its own `cn()`; replace with `cn` from `lib/utils.ts`.

### 6.3 Standardize icons
Pick **one** icon library and use it everywhere (recommended: lucide).

---

## 7) Page-by-Page Conversion Plan (SmartFlow → Jobber-style)

### 7.1 Dashboard (`/dashboard`)
Current: big stat cards + recent jobs + schedule preview.

Convert to Jobber-style operational dashboard:
- “Needs attention” tiles (Unassigned jobs, Jobs today, Quotes awaiting, Overdue invoices)
- Recent activity as a **table** (not card list)
- Keep one strong CTA in topbar “Create” menu

### 7.2 Jobs List (`/dashboard/jobs`)
Make this the **reference implementation** of the new design system:
- Replace current filter card with `FilterBar`.
- Replace raw table with `DataTable`.
- Row hover actions: View, Edit, Assign, Create Invoice.
- Clicking row opens a `Drawer` summary.

### 7.3 Job Create (`/dashboard/jobs/new`)
Current is a 3-step wizard. Jobber-style is faster if you switch to a single, sectioned form:
- Section: Customer
- Section: Job details
- Section: Schedule & assign
- (Optional) Notes/attachments
Add a sticky bottom action bar: Cancel + Save.

### 7.4 Customers List (`/dashboard/customers`)
- DataTable + FilterBar (search, status, tags if you add later)
- Drawer detail: profile + job history + invoices

### 7.5 Quotes (`/dashboard/quotes`)
Current default is Kanban/pipeline.

Jobber-style approach:
- Make **List** the default view (table) with status, amount, customer, last updated.
- Keep Pipeline as a secondary tab if you still want it.

### 7.6 Invoices (`/dashboard/invoices`)
- Add FilterBar: status (paid/unpaid/overdue), date range.
- DataTable row actions: Send, Mark as paid, Void.
- Detail first in Drawer; full detail page for deep view.

### 7.7 Team (`/dashboard/team`)
Current is card grid.

Jobber-style:
- Default **table list** (name, role, status, phone, email).
- Drawer detail for role/permissions later.

### 7.8 Schedule (`/dashboard/schedule`)
- Remove debug logs.
- Normalize event blocks to subtle, readable styling.
- Click event opens Job drawer.
- Optional later: drag/drop reschedule.

### 7.9 Inventory (`/dashboard/inventory`)
- DataTable + FilterBar.
- Inline low-stock indicator (subtle badge).

### 7.10 Settings (`/dashboard/settings`)
- Use left settings nav + right content panel (Jobber pattern).

### 7.11 Login (`/login`)
- Replace custom classes (`bg-cream`, `text-darkGrey`, etc.) with your semantic tokens for a consistent product feel.

---

## 8) Jobber-style UI rules (enforce everywhere)
- Body: **14px** with consistent line-height.
- Reduce heaviness: replace many `font-black` with `font-semibold`.
- Surfaces: borders + subtle fills; shadows mainly for drawers/modals.
- Tables: consistent row height (target 48px) and padding.
- Actions: 1 primary per page; row actions show on hover.
- Drawer-first detail views for fast workflows.

---

## 9) Execution Phases (recommended order)

### Phase 0 — Cleanup (1–2 days)
- Remove/lock `app/test/*`.
- Unify repository files and delete duplicates.
- Choose 1 icon system and apply it.
- Fix `/login` to use semantic tokens.

### Phase 1 — Tokens + Density (2–3 days)
- Add missing semantic tokens into Tailwind.
- Normalize base typography to 14px.
- Adjust Card/Badge/Button defaults to match Jobber density.

### Phase 2 — Build Page System (3–5 days)
- AppShell + SidebarRail + Topbar (w/ Create menu).
- PageHeader + FilterBar + DataTable + Drawer.
- Convert Jobs list first; treat it as the reference.

### Phase 3 — Convert Core Pages (1–2 weeks)
- Customers, Invoices, Team, Inventory.

### Phase 4 — Workflow polish (1–2 weeks)
- Quotes: list-first + pipeline tab.
- Job Create: wizard → sectioned form + sticky action bar.
- Schedule: remove debug, normalize styling, open job drawer.

---

## 10) Definition of Done (Jobber-style parity)
You’re “there” when:
- Every dashboard route uses the same AppShell + PageHeader.
- Every list route uses FilterBar + DataTable.
- Sidebar is a rail (icon-first) and feels consistent.
- Typography is dense and readable (14px) with calm headings.
- Row actions follow the same pattern (hover reveal + kebab).
- Form screens are sectioned and predictable.
- No page looks like a different app (especially `/login`).

---

## 11) Antigravity workflow (how to execute this efficiently)
- Implement Phase 1 tokens first, then build the shared components.
- Refactor **Jobs list** as the reference and reuse the pattern across other pages.
- Keep changes atomic: one component, then one page, then repeat.
- Maintain a quick QA checklist: spacing, tokens, hover states, loading state, empty state.
