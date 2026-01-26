-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_interaction_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  technician_id uuid NOT NULL,
  visit_id uuid,
  prompt text NOT NULL,
  response text NOT NULL,
  model text NOT NULL,
  tokens_in integer,
  tokens_out integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_interaction_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_interaction_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT ai_interaction_logs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id),
  CONSTRAINT ai_interaction_logs_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id)
);
CREATE TABLE public.billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE,
  service_call_fee numeric NOT NULL CHECK (service_call_fee >= 0::numeric),
  tax_rate numeric NOT NULL CHECK (tax_rate >= 0::numeric AND tax_rate <= 1::numeric),
  currency text,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_settings_pkey PRIMARY KEY (id),
  CONSTRAINT billing_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_body text NOT NULL CHECK (char_length(message_body) <= 5000),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat_threads(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_in_chat USER-DEFINED DEFAULT 'member'::chat_participant_role,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_participants_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat_threads(id),
  CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text,
  created_by uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_threads_pkey PRIMARY KEY (id),
  CONSTRAINT chat_threads_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT chat_threads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  preferred_contact_method USER-DEFINED DEFAULT 'call'::contact_method,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.employee_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  email text NOT NULL,
  phone text,
  full_name text,
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  status USER-DEFINED DEFAULT 'pending'::invitation_status,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employee_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT employee_invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT employee_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  unit text NOT NULL,
  sale_price numeric NOT NULL CHECK (sale_price >= 0::numeric),
  taxable_default boolean DEFAULT true,
  active boolean DEFAULT true,
  image_path text,
  ai_suggested_price numeric CHECK (ai_suggested_price >= 0::numeric),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  category text,
  description text,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT inventory_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  quote_id uuid,
  invoice_number text NOT NULL,
  status USER-DEFINED DEFAULT 'draft'::invoice_status,
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0::numeric),
  version integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0::numeric),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0::numeric),
  customer_name text,
  customer_email text,
  customer_phone text,
  property_address text,
  visit_title text,
  notes text,
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT invoices_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id),
  CONSTRAINT invoices_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  job_number text NOT NULL,
  customer_id uuid NOT NULL,
  service_type text NOT NULL,
  priority USER-DEFINED DEFAULT 'medium'::job_priority,
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  quote_id uuid,
  type USER-DEFINED NOT NULL,
  reference_id uuid,
  description text NOT NULL,
  unit text NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  taxable boolean DEFAULT true,
  version integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  invoice_id uuid,
  CONSTRAINT line_items_pkey PRIMARY KEY (id),
  CONSTRAINT line_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT line_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT line_items_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.inventory_items(id),
  CONSTRAINT line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  version integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT notes_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id),
  CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC'::text,
  currency text NOT NULL DEFAULT 'USD'::text,
  org_prefix text NOT NULL UNIQUE CHECK (org_prefix ~ '^[A-Z0-9]{1,10}$'::text),
  plan text,
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  method USER-DEFINED NOT NULL,
  reference text,
  received_by uuid NOT NULL,
  received_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  address text NOT NULL,
  latitude double precision CHECK (latitude >= '-90'::integer::double precision AND latitude <= 90::double precision),
  longitude double precision CHECK (longitude >= '-180'::integer::double precision AND longitude <= 180::double precision),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT properties_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.quote_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  approval_status USER-DEFINED NOT NULL,
  method USER-DEFINED NOT NULL,
  recorded_by uuid NOT NULL,
  recorded_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT quote_approvals_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT quote_approvals_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT quote_approvals_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  quote_number text NOT NULL,
  status USER-DEFINED DEFAULT 'draft'::quote_status,
  taxable boolean DEFAULT true,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0::numeric),
  discount_total numeric NOT NULL DEFAULT 0 CHECK (discount_total >= 0::numeric),
  tax_total numeric NOT NULL DEFAULT 0 CHECK (tax_total >= 0::numeric),
  grand_total numeric NOT NULL DEFAULT 0 CHECK (grand_total >= 0::numeric),
  locked_at timestamp with time zone,
  locked_by uuid,
  version integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  notes text,
  terms text,
  expiration_date timestamp with time zone,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT quotes_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id),
  CONSTRAINT quotes_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id)
);
CREATE TABLE public.sequence_counters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['quote'::text, 'invoice'::text, 'job'::text])),
  current_sequence integer DEFAULT 0 CHECK (current_sequence >= 0),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sequence_counters_pkey PRIMARY KEY (id),
  CONSTRAINT sequence_counters_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status USER-DEFINED DEFAULT 'active'::user_status,
  last_login_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.visit_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  visit_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_path text NOT NULL,
  file_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visit_media_pkey PRIMARY KEY (id),
  CONSTRAINT visit_media_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT visit_media_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id),
  CONSTRAINT visit_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.visit_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  visit_id uuid NOT NULL UNIQUE,
  signed_by text NOT NULL,
  signature_path text NOT NULL,
  signed_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visit_signatures_pkey PRIMARY KEY (id),
  CONSTRAINT visit_signatures_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT visit_signatures_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id)
);
CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  job_id uuid NOT NULL,
  technician_id uuid,
  scheduled_start timestamp with time zone NOT NULL,
  scheduled_end timestamp with time zone NOT NULL,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  status USER-DEFINED DEFAULT 'scheduled'::visit_status,
  status_reason text,
  sequence_order integer,
  version integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  signature_url text,
  CONSTRAINT visits_pkey PRIMARY KEY (id),
  CONSTRAINT visits_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT visits_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT visits_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id)
);