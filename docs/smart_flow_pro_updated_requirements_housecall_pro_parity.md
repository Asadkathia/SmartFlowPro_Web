📘 SmartFlowPro – Developer Specification (PRD)

This document is a **developer-first Product Requirements Document** derived from the functional SmartFlowPro spec. It is intended for **engineering teams, Cursor, and system architects**.

---

## 1. System Overview

### 1.1 Product Type
SmartFlowPro is a **role-separated, multi-channel Field Service Management (FSM) SaaS** consisting of:

1. **Web Admin Dashboard** – STRICTLY for internal company management (Admin / Office roles)
2. **Mobile App (Technician Only)** – STRICTLY for field technicians

⚠️ **Important Access Rule (Explicit Requirement)**
- The **Web Dashboard is accessible ONLY by Admin / Owner (and optional office roles)**.
- The **Mobile App is accessible ONLY by Technicians**.
- **Customers do not have accounts, logins, portals, or any SmartFlowPro app.**
- Customer interactions (quote approval, payments) are handled **via call or SMS only** and are **recorded internally by office staff**.

This separation is mandatory and non-negotiable.

---

### 1.2 Target Roles
- Owner / Admin (Web Dashboard only)
- Dispatcher / Office Staff (Web Dashboard only)
- Accountant (Web Dashboard only)
- Technician (Mobile App only)

---

## 2. High-Level Architecture (FINAL – v1)

### 2.1 Backend Stack (Concrete Recommendation)
SmartFlowPro v1 will use a **Supabase-first backend architecture** for speed, security, and scalability.

**Chosen Stack**
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth (JWT-based)
- **Authorization:** Postgres Row Level Security (RLS)
- **API / Business Logic:** Supabase Edge Functions (TypeScript)
- **Realtime:** Supabase Realtime (WebSockets)
- **Storage:** Supabase Storage (images, signatures, documents)
- **Payments (v1):** Manual payment recording by office staff
- **Payments (Phase 2):** Stripe Checkout links + webhooks (optional)
- **AI Integration:** Edge Function proxy (read-only AI assistant)

This stack is the **authoritative backend** for SmartFlowPro v1 and is considered locked.

---

### 2.2 Architectural Principles
- **Multi-tenant by default** (every table scoped by `org_id`)
- **Security-first** (RLS enforces all access rules)
- **Channel-aware** (web_admin vs mobile_technician enforced server-side)
- **Offline-friendly** (mobile app syncs when online)
- **Event-driven where possible** (Realtime subscriptions)

---

### 2.3 Backend Responsibilities

Supabase + Edge Functions handle:
- Authentication & session management
- Role & channel enforcement
- Visit lifecycle state transitions
- Quote → invoice locking rules
- Inventory source of truth
- Internal chat (threads + messages)
- Audit logging
- AI request handling & logging
- Stripe webhooks & payment reconciliation

The mobile app **never writes directly to the database** except through authenticated APIs / Edge Functions.

---

### 2.4 Edge Functions (Authoritative List – v1)

| Function | Purpose |
|--------|--------|
| auth_guard | Validate role + channel for every request |
| visits_today | Fetch technician’s today visits |
| visits_range | Fetch visits for calendar range |
| visits_create | Create visit and assign to technician (web_admin only) |
| visit_state_change | Start / pause / complete visit |
| notes_create | Add visit notes |
| media_upload | Generate signed upload URL for media/signatures |
| media_confirm | Confirm media upload completion and create visit_media/visit_signatures record |
| quotes_create | Create draft quote |
| quotes_update | Update draft quote |
| quotes_delete | Delete draft quote |
| quotes_finalize | Lock quote |
| invoices_create | Create invoice from quote |
| payments_record | Record payment and update invoice status (web_admin only) |
| jobs_create | Create job with auto-generated job_number (web_admin only) |
| inventory_list | Read-only inventory for technicians |
| inventory_create | Create inventory item by technician (with image upload) |
| inventory_ai_price | AI price suggestion for inventory item image |
| inventory_ai_detect | AI auto-detection of item details from image (name, unit, price, SKU) |
| chat_create | Create direct chat |
| chat_group_create | Create group chat (admin only) |
| chat_message_send | Send chat message |
| ai_assist | AI assistant proxy + logging (supports image uploads) |
| ai_web_search | AI-powered web search for technical documentation/troubleshooting |
| invoice_create_draft | Create draft invoice (technician) |
| invoice_preview | Generate invoice preview (technician) |
| invite_employee | Create employee invitation (web_admin only) |
| accept_invitation | Accept employee invitation and create profile |
| quote_approval_record | Record optional quote approval/rejection for internal tracking (web_admin only, optional) |
| stripe_webhook | Handle Stripe events (Phase 2 only – optional) |

---

### 2.5 Realtime Channels

Supabase Realtime channels used in v1:
- `visits:{org_id}` – visit updates
- `chat:{chat_id}` – new messages
- `quotes:{visit_id}` – quote updates

**Realtime limits**:
- Max concurrent subscriptions per user: 50
- Message queue size: 1000 messages per channel (older messages dropped if limit exceeded)
- Connection timeout: 30 seconds (auto-reconnect with exponential backoff)
- **Connection drop handling**: If connection drops during critical operation, show "Reconnecting..." banner, queue operation for retry

---

### 2.6 Flutter Mobile App Responsibilities

The Flutter app is responsible for:
- UI rendering & navigation
- Local caching (Hive)
- Offline queueing of mutations
- Subscribing to realtime updates
- Displaying sync / offline states

---

## 3. Core Data Models (Required Tables – FINAL)

> All tables MUST include `org_id` for tenant isolation.

### 3.1 Organization
- id (uuid)
- name (text)
- timezone (text) - IANA timezone identifier (e.g., "America/New_York")
- currency (text) - ISO 4217 currency code (e.g., "USD", "EUR")
- org_prefix (text, unique) - Short identifier for quote/invoice numbering (e.g., "ABC", "XYZ", max 10 chars, uppercase)
- plan (text, nullable) - Subscription plan tier
- settings (jsonb) - Stores org-specific settings (e.g., file_size_limits, ai_rate_limits, notification_preferences)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.2 User
- id (uuid)
- org_id (uuid)
- full_name (text)
- email (text) - Must be valid email format, unique per org
- phone (text) - E.164 format recommended (e.g., "+1234567890")
- role (admin, dispatcher, accountant, technician)
- status (active, suspended, deactivated)
- last_login_at (timestamptz, nullable)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.3 Customer
- id (uuid)
- org_id (uuid)
- name (text)
- phone (text) - E.164 format recommended
- email (text, nullable) - Must be valid email format if provided
- preferred_contact_method (call | sms)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.4 Property
- id (uuid)
- org_id (uuid)
- customer_id (uuid)
- address (text)
- latitude (double precision, nullable) - Valid range: -90 to 90
- longitude (double precision, nullable) - Valid range: -180 to 180
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.5 Job
- id (uuid)
- org_id (uuid)
- job_number (text, unique per org) - Format: `JOB-{org_prefix}-{incremented_sequence:04d}`, auto-generated using sequence counter (e.g., "JOB-ABC-0001"). Jobs are created in web admin portal and assigned to technicians via web admin.
- customer_id (uuid)
- service_type (text)
- priority (text: low/medium/high)
- notes (text, nullable)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.6 Visit (PRIMARY OPERATIONAL ENTITY)
- id (uuid)
- org_id (uuid)
- job_id (uuid)
- technician_id (uuid)
- scheduled_start (timestamptz)
- scheduled_end (timestamptz)
- actual_start (timestamptz, nullable)
- actual_end (timestamptz, nullable)
- status (scheduled, in_progress, paused, completed, cancelled)
- status_reason (text, nullable)
- sequence_order (integer, nullable) - For route optimization/display order
- version (integer, default 1) - for optimistic locking
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.7 Note
- id (uuid)
- org_id (uuid)
- visit_id (uuid)
- author_id (uuid)
- body (text)
- version (integer, default 1) - for optimistic locking
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.8 InventoryItem
- id (uuid)
- org_id (uuid)
- name (text)
- sku (text, nullable) - Unique per org if provided (cannot duplicate SKU within same org)
- unit (text) - Unit of measurement (e.g., "each", "hour", "lb", "sq ft")
- sale_price (numeric) - Must be >= 0
- taxable_default (boolean)
- active (boolean)
- image_path (text, nullable) - Storage path to item image (uploaded by technician)
- ai_suggested_price (numeric, nullable) - AI-suggested price based on image analysis
- created_by (uuid, nullable) - User who created the item (technician or admin)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.9 BillingSettings
- id (uuid)
- org_id (uuid, unique)
- service_call_fee (numeric)
- tax_rate (numeric) - e.g., 0.1600
- currency (text, nullable) - Can override organization default currency. If null, use `organizations.currency` as default.
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.10 Quote
- id (uuid)
- org_id (uuid)
- visit_id (uuid)
- quote_number (text, format: QT-{org_prefix}-{incremented_sequence:04d}, auto-generated, e.g., "QT-ABC-0001")
- status (draft, finalized, invoiced) - Note: approved/rejected removed as not required for workflow
- taxable (boolean) - Quote-level tax flag: if false, tax_total=0; if true, items of type service/material/service_call_fee are taxable, discount items are never taxable
- subtotal (numeric)
- discount_total (numeric)
- tax_total (numeric) - Calculated based on quote.taxable and line item types
- grand_total (numeric)
- locked_at (timestamptz, nullable)
- locked_by (uuid, nullable)
- version (integer, default 1) - for optimistic locking
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.11 LineItem
- id (uuid)
- org_id (uuid)
- quote_id (uuid)
- type (service, material, service_call_fee, discount)
- reference_id (uuid, nullable) - Only for materials (links to inventory_items.id). Services are free-text descriptions.
- description (text)
- unit (text)
- qty (numeric)
- unit_price (numeric)
- taxable (boolean) - Derived/locked by backend rules: if quote.taxable=true, then service/material/service_call_fee are taxable=true, discount is taxable=false. Not editable by technician in v1. Stored for calculation and future extensibility.
- version (integer, default 1) - for optimistic locking
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.12 Invoice
- id (uuid)
- org_id (uuid)
- visit_id (uuid)
- quote_id (uuid, nullable) - Links to source quote when created from quote
- invoice_number (text, format: INV-{org_prefix}-{incremented_sequence:04d}, auto-generated using sequence counter, e.g., "INV-ABC-0001")
- status (draft, unpaid, partially_paid, paid, void, refunded) - Note: "draft" status allows technicians to create and preview invoices before finalizing
- total (numeric) - Must be >= 0
- version (integer, default 1) - for optimistic locking
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.13 Payment
- id (uuid)
- org_id (uuid)
- invoice_id (uuid)
- amount (numeric) - Must be > 0, cannot exceed remaining invoice balance
- method (cash, bank_transfer, card, stripe_link)
- reference (text, nullable) - Optional reference number (check number, transaction ID, etc.)
- received_by (uuid) - User who recorded the payment
- received_at (timestamptz) - When payment was received (can be in the past for manual entry)
- updated_at (timestamptz)
- created_at (timestamptz)

### 3.14 ChatThread
- id (uuid)
- org_id (uuid)
- type (direct, group)
- title (text, nullable) - Only for group chats
- created_by (uuid)
- updated_at (timestamptz) - Updated when participants are added/removed (group chats only)
- created_at (timestamptz)

### 3.15 ChatParticipant
- id (uuid)
- org_id (uuid)
- chat_id (uuid)
- user_id (uuid)
- role_in_chat (member, admin) - "admin" allows adding/removing members in group chats
- joined_at (timestamptz)
- created_at (timestamptz)

### 3.16 ChatMessage
- id (uuid)
- org_id (uuid)
- chat_id (uuid)
- sender_id (uuid)
- message_body (text) - Max length: 5000 characters
- created_at (timestamptz)

### 3.17 AIInteractionLog
- id (uuid)
- org_id (uuid)
- technician_id (uuid)
- visit_id (uuid)
- prompt (text)
- response (text)
- model (text)
- tokens_in (integer, nullable)
- tokens_out (integer, nullable)
- created_at (timestamptz)

### 3.18 AuditLog
- id (uuid)
- org_id (uuid)
- entity (text)
- entity_id (uuid)
- action (text)
- performed_by (uuid)
- payload (jsonb, nullable)
- created_at (timestamptz)

### 3.19 VisitMedia
- id (uuid)
- org_id (uuid)
- visit_id (uuid)
- uploaded_by (uuid)
- file_path (text)
- file_type (image | video | pdf)
- created_at (timestamptz)

### 3.20 VisitSignature
- id (uuid)
- org_id (uuid)
- visit_id (uuid)
- signed_by (text) - customer name
- signature_path (text) - Storage path to signature image
- signed_at (timestamptz)
- updated_at (timestamptz) - Updated if signature is replaced
- created_at (timestamptz)

### 3.21 EmployeeInvitations
- id (uuid)
- org_id (uuid)
- email (text)
- phone (text, nullable)
- full_name (text, nullable) - Optional full name for the invited employee
- role (admin | dispatcher | accountant | technician)
- invited_by (uuid)
- token (text, unique) - Secure invitation token
- status (pending | accepted | expired)
- expires_at (timestamptz) - Default: 7 days from creation
- created_at (timestamptz)

> Note: This table tracks employee invitations. Invitations expire after 7 days by default. When an employee accepts an invitation, the status is updated to "accepted" and a profile is created.

