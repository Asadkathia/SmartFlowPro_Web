# Wiring & Routing Plan

## Goal
Ensure all "Action Buttons" (Create Job, New Customer, etc.) route to working forms and call Repository functions.

## 1. Updates to Repositories (Mock)
Add `create(item)` methods to:
- [ ] `JobRepository`
- [ ] `CustomerRepository`
- [ ] `TeamRepository` (invite)
- [ ] `QuoteRepository`
- [ ] `InvoiceRepository`
- [ ] `InventoryRepository`

## 2. New Routes / Pages
Implement the following pages with Forms:
- [ ] `/dashboard/customers/new`
- [ ] `/dashboard/team/invite` (or `/new`)
- [ ] `/dashboard/quotes/new`
- [ ] `/dashboard/invoices/new`
- [ ] `/dashboard/inventory/new`

## 3. Wiring Existing Pages
- [ ] `/dashboard/jobs/new` -> Wire "Confirm & Create" to `JobRepository.create`.
- [ ] `/dashboard/jobs/[id]` -> Wire "Cancel Job" to `JobRepository.updateStatus`.

## Execution Order
1.  **Repositories**: Batch update all Mock Repos to include `create`.
2.  **Jobs**: Fix `jobs/new` and `jobs/[id]` logic.
3.  **Customers**: Create `customers/new`.
4.  **Team**: Create `team/new`.
5.  **Finance**: Create `quotes/new` and `invoices/new`.
6.  **Inventory**: Create `inventory/new`.
