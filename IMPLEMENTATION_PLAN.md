# SmartFlowPro → Jobber-Style UI Migration Plan

> **Goal**: Replicate Jobber's admin UI patterns (dense typography, nav rail, standardized tables, filter bars, drawers) while keeping SmartFlowPro's existing brand colors unchanged.

**Last Updated**: 2026-01-26

---

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Phase 0: Cleanup](#phase-0-cleanup)
3. [Phase 1: Token & Typography Foundation](#phase-1-token--typography-foundation)
4. [Phase 2: Icon Migration](#phase-2-icon-migration)
5. [Phase 3: Shell Components](#phase-3-shell-components)
6. [Phase 4: Jobs Page Reference](#phase-4-jobs-page-reference)
7. [Phase 5: Remaining Pages](#phase-5-remaining-pages)
8. [Verification Checklist](#verification-checklist)

---

## Current State Analysis

### Tech Stack
| Technology | Version |
|------------|---------|
| Next.js | 15.1.6 (App Router) |
| React | 19 |
| TailwindCSS | 3.4 |
| Radix UI | avatar, dialog, slot |
| Supabase | SSR + supabase-js |
| Icons | Material Symbols (Google Font) + lucide-react (unused) |

### Issues Identified

| Issue | Location | Impact |
|-------|----------|--------|
| Missing Tailwind tokens | `tailwind.config.ts` | Broken button/badge variants |
| Duplicate repositories | `lib/repositories/` | Maintenance confusion |
| Local `cn()` clone | `app/dashboard/team/page.tsx` | Inconsistency |
| Debug console.logs | `app/dashboard/schedule/page.tsx` | ~20 logs polluting console |
| Mixed icon systems | Throughout | Visual inconsistency |
| Wide sidebar (64px) | `components/layout/Sidebar.tsx` | Not Jobber-like |
| No standardized page template | All pages | Each page is custom |

### Missing Tokens (Used by UI Components)
```
ring-ring, ring-offset-background, border-input, 
muted-foreground, accent, accent-foreground,
secondary, secondary-foreground, destructive, 
destructive-foreground, card-foreground, foreground
```

---

## Phase 0: Cleanup

### 0.1 Remove Test Routes
- [x] ~~Delete `app/test/` directory entirely~~

**Files deleted:**
```
✓ app/test/ (entire directory removed)
```

### 0.2 Remove Duplicate Repositories
Keep kebab-case versions, delete PascalCase duplicates:

| ~~Delete (PascalCase)~~ | Keep (kebab-case) |
|---------------------|-------------------|
| ~~`JobRepository.ts`~~ | `job-repository.ts` ✓ |
| ~~`CustomerRepository.ts`~~ | `customer-repository.ts` ✓ |
| ~~`InventoryRepository.ts`~~ | `inventory-repository.ts` ✓ |
| ~~`TeamRepository.ts`~~ | `team-repository.ts` ✓ |
| ~~`FinanceRepository.ts`~~ | (removed - redundant) ✓ |

- [x] ~~Delete `lib/repositories/JobRepository.ts`~~
- [x] ~~Delete `lib/repositories/CustomerRepository.ts`~~
- [x] ~~Delete `lib/repositories/InventoryRepository.ts`~~
- [x] ~~Delete `lib/repositories/TeamRepository.ts`~~
- [x] ~~Delete `lib/repositories/FinanceRepository.ts`~~
- [x] ~~Update all imports to use kebab-case versions~~
- [x] ~~Add type re-exports to kebab-case repositories~~

### 0.3 Fix Local `cn()` Clone
- [x] ~~Edit `app/dashboard/team/page.tsx`:~~
  - ~~Remove lines 157-159 (local `cn()` function)~~
  - ~~Add import: `import { cn } from "@/lib/utils"`~~

### 0.4 Remove Debug Logs
- [x] ~~Edit `app/dashboard/schedule/page.tsx`:~~
  - ~~Remove all `console.log` statements (~20 occurrences)~~

---

## Phase 1: Token & Typography Foundation

### 1.1 Update Tailwind Config
- [x] ~~Edit `tailwind.config.ts` - Add missing tokens:~~

```typescript
✓ Added ring, border, input tokens
✓ Added foreground, card-foreground, muted-foreground tokens  
✓ Added muted, accent, accent-foreground tokens
✓ Added secondary, secondary-foreground tokens
✓ Added destructive, destructive-foreground tokens
```

### 1.2 Update Global CSS
- [x] ~~Edit `app/globals.css` - Add base typography:~~

```css
✓ html { font-size: 14px; }
✓ body { text-foreground bg-background antialiased; }
✓ h1, h2, h3 { font-semibold tracking-tight; }
```

### 1.3 Fix UI Component Tokens

#### Button (`components/ui/button.tsx`)
- [x] ~~Replace `ring-offset-background` → removed~~
- [x] ~~Replace `ring-ring` → `ring-primary`~~

#### Input (`components/ui/input.tsx`)
- [x] ~~Replace `muted-foreground` → `slate-400` (for placeholder)~~
- [x] ~~Removed `ring-offset-background`~~

#### Badge (`components/ui/badge.tsx`)
- [x] ~~Replace `ring-ring` → `ring-primary`~~

#### Card (`components/ui/card.tsx`)
- [x] ~~Replace `text-card-foreground` → `text-foreground`~~
- [x] ~~Reduce CardTitle from `text-2xl` → `text-lg`~~

---

## Phase 2: Icon Migration

### Migration Map: Material Symbols → Lucide

| ~~Material Symbol~~ | Lucide Icon ✓ |
|-----------------|-------------|
| ~~`dashboard`~~ | `LayoutDashboard` |
| ~~`group`~~ | `Users` |
| ~~`person`~~ | `UserCircle` |
| ~~`work`~~ | `Briefcase` |
| ~~`calendar_month`~~ | `Calendar` |
| ~~`format_quote`~~ | `FileText` |
| ~~`receipt_long`~~ | `Receipt` |
| ~~`inventory_2`~~ | `Package` |
| ~~`settings`~~ | `Settings` |
| ~~`water_drop`~~ | `Droplet` |
| ~~`search`~~ | `Search` |
| ~~`notifications`~~ | `Bell` |
| ~~`help`~~ | `HelpCircle` |
| ~~`add`~~ | `Plus` |
| ~~`more_vert`~~ | `MoreVertical` |
| ~~`more_horiz`~~ | `MoreHorizontal` |
| ~~`chevron_left`~~ | `ChevronLeft` |
| ~~`chevron_right`~~ | `ChevronRight` |
| ~~`call`~~ | `Phone` |
| ~~`mail`~~ | `Mail` |

### Files Updated
- [x] ~~`components/layout/Sidebar.tsx`~~
- [x] ~~`components/layout/Header.tsx`~~
- [x] ~~`app/dashboard/jobs/page.tsx`~~
- [x] ~~`app/dashboard/team/page.tsx`~~
- [x] ~~`app/dashboard/schedule/page.tsx`~~

---

## Phase 3: Shell Components

### New Components to Create

```
components/
├── shell/
│   ├── AppShell.tsx          (root layout)
│   ├── SidebarRail.tsx       (56px icon-only nav)
│   ├── Topbar.tsx            (search + Create menu)
│   ├── PageHeader.tsx        (title, subtitle, actions)
│   └── FilterBar.tsx         (search, dropdowns, pills)
├── tables/
│   └── DataTable.tsx         (consistent table)
- Features:
  - Loading skeleton rows
  - Empty state slot
  - Row hover: show actions (kebab + 1 quick action)
  - Row height: 48px
  - Header: uppercase, smaller text

### 3.7 EmptyState.tsx
- [ ] Create `components/feedback/EmptyState.tsx`
- Props: `icon`, `title`, `description`, `action?`
- Centered, subtle styling

### 3.8 Drawer.tsx
- [ ] Create `components/overlay/Drawer.tsx`
- Based on Radix Dialog
- Side panel (right)
- Width: 420px default
- Shadow for overlay effect
- Close button + header

---

## Phase 4: Jobs Page Reference

> Jobs page is the reference implementation. Get this right first, then copy pattern.

### 4.1 Update Dashboard Layout
- [x] ~~Edit `app/dashboard/layout.tsx`:~~
  - ~~Replace `<Sidebar />` + `<Header />` with `<AppShell>`~~
  - ~~Adjust main content wrapper~~

### 4.2 Migrate Jobs Page
- [x] ~~Edit `app/dashboard/jobs/page.tsx`:~~
  - ~~Use `<PageHeader>` for title + "Create Job" button~~
  - ~~Use `<FilterBar>` for search + status dropdown~~
  - ~~Use `<DataTable>` for jobs table~~
  - ~~Add `<Drawer>` for job details on row click~~
  - ~~Update imports to kebab-case repository~~

### Jobs Page Structure (Target)
```tsx
<>
  <PageHeader 
    title="Jobs" 
    subtitle="Manage and track service requests"
    actions={<Button output="Create Job" />}
  />
  <FilterBar 
    searchPlaceholder="Search jobs..."
    filters={statusFilterConfig}
  />
  <DataTable 
    columns={jobColumns}
    data={jobs}
    loading={loading}
    emptyState={<EmptyState ... />}
    rowActions={...}
    onRowClick={openDrawer}
  />
  <Drawer open={drawerOpen} onClose={closeDrawer}>
    <JobDetails job={selectedJob} />
  </Drawer>
</>
```

---

## Phase 5: Remaining Pages
## Phase 5: Apply Pattern to Remaining Pages

> Apply the pattern from Phase 4 to all other list-based pages.

### 5.1 Customers Page
- [x] ~~Edit `app/dashboard/customers/page.tsx`:~~
  - ~~Implement `PageHeader`, `FilterBar`, `DataTable`~~
  - ~~Add `Drawer` for customer details~~
  - ~~Fix imports~~

### 5.2 Team Page
- [x] ~~Edit `app/dashboard/team/page.tsx`:~~
  - ~~Different: Uses Grid/Cards view initially, but switch to `DataTable` for consistency? **Decision: Use DataTable for consistency, optional Grid view later.**~~
  - ~~Implement new shell components~~

### 5.3 Inventory Page
- [x] ~~Edit `app/dashboard/inventory/page.tsx`:~~
  - ~~Implement inputs and shell components~~

### 5.4 Quotes & Invoices Pages
- [x] ~~Edit `app/dashboard/quotes/page.tsx` & `invoices/page.tsx`:~~
  - ~~Make list (table) the default view~~
  - ~~Add "Pipeline" as a secondary tab (Out of Scope for this migration, stick to list first)~~
  - ~~Implement shell components~~

### 5.6 Schedule (Phase 6)
- [x] ~~Edit `app/dashboard/schedule/page.tsx`~~
  - ~~Maintain calendar week/day view~~
  - ~~Wrap with `PageHeader` and customized toolbar~~
  - ~~Improve event styling and interactivity~~
  - ~~Fix fetching logic to use VisitRepository instead of JobRepository~~Drawer
- Clean up styling for consistency

### 5.7 Dashboard Home
- [ ] Edit `app/dashboard/page.tsx`
- Jobber-style "needs attention" tiles
- Recent activity as table (not cards)

---

## Verification Checklist

### Build & Lint
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No console errors in browser

### Visual Checks
- [ ] Sidebar is 56px icon-only rail
- [ ] All icons are Lucide (no Material Symbols)
- [ ] Typography is 14px base
- [ ] Headings are `font-semibold` (not `font-black`)
- [ ] No undefined token errors

### Functionality Checks
- [ ] Navigation works correctly
- [ ] Active nav item highlighted
- [ ] Create dropdown works
- [ ] Search filters work
- [ ] Table row hover shows actions
- [ ] Drawer opens/closes correctly
- [ ] Mobile responsive (nav collapses)

### Page-by-Page
- [ ] `/dashboard` - Dashboard tiles work
- [ ] `/dashboard/jobs` - Full reference pattern
- [ ] `/dashboard/customers` - Table + drawer
- [ ] `/dashboard/invoices` - Table + filters
- [ ] `/dashboard/team` - Table (not cards)
- [ ] `/dashboard/inventory` - Table + badges
- [ ] `/dashboard/quotes` - List + pipeline tab
- [ ] `/dashboard/schedule` - Grid + drawer

---

## Progress Log

| Date | Phase | Items Completed | Notes |
|------|-------|-----------------|-------|
| 2026-01-26 | Planning | Scan + plan created | Ready to begin |
| 2026-01-26 | Phase 0 | Cleanup complete | Removed test routes, duplicate repos, local cn(), debug logs |
| 2026-01-26 | Phase 1 | Tokens + Typography | Added all missing tokens, 14px base, fixed UI components |
| 2026-01-26 | Phase 2 | Icon Migration | Migrated all Material Symbols → Lucide React (20 icons) |
| 2026-01-26 | Phase 3 | Shell Components | Created 8 shell components + dropdown-menu |
| 2026-01-26 | Phase 4 | Jobs Page Migration | Implemented reference page with new shell components |
| 2026-01-26 | Phase 5 | Remaining Pages | Migrated Customers, Team, Inventory, Quotes, Invoices to shell pattern |
| 2026-01-26 | Phase 6 | Schedule Page | Migrated Schedule page, fixed calendar logic, improved styling |
| | | | |

---

## Notes & Decisions

### Icon Decision
**Chosen**: Migrate to `lucide-react`
**Reason**: Already installed, consistent stroke styling, tree-shakable, widely used in Next.js ecosystem.

### Sidebar Design
**Chosen**: 56px icon-only rail with tooltips
**Reason**: Jobber pattern, more content space, cleaner look.

### Colors
**Unchanged**: Primary (#494949), Background (#FFFDF6), Surface (#FFFFFF), Brand palette
**Added**: Only neutral tokens (slate-based) for borders/muted states.