### 3.22 QuoteApprovals (Optional - for internal tracking)
- id (uuid)
- org_id (uuid)
- quote_id (uuid)
- approval_status (approved | rejected)
- method (call | sms)
- recorded_by (uuid) - User who recorded the approval
- recorded_at (timestamptz)
- notes (text, nullable)
- created_at (timestamptz)

> Note: This table is optional. If quote approvals are not needed, this table can be omitted. Approvals do not block invoice creation.

### 3.23 SequenceCounters (Internal - for number generation)
- id (uuid)
- org_id (uuid)
- entity_type (text) - Values: "quote", "invoice", "job"
- current_sequence (integer, default 0) - Auto-incremented counter per org per entity type (starts at 0, first number is 1)
- updated_at (timestamptz)

> Note: This table manages auto-incrementing sequence numbers for quote numbers, invoice numbers, and job numbers per organization. Use database transactions with `SELECT FOR UPDATE` to ensure atomic increments and prevent race conditions. Sequence numbers are zero-padded to 4 digits (e.g., 0001, 0002). When generating: atomically increment `current_sequence` (0→1, 1→2, etc.), then format the incremented value as `{incremented_sequence:04d}` (e.g., `1` becomes `"0001"`, `2` becomes `"0002"`).

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Channel-Based Access Enforcement (CRITICAL)
Access to SmartFlowPro is controlled by **both role and channel**.

| Role | Web Admin Dashboard | Technician Mobile App |
|------|----------------------|-----------------------|
| Owner / Admin | ✅ Allowed | ❌ Blocked |
| Dispatcher / Office Staff | ✅ Allowed | ❌ Blocked |
| Accountant | ✅ Allowed | ❌ Blocked |
| Technician | ❌ Blocked | ✅ Allowed |

Rules:
- Channel restrictions are enforced at **login** and at **every API call**
- Invalid role-channel access returns **403 Forbidden**
- Mobile app must never expose admin routes

---

### 4.2 Role Permissions (Within Allowed Channel)

| Role | Permissions |
|------|------------|
| Owner / Admin | Full system access, billing, user management, settings, inventory, AI controls |
| Dispatcher / Office Staff | Scheduling, assignments, customers, quotes/invoices (office), internal chat |
| Accountant | Payments, refunds, financial reports |
| Technician | Assigned visits only, notes, photos/media, quotes/line-items, signature, internal chat, AI assist, inventory management (create items with image upload), invoice drafts and previews |

> **Note**: "Owner" refers to the first admin user who creates the organization during onboarding. In the database, Owner is stored as `role = 'admin'`. There is no separate "owner" role in v1 - all organization creators and admins have the same permissions.

RBAC is enforced at:
- API authorization layer
- Database Row-Level Security (RLS)

---

### 4.3 Customer Access Policy (EXPLICIT)
- **Customers do not have accounts, logins, portals, or any SmartFlowPro app**
- Customer communication is handled via **call/SMS only**

## 5. Employee Management & Team Administration (NEW)

### 5.1 Purpose
This module allows a company to **invite, manage, and control access** for all employees while ensuring security, accountability, and scalability.

---

### 5.2 Employee Lifecycle

#### A. Invite Employee Flow
1. Admin navigates to **Settings → Team Management**
2. Clicks **Invite Employee**
3. Enters:
   - Full name
   - Email or phone
   - Role (Admin, Dispatcher, Technician, Accountant)
   - Optional: Branch / Team
4. System generates secure invitation token (expires in 7 days by default)
5. System sends secure invitation link with token
6. Employee completes signup and joins organization
7. Invitation token is marked as accepted or expires after 7 days

**Employee States**
- Invited (pending activation)
- Active
- Suspended
- Deactivated

All state changes are recorded in Audit Logs.

---

### 5.3 Role Assignment & Changes

- Admin can change employee roles at any time
- Optional permission toggles (Phase 2):
  - Can issue refunds
  - Can edit pricing / price book
  - Can view all customers
- Role changes take effect immediately
- All role changes are logged with timestamp and actor

---

### 5.4 Employee Profile Management

Each employee profile includes:
- Personal information
- Assigned role
- Assigned branch / team
- Active / inactive status
- Last login

Admins can:
- Edit profile
- Reset access
- Suspend or deactivate user

---

### 5.5 Offboarding & Deactivation

When an employee is deactivated:
- Login access is immediately revoked
- **Visit reassignment rules**:
  - **Scheduled visits**: Automatically unassigned (technician_id set to null) or reassigned to another technician (admin choice)
  - **In-progress visits**: Admin must manually reassign or cancel (cannot auto-unassign active work)
  - **Paused visits**: Admin must manually reassign or cancel
  - **Completed visits**: Remain assigned to original technician (historical record)
- **Quote/Invoice handling**:
  - Draft quotes remain accessible to admin/office staff
  - Finalized quotes remain valid
  - Invoiced quotes remain immutable
- Historical records remain intact for audit purposes

---

### 5.6 Audit & Security Controls

- Every user action (create, edit, delete, role change) is logged
- Audit logs include: actor, action, entity, timestamp
- Logs are immutable and admin-viewable only

---

## 6. Scheduling & Dispatch Module

### Functional Requirements
- Drag/drop calendar
- Assign technician
- Auto-route suggestion
- ETA calculation

### State Transitions
scheduled → in_progress → completed

### Acceptance Criteria
- Reassigning a visit updates technician view in real time
- Status changes logged in AuditLog

---

## 7. Technician Mobile App

### 7.1 Core Principles
- Technician-only access
- Offline-first for critical workflows
- Large touch targets and high-contrast UI for field use

---

### 7.2 Screen Map (Updated – Matches Stitch Screens)

#### Bottom Navigation (Consistent on all screens)
Tabs (left → right):
1. **Home (Map)**
2. **Scheduled (Calendar)**
3. **Visits**
4. **Chat**
5. **AI Assist**

#### Screens
1) **Login**
- Email/phone + password
- Offline banner + error states

2) **Home (Map-Based Today Screen)**
- Full-screen interactive map
- Pins for assigned jobs
- Floating “Up Next” bottom card (swipe through jobs)
- Pin tap updates the bottom card
- Tap card → opens Visit Details

3) **Scheduled (Calendar Screen)**
- Month view calendar
- Dates show job indicators (dots/count)
- Tapping a date shows that day’s scheduled jobs
- **Completed jobs remain visible but are crossed out**
- Tapping a job opens Visit Details

4) **Visits List**
- Search + filter by status
- Visit cards open Visit Details

5) **Visit Details (Core Hub)**
- Status actions: Start / Pause / Complete
- Sections: Job Summary, Notes, Photos/Media, Line Items (Quotes), Signature

6) **Notes**
- Timeline notes
- Add note (offline supported)

7) **Photos/Media**
- Gallery + upload
- Offline queue + sync states

8) **Line Items / Quote Builder**
- Services, Materials, Service Call Fee (locked), Discounts (optional), Tax toggle, Totals
- Draft → Finalize → Create Invoice

9) **Signature Capture**
- Required for completion

10) **Inventory Management**
- List of inventory items
- Add new item (manual entry with image upload)
- Add item with AI (upload image for automatic item detection and creation)
- AI price suggestion for uploaded images
- Edit item details

11) **Invoice Management**
- Create draft invoice from finalized quote
- Preview invoice (formatted view)
- Edit draft invoice
- Finalize draft invoice

12) **Chat**
- Chat list (direct + group)
- Chat thread (text-only v1)

13) **AI Assist**
- Technician-scoped assistant
- Context = currently assigned visit
- Image upload support for analysis

14) **Profile/Settings**
- Profile details, preferences, logout

---

### 7.3 Acceptance Criteria (Mobile)
- Technician sees only assigned visits
- Home map pins reflect assigned visits
- Calendar shows scheduled + completed (completed crossed out)
- Quote builder matches workflow and locks finalized/invoiced states
- Chat is org-scoped; group chat created by admin only
- AI assist is read-only and visit-scoped

## 8. Quotes, Line Items & Invoicing (Authoritative Workflow – v1)

### 8.1 Quote Lifecycle (FINAL)
- `draft` → `finalized` → `invoiced`

Rules:
- **Technicians can create, edit, and finalize quotes** (with predefined charges like service call fee auto-filled by admin settings)
- **Technicians can create invoices directly from finalized quotes** (no approval required)
- Service call fee is automatically added and locked (matches admin billing settings)
- Material prices are read-only (must match inventory)
- Tax rates are derived from org tax profile; technician can only toggle taxable ON/OFF
- Invoiced quotes are immutable

> Note: Office staff may optionally record quote approvals/rejections for internal tracking purposes (call/SMS confirmation), but this is not required for invoice creation.

---

### 8.2 Office Actions (Call / SMS Model)

#### Optional Quote Approval Recording
Office staff may optionally record quote approvals/rejections for internal tracking:
- approval_status (approved | rejected)
- method (call | sms)
- recorded_by
- recorded_at
- notes (optional)

> Note: This is for internal tracking only. Technicians can create invoices from finalized quotes without waiting for approval. If implemented, use a separate `quote_approvals` table or add optional fields to quotes table.

#### Payment Recording
Office staff must record:
- payment_method (cash | bank_transfer | card | stripe_link)
- reference (optional)
- received_by
- received_at

---

### 8.3 Offline Capability Scope

**Must work offline (v1):**
- View cached visits
- Start / pause visit (queued)
- Add notes (queued)
- Capture signature (queued)
- Capture photos (queued)

**Must NOT work offline (v1):**
- Finalize invoice
- Send chat messages

---

## 8.5 Technician Inventory Management (NEW)

### 8.5.1 Purpose
Technicians can manage their own inventory of parts and materials required for jobs. Items added by technicians become available as materials in the Create Quote module.

### 8.5.2 Inventory Item Creation Flow

Technicians have two options for adding items to inventory:

#### Option A: Manual Entry with AI Price Suggestion
1. Technician navigates to **Inventory** section in mobile app
2. Clicks **Add Item**
3. Enters:
   - Item name (required)
   - Unit of measurement (e.g., "each", "lb", "sq ft")
   - Optional: SKU
4. Takes or uploads a picture of the item
5. System processes image through AI:
   - AI analyzes the image and suggests a price
   - Technician can accept AI-suggested price or enter price manually
6. Technician confirms item details
7. Item is saved to inventory and marked as active
8. Item becomes available in Create Quote module as a material option

#### Option B: AI Auto-Detection (Image-Only)
1. Technician navigates to **Inventory** section in mobile app
2. Clicks **Add Item with AI**
3. Takes or uploads a picture of the item
4. System processes image through AI:
   - AI analyzes the image and automatically determines:
     - Item name (from visual identification)
     - Item category/type
     - Unit of measurement (inferred from item type)
     - Suggested price (based on visual characteristics, brand if visible, and historical data)
     - SKU (if visible in image, e.g., barcode or product label)
   - AI automatically creates the inventory item with all detected details
5. Item is saved to inventory and marked as active (no manual confirmation required)
6. Item becomes immediately available in Create Quote module as a material option
7. Technician can edit AI-detected details after creation if needed

**AI Auto-Detection Capabilities:**
- Visual item identification (product recognition)
- Brand detection (if visible)
- Size/dimension estimation
- Condition assessment
- Price estimation based on market data and historical pricing
- SKU/barcode reading (if visible)
- Unit of measurement inference (e.g., "each" for discrete items, "lb" for weight-based items)

### 8.5.3 AI Price Suggestion (Manual Entry Flow)
- AI analyzes uploaded item image to suggest a price
- AI considers:
  - Item type and category (inferred from image)
  - Visual characteristics (size, condition, brand if visible)
  - Historical pricing data (if available)
- Technician can:
  - Accept AI-suggested price
  - Override with manual price entry
  - Request re-analysis with different image

### 8.5.4 AI Auto-Detection Flow
- AI analyzes uploaded item image to automatically determine all item details
- AI detection includes:
  - **Item name**: Identified from visual recognition (e.g., "HVAC Filter 16x25x1", "Electrical Wire 12 AWG")
  - **Unit of measurement**: Inferred from item type (e.g., "each" for discrete items, "ft" for wire, "lb" for weight-based items)
  - **Price**: Estimated based on:
    - Visual characteristics (size, brand if visible, condition)
    - Market pricing data
    - Historical pricing within organization
  - **SKU**: Extracted from barcode or product label if visible
  - **Category**: Inferred from item type for better organization
- Item is automatically created and saved to inventory
- Technician can review and edit AI-detected details after creation
- If AI cannot confidently determine certain fields, those fields are left empty for technician to fill

### 8.5.5 Inventory Item Availability
- Items created by technicians are immediately available in the Create Quote module
- Items appear in material selection dropdown
- Material prices are read-only (must match inventory sale_price)
- Items can be deactivated by admin (web_admin only)

### 8.5.6 Permissions & Rules
- Technicians can create, view, and edit their own inventory items
- Technicians cannot delete items (admin-only action)
- Admin can view, edit, and deactivate all inventory items (web_admin)
- Inventory items are org-scoped (visible to all technicians in same org)

---

## 9. Invoice Management (Draft & Preview) (NEW)

### 9.1 Purpose
Technicians can create draft invoices and preview them before finalizing. This allows technicians to review invoice details, make adjustments, and ensure accuracy before sending to customers.

### 9.2 Draft Invoice Creation Flow
1. Technician creates a finalized quote (see Section 8.1)
2. Technician selects **Create Invoice** from finalized quote
3. System creates invoice in **draft** status
4. Technician can:
   - Preview invoice (formatted view)
   - Edit invoice details (if still in draft)
   - Finalize invoice (changes status from draft to unpaid)

### 9.2.1 Invoice Generation Method
- Invoices are generated **client-side** in the mobile app.
- System uses the `pdf` and `printing` packages to generate professional, formatted PDF documents.
- PDF generation includes all calculated fields (subtotal, tax, grand total) and professional branding.
- This ensures offline preview capability and immediate availability without server calls.

### 9.3 Invoice Preview
- Preview shows formatted invoice with:
  - Invoice number
  - Customer details
  - Visit/job information
  - Line items (services, materials, fees)
  - Tax breakdown
  - Totals
  - Payment terms (if configured)
- Preview is read-only display (no editing in preview mode)
- Preview can be generated for both draft and finalized invoices

### 9.4 Invoice Lifecycle (Updated)
- **draft** → unpaid (when finalized by technician)
- **unpaid** → partially_paid/paid (via payment recording)
- **partially_paid** → paid (when remaining balance paid)
- **paid** → refunded (creates payment reversal + adjustment record)
- **unpaid** → void (before any payments)

### 9.5 Permissions & Rules
- Technicians can create draft invoices from finalized quotes
- Technicians can preview invoices (draft and finalized)
- Technicians can finalize draft invoices (changes status to unpaid)
- Draft invoices can be edited until finalized
- Once finalized (status = unpaid), invoices follow standard invoice lifecycle rules
- Office staff can view all invoices (draft and finalized) in web_admin

---

## 10. Communication System (CALL / SMS ONLY)

### Purpose
Customers do **not** have accounts, logins, portals, or apps in SmartFlowPro.

All customer interaction is handled **outside the platform** via:
- Phone calls
- SMS messages

SmartFlowPro acts as an **internal operations system only**.

---

### Customer Interaction Model

#### Quotes
- **Technicians create and manage quotes in the Mobile App** (with predefined charges like service call fee)
- Technicians can finalize quotes and create invoices directly (no approval required)
- Quote details may be communicated to customers via **call or SMS** by office staff (optional)
- Office staff may optionally record quote approvals/rejections for internal tracking

#### Invoices & Payments
- Invoices are issued internally
- Payment instructions are communicated via **call or SMS**
- Payments are recorded manually by office staff after confirmation
- Optional: payment links may be sent via SMS (Stripe checkout)

---

### System Rules
- No public or customer-facing UI is required
- No tokenized public pages are required in v1
- All customer-related state changes are triggered by **internal users only**
- All approvals and confirmations must be logged with:
  - Method (Call / SMS)
  - Timestamp
  - Staff member

> Note: Any future customer-facing payment link is **Phase 2** and remains optional.

## 11. Internal Chat & Communication System (v1)

### 11.1 Scope & Purpose
SmartFlowPro includes an **internal-only chat system** for communication between members of the same organization.

- ❌ No customer chat
- ❌ No external messaging
- ✅ Chat is strictly **organization-scoped**

The chat system supports coordination between technicians and office/admin staff.

---

### 11.2 Chat Types

#### Direct (1:1) Chat
- Any user can start a direct chat with **any other member of their organization**
- Allowed combinations:
  - Technician ↔ Technician
  - Technician ↔ Office/Admin
  - Office/Admin ↔ Office/Admin

#### Group Chat
- Group chats can be **created ONLY by Admin / Owner**
- Admin controls participants
- Group membership changes are admin-only actions

---

### 11.3 Capabilities (v1)
- Text messages
- Message timestamps
- Server-ordered delivery

**Out of Scope (Phase 2):**
- Message editing/deleting
- File/image sharing
- Read receipts

---

### 11.4 Permissions & Rules
- Users can only access chats belonging to their organization
- Users cannot add/remove members from group chats
- **Chat participant `role_in_chat` "admin"**: Allows adding/removing members in group chats (admin-only feature, different from org admin role)
- Messages are immutable
- All messages are retained and auditable

---

### 11.5 Technical Notes
- Real-time delivery via WebSockets / Supabase Realtime
- Messages stored with:
  - chat_id
  - org_id
  - sender_id
  - message_body
  - created_at

---

## 12. AI Assistant (Technician-Scoped)

### 12.1 Purpose
SmartFlowPro includes an **AI Assistant** designed to assist technicians during job execution.

AI is **assistive only** and cannot perform autonomous actions.

---

### 12.2 AI Access Scope (STRICT)
AI has **read-only access** to:
- Technician’s **currently assigned visit**
- Job and service description
- Visit notes
- Inventory items (read-only)
- Admin-defined pricing rules

AI does **NOT** have access to:
- Other technicians’ jobs
- Organization-wide analytics
- Billing configuration
- Customer data beyond the active visit

---

### 12.3 Allowed AI Actions
AI may:
- Answer questions about the current job
- Suggest services or materials for the visit
- Help draft quote line items (suggestions only)
- Explain service steps or troubleshooting guidance
- Analyze uploaded images (for inventory price suggestions or general assistance)
- Provide visual analysis of job-related photos
- Auto-detect inventory item details from images (name, unit, price, SKU) and automatically create inventory items
- **AI Web Search**: Perform real-time web searches for technical manuals, installation guides, and troubleshooting steps from trusted manufacturer sources.

AI may NOT:
- Create or modify quotes or invoices
- Change prices, tax rates, or service call fees
- Finalize quotes or generate invoices
- Send messages or perform actions without explicit user confirmation

---

### 12.4 Interaction Model
- AI is available **inside the Technician Mobile App only**
- Accessed via:
  - Floating assistant button, or
  - Contextual panel within Visit Details
- **Image upload support**: Technicians can upload images to AI for analysis (e.g., inventory item photos for price suggestions, job-related photos for troubleshooting)
- All AI outputs are clearly labeled as **suggestions**

---

### 12.5 Safety, Cost & Controls
- AI usage is rate-limited per organization
- **Rate limiting details**:
  - Default: 100 requests/hour per org (configurable)
  - When limit exceeded: Returns 429 error with `Retry-After` header
  - No queuing or auto-retry (user must retry manually)
  - Per-user limits: Optional, can be configured per org
  - Token-based limits: Optional, can cap total tokens per hour/day
- Admin can enable/disable AI Assistant
- All AI prompts and responses are logged (including image analysis requests)
- No background or autonomous AI actions
- **Default AI model**: GPT-4 or Claude (configurable by admin per org)
- Cost caps per org (configurable)

---

## 13. Reporting & Analytics

### Metrics
- Revenue
- Conversion rate
- Technician efficiency

---

## 14. Non-Functional Requirements

- Multi-tenant isolation
- GDPR-ready
- Auditability
- Horizontal scalability

---

## 14. Phase Tags

- Phase 1: Core FSM + payments
- Phase 2: Routing + accounting
- Phase 3: Marketing + predictive AI

---

---

## 15. Authentication, Onboarding & Account Creation (NEW)

### Admin / Company Creation Flow
1. Admin signs up (email + password)
2. Company workspace is created automatically
3. Admin becomes Owner of the organization
4. Admin completes basic setup (industry, timezone, currency)

### Employee Access
- Employees cannot self-register
- Access is granted via Admin invitation only

### Customer Access (EXPLICIT)
- **Customers do not have accounts, logins, portals, or any SmartFlowPro app**
- Customer records are created internally for operational purposes (customer, property, job)
- Customers are contacted via **call/SMS only** and all approvals/payments are recorded by office staff

### Security
- Password reset via email
- Optional 2FA for Admins
- Session expiration enforced

---

## 16. Multi-Tenancy Rules (NEW)

- One user belongs to one organization in v1
- Email addresses are unique per organization
- No cross-organization data access
- All tables must include `org_id`
- Org isolation enforced at API + DB (RLS)

---

## 17. State Machines & Lifecycle Rules (NEW)

### Visit Lifecycle
- scheduled → in_progress → completed
- scheduled → cancelled (web_admin only)
- in_progress → cancelled (web_admin only, requires admin override)
- paused → cancelled (web_admin only, requires admin override)
- **Cancelled visit rules**:
  - Can be rescheduled (admin creates new visit with same job)
  - Can be reassigned to different technician (admin creates new visit)
  - Quotes for cancelled visits remain in draft/finalized state (cannot be invoiced)
  - If quote already invoiced, invoice remains valid (visit cancellation doesn't affect invoiced quotes)
- completed visits are immutable

### Quote Lifecycle
- draft → finalized → invoiced

> Note: Technicians can create invoices directly from finalized quotes. Office staff may optionally record approvals/rejections for internal tracking, but this is not required for invoice creation. "sent/expired" states are not used in v1 because customers do not have a portal.

### Invoice Lifecycle
- **draft** → unpaid (when finalized by technician)
- **unpaid** → partially_paid/paid (via payment recording)
- partially_paid → paid (when remaining balance paid)
- paid → refunded (creates payment reversal + adjustment record)
- unpaid → void (before any payments)
- **Note**: Invoices can be created in "draft" status by technicians for preview and editing before finalization. Draft invoices can be edited until finalized.

State transitions must be validated server-side.

---

## 18. Error Handling & Edge Cases (NEW)

### Error Scenarios

**Payment failure**
- Invoice remains unpaid + retry option
- Example: "Payment processing failed. Please try again or contact support."

**Offline conflicts**
- Optimistic locking with server-side validation: On conflict (409), fetch latest server state, show conflict banner, allow technician to retry where permitted
- Server validates state transitions and timestamps to prevent data loss
- Example: "Sync conflict detected. Server state: Visit already completed. Your local changes were not applied."

**Technician no-show**
- Admin override required
- Example: Admin can manually mark visit as cancelled or reassign to another technician

**Invoice edits after payment**
- Create adjustment record (credit note or adjustment invoice)
- Example: If invoice was paid but needs correction, create adjustment record rather than editing paid invoice

**Quote finalization without line items**
- 422 error: "Quote must have at least one line item before finalization"
- **Validation rule**: Quote must have at least one line item (service_call_fee counts as a line item)
- Example: Technician tries to finalize empty quote → validation error
- Example: Quote with only service_call_fee can be finalized (service_call_fee is a valid line item)

**Payment amount validation**
- 422 error: "Payment amount must be greater than zero"
- 422 error: "Payment amount exceeds remaining invoice balance"
- **Validation rules**:
  - Payment amount must be > 0
  - Sum of all payments for an invoice cannot exceed invoice total
  - If payment would exceed balance, reject with error showing remaining balance
- Example: Invoice total $100, $60 already paid, attempt to record $50 payment → error: "Payment amount exceeds remaining balance of $40"

**Tax calculation (Authoritative Rules)**
- **If `quote.taxable = false`**: `tax_total = 0` (all items treated as non-taxable regardless of `line_item.taxable`)
- **If `quote.taxable = true`**:
  - Items of type `service`, `material`, `service_call_fee` are taxable
  - Items of type `discount` are never taxable
  - Calculate tax per line item: For each taxable line item: `line_tax = (qty * unit_price) * tax_rate`
  - Apply discount proportionally: `taxable_subtotal = sum(taxable line items)`, `discount_ratio = discount_total / subtotal`, `taxable_discount = taxable_subtotal * discount_ratio`
  - `tax_total = sum(line_tax for taxable items) - (taxable_discount * tax_rate)`
- **`line_item.taxable` field**: Exists but is derived/locked by backend rules (not editable by technician in v1). Stored for calculation and future extensibility.
- Example: Quote with `taxable=true`, $100 service + $50 material, 10% tax rate, $10 discount
  - Taxable subtotal = $150, discount ratio = $10/$150 = 0.067, taxable discount = $150 * 0.067 = $10
  - Tax = ($150 * 0.10) - ($10 * 0.10) = $15 - $1 = $14

**Visit completion without signature**
- 422 error: "Signature required for visit completion"
- Example: Technician tries to complete visit → server validates signature exists in `visit_signatures` table

**Service call fee deletion attempt**
- 403 error: "Service call fee line item cannot be deleted"
- Example: Technician tries to delete service call fee → server rejects with clear error message

---

## 19. Notifications & Communication Rules (NEW)

### Channels
- Push notifications
- Email
- SMS / WhatsApp (future)

### Rules
- Appointment reminders
- Quote follow-ups
- Payment reminders
- Status change alerts

Users can configure notification preferences.

---

## 20. Customer & Property Data Model (NEW)

- One customer can have multiple properties
- Properties have geo-coordinates
- Separate billing vs service contacts
- Customer-level notes supported

---

## 21. File & Media Management (NEW)

- Supported formats: images, PDFs, videos
- Max file size defaults (configurable per org):
  - Images: 10MB
  - PDFs: 25MB
  - Videos: 100MB
  - Signatures: 5MB
- Files linked to visits
- Only Admins can delete files
- Audit log for deletions

---

## 22. Search, Filtering & Performance (NEW)

- Search jobs by customer, date, status
- Filter by technician, payment state
- Pagination required for large datasets

---

## 23. API Versioning & Compatibility (NEW)

- Versioned APIs (v1, v2)
- Backward compatibility for mobile apps
- Deprecation policy documented

---

## 24. Environments, Deployment & Monitoring (NEW)

- Environments: dev, staging, production
- Feature flags supported
- Centralized logging
- Error monitoring (e.g. Sentry)

---

## 25. Performance & Scalability Constraints (NEW)

- Target: 100+ users per org
- 10k+ visits per month per org
- Realtime updates under 2s latency
- API response time < 200ms (p95)
- Offline sync < 30s for 100 queued items

---

## 26. Legal, Compliance & Data Policies (NEW)

- GDPR-ready
- **Data retention rules**:
  - Audit logs: Retain for 7 years (compliance requirement)
  - Visit records: Retain indefinitely (business records)
  - Media files: Retain for 7 years, then archive or delete (configurable)
  - Chat messages: Retain for 2 years (configurable)
  - AI interaction logs: Retain for 1 year (configurable)
- Payment compliance via Stripe
- **Data deletion**: On org deletion, all data is soft-deleted (marked as deleted, retained for 30 days, then permanently deleted)

---

## 27. Mobile App Constraints (NEW)

- **Minimum OS versions**:
  - iOS: 14.0+
  - Android: API level 21 (Android 5.0 Lollipop)+
- **Background sync rules**:
  - Sync queue when app comes to foreground
  - Background sync limited to 15 minutes per hour (battery optimization)
  - Critical operations (visit completion) trigger immediate sync attempt
- Battery usage optimization
- **Offline queue priority**: Within same operation type, process by timestamp (FIFO)

---

## 28. AI Safety, Cost & Controls (NEW)

- AI actions require permission
- Rate limits per org
- Cost caps per org
- AI logs visible to Admin

---

---

## 29. Developer Implementation Addendum (NEW)

This addendum removes remaining ambiguity and is intended to be **plug-and-build** guidance.

---

### 29.1 API Contract Overview

#### API Design Rules
- Single API surface (v1) with strict RBAC + channel enforcement
- Every request must include authenticated user context (org_id, user_id, role, channel)
- All write operations must create an AuditLog entry
- **Pagination standards**:
  - All list endpoints require pagination
  - Default page size: 20 items
  - Max page size: 100 items
  - Use cursor-based pagination (recommended) or offset-based
  - Response includes: `data`, `meta: { page, page_size, total, has_more, next_cursor? }`
  - Query params: `?page_size=20&cursor=<token>` or `?page=1&page_size=20`

#### Channels
- `web_admin`
- `mobile_technician`

#### Common Response Shapes
- Success: `{ data: <payload>, meta: { request_id, ts } }`
- Error: `{ error: { code, message, details? }, meta: { request_id, ts } }`

---

### 29.2 Endpoint List (v1) – Updated (No Customer Portal)

#### Auth & Session
- `POST /v1/auth/login` (role+channel validated)
- `POST /v1/auth/logout`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/verify-2fa` (optional; admin only)

#### Organization (web_admin)
- `POST /v1/orgs` (admin onboarding only)
- `GET /v1/orgs/me`
- `PATCH /v1/orgs/me`

#### Team / Employee Management (web_admin)
- `POST /v1/team/invite`
- `GET /v1/team/members`
- `GET /v1/team/members/:id`
- `PATCH /v1/team/members/:id` (role/status updates)
- `POST /v1/team/members/:id/deactivate`

#### Customers & Properties (web_admin)
- `POST /v1/customers`
- `GET /v1/customers`
- `GET /v1/customers/:id`
- `PATCH /v1/customers/:id`
- `POST /v1/customers/:id/properties`
- `GET /v1/properties/:id`

#### Jobs & Visits
Web Admin
- `POST /v1/jobs`
- `GET /v1/jobs`
- `GET /v1/jobs/:id`

- `POST /v1/visits`
- `GET /v1/visits`
- `GET /v1/visits/:id`
- `PATCH /v1/visits/:id`

Technician Mobile
- `GET /v1/tech/visits/today`
- `GET /v1/tech/visits` (supports date range for calendar)
- `GET /v1/tech/visits/:id`
- `POST /v1/tech/visits/:id/start`
- `POST /v1/tech/visits/:id/pause`
- `POST /v1/tech/visits/:id/complete`

#### Notes & Media (mobile_technician)
- `POST /v1/tech/visits/:id/notes`
- `GET /v1/tech/visits/:id/notes`
- `POST /v1/tech/visits/:id/media/upload-url` (request signed URL)
- `POST /v1/tech/visits/:id/media/confirm` (confirm upload completion)
- `GET /v1/tech/visits/:id/media`
- `POST /v1/tech/visits/:id/signature/upload-url` (request signed URL for signature)
- `POST /v1/tech/visits/:id/signature/confirm` (confirm signature upload)

#### Inventory (Source of Truth) (web_admin)
- `POST /v1/inventory/items`
- `GET /v1/inventory/items`
- `GET /v1/inventory/items/:id`
- `PATCH /v1/inventory/items/:id`
- `POST /v1/inventory/items/:id/deactivate`

Inventory (read-only) (mobile_technician)
- `GET /v1/tech/inventory/items`

Inventory (create/manage) (mobile_technician)
- `POST /v1/tech/inventory/items` (create item with image upload - manual entry)
- `POST /v1/tech/inventory/items/ai-detect` (upload image for AI auto-detection - automatically creates item with all details)
- `POST /v1/tech/inventory/items/:id/image/upload-url` (request signed URL for item image)
- `POST /v1/tech/inventory/items/:id/image/confirm` (confirm image upload)
- `POST /v1/tech/inventory/items/:id/ai-price` (request AI price suggestion for uploaded image)
- `GET /v1/tech/inventory/items/:id`
- `PATCH /v1/tech/inventory/items/:id` (update item details)

#### Billing Settings (web_admin)
- `GET /v1/billing-settings` (service_call_fee defaults, tax profiles)
- `PATCH /v1/billing-settings`

#### Quotes & Line Items (mobile_technician)
- `POST /v1/tech/visits/:visitId/quotes` (create draft quote)
- `GET /v1/tech/visits/:visitId/quotes` (list)
- `GET /v1/tech/quotes/:quoteId` (read)
- `PATCH /v1/tech/quotes/:quoteId` (update header fields: taxable flag, notes)

Line Items
- `POST /v1/tech/quotes/:quoteId/line-items` (add service/material/discount/service_fee)
- `PATCH /v1/tech/quotes/:quoteId/line-items/:itemId` (update qty)
- `DELETE /v1/tech/quotes/:quoteId/line-items/:itemId`

Quote Actions
- `POST /v1/tech/quotes/:quoteId/finalize` (locks quote)
- `POST /v1/tech/quotes/:quoteId/create-invoice` (one-way)

Validation Rules (server-side)
- Service call fee is **automatically added** when quote is created and **locked** (must match admin billing settings)
- **Service call fee line item cannot be deleted or modified** - it is permanently locked once created
- Technicians cannot modify service call fee amount, unit price, or description
- **Tax calculation (Authoritative Rules)**:
  - If `quote.taxable = false`: `tax_total = 0` (all items non-taxable)
  - If `quote.taxable = true`: Items of type `service`, `material`, `service_call_fee` are taxable; `discount` items are never taxable
  - Calculate per taxable line item, apply discount proportionally
  - `line_item.taxable` field is derived/locked by backend (not editable by technician in v1)
- Tax rate derived from org tax profile; technician can only toggle quote-level `taxable` ON/OFF
- Material unit prices must match inventory (read-only from inventory)
- Technicians can add services, materials, discounts, but predefined charges (service_call_fee) are locked
- Quote number format: `QT-{org_prefix}-{incremented_sequence:04d}` (e.g., `QT-ABC-0001`) where sequence is auto-incremented per org (increment first, then format)
- Invoice number format: `INV-{org_prefix}-{incremented_sequence:04d}` (e.g., `INV-ABC-0001`) where sequence is auto-incremented per org (increment first, then format)
- Job number format: `JOB-{org_prefix}-{incremented_sequence:04d}` (e.g., `JOB-ABC-0001`) where sequence is auto-incremented per org (increment first, then format). Jobs are created in web admin portal.

#### Invoices & Payments (web_admin)
- `POST /v1/invoices` (also available to technicians via quote)
- `GET /v1/invoices`
- `GET /v1/invoices/:id`
- `PATCH /v1/invoices/:id`
- `POST /v1/invoices/:id/void`
- `POST /v1/invoices/:id/refund` (accountant/admin)
- `POST /v1/invoices/:id/payments` (record payment - accountant/admin only)

Invoices (draft & preview) (mobile_technician)
- `POST /v1/tech/quotes/:quoteId/create-invoice-draft` (create draft invoice from finalized quote)
- `GET /v1/tech/invoices/drafts` (list draft invoices)
- `GET /v1/tech/invoices/:invoiceId` (get invoice details)
- `GET /v1/tech/invoices/:invoiceId/preview` (generate formatted invoice preview)
- `PATCH /v1/tech/invoices/:invoiceId` (edit draft invoice)
- `POST /v1/tech/invoices/:invoiceId/finalize` (finalize draft invoice, changes status to unpaid)

#### Optional Quote Approvals (web_admin, Phase 1)
- `POST /v1/quotes/:quoteId/approval` (record optional approval/rejection for internal tracking)

Stripe Webhooks
- `POST /v1/webhooks/stripe`

#### Internal Chat (web_admin, mobile_technician)
- `POST /v1/chats` (create direct chat)
- `POST /v1/chats/group` (create group chat – admin only)
- `GET /v1/chats` (list user chats)
- `GET /v1/chats/:chatId/messages`
- `POST /v1/chats/:chatId/messages`

Rules:
- Group chat creation requires admin role
- Users may only access chats within their org

#### AI Assistant (mobile_technician)
- `POST /v1/ai/assist` (visit_id required; read-only suggestions; supports image uploads in request body)

Rules:
- AI has no write permissions
- AI prompts/responses are logged (including image analysis)
- Image uploads are processed for visual analysis (e.g., inventory price suggestions, troubleshooting guidance)

#### Notifications
- `GET /v1/notifications` (web_admin, mobile_technician)
- `PATCH /v1/notifications/:id/read`
- `PATCH /v1/preferences/notifications`

#### Audit Logs (web_admin)
- `GET /v1/audit-logs`

### 29.3 State Transition Guard Rules (Authoritative)

#### Visit
Allowed:
- scheduled → in_progress
- in_progress → paused
- paused → in_progress
- scheduled → cancelled (web_admin only)
- in_progress → cancelled (web_admin only, requires admin override)
- paused → cancelled (web_admin only, requires admin override)
- in_progress/paused → completed (requires signature)

Forbidden:
- completed → any other state
- cancelled → in_progress

#### Quote
Allowed:
- draft → finalized
- finalized → invoiced

Forbidden:
- finalized → draft
- invoiced → any other state
- edits to finalized/invoiced quotes (create a revision instead)

#### Invoice
Allowed:
- draft → unpaid (when finalized by technician)
- unpaid → partially_paid/paid (via payment recording)
- partially_paid → paid (when remaining balance paid)
- paid → refunded (refund creates payment reversal + adjustment record)
- unpaid → void (before any payments)

Forbidden:
- void → paid
- paid invoice edits (use adjustments/credit notes)
- **Note**: Invoices can be created in "draft" status by technicians. Draft invoices can be edited until finalized. Once finalized (status = unpaid), invoices follow standard invoice lifecycle rules.

---

### 29.4 Offline Sync Strategy (Mobile Technician)

#### Offline-first Scope
Mobile must cache locally:
- Today’s assigned visits (and next 7 days optional)
- Visit details
- Notes
- Materials
- Photos (queued)
- Signature (queued)

#### Sync Model
- Use a local queue of mutations with timestamps and temporary IDs
- On reconnect, sync in order:
  1) visit status changes
  2) notes
  3) materials
  4) signature
  5) media uploads

#### Conflict Resolution
- **Optimistic locking with server-side validation**: All mutations include timestamps and entity versions
- Visit state transitions validated server-side with version checks (compare `version` field)
- **Offline queue size limit**: Maximum 1000 operations per device. When limit reached, oldest operations are removed (FIFO)
- If local action conflicts (409 Conflict):
  - Show "Sync conflict" banner with details
  - Fetch latest server state automatically
  - **Specific merge strategies**:
    - **Notes**: Append both versions with conflict marker (show both local and server versions)
    - **Line items**: Show diff, let user choose which version to keep
    - **State transitions**: Server wins, show error message with current server state
    - **Media**: Both versions kept, user can delete duplicates later
  - Allow technician to retry where permitted (state transitions)
  - Server validates state transitions and timestamps to prevent data loss

#### Completion Rule
- `complete` action requires signature present locally AND validated server-side
- Server-side validation: Edge Function must verify `visit_signatures` table has a record for the visit_id with valid `signature_path` in Storage before allowing completion
- If signature validation fails → 422 error: "Signature required for visit completion"
- If completion fails to sync, app must:
  - keep visit in "Completion Pending"
  - block new completion attempts until resolved

---

### 29.5 Error Codes & Standards

- 200/201: success
- 400: malformed request
- 401: unauthenticated
- 403: authenticated but forbidden (role/channel)
- 404: not found (scoped within org)
- 409: conflict (offline sync / invalid state transition)
- 422: validation error (missing required fields)
- 429: rate limit (AI + auth brute force)
- 500: server error

Mobile UX rules:
- 401 → force logout and re-auth
- 403 → show “Access denied” and stop
- 409 → show conflict banner + refresh
- 422 → inline field errors

---

### 29.6 Acceptance Criteria (QA-Ready)

#### Technician Mobile: Today’s Visits
- Shows only visits assigned to logged-in technician
- Works offline after first sync
- Displays sync state (Synced/Syncing/Offline)

#### Technician Mobile: Start/Pause/Complete
- Start sets visit to in_progress
- Pause sets visit to paused
- Complete requires signature
- Completed visit becomes read-only

#### Notes & Materials
- Notes are timestamped and persisted offline
- Materials entries persist offline
- Sync restores server IDs without duplicates

#### Media
- Uploads are queued when offline
- Upload progress displayed
- Media locked after completion

#### Security
- Technician cannot access any web_admin endpoint
- Technician cannot read other technicians’ visits
- Customer portal endpoints are inaccessible from mobile_technician channel

#### Audit Logging
- All role changes, invoice actions, and state transitions generate audit logs

---

END OF DEVELOPER SPECIFICATION

