# User Creation Scripts

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

## Method 1: Using the Bash Script (Recommended)

Run the interactive script:
```bash
./scripts/create-user.sh
```

The script will prompt you for:
- Email
- Password
- Full name
- Organization ID (UUID)
- Role (admin/dispatcher/accountant/technician)

## Method 2: Direct SQL via CLI

```bash
supabase db execute --project-ref pbqbsdmwbjpsvxuuwjiv <<SQL
SELECT auth.create_user(
  email := 'admin@example.com',
  password := 'SecurePassword123!',
  user_metadata := jsonb_build_object(
    'full_name', 'Admin User',
    'org_id', 'your-org-uuid-here',
    'role', 'admin'
  )
);
SQL
```

## Method 3: Using SQL Editor in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- First, run the trigger fix migration if you haven't already
-- (see supabase/migrations/fix_user_creation_trigger.sql)

-- Then create users with:
SELECT auth.create_user(
  email := 'admin@example.com',
  password := 'SecurePassword123!',
  user_metadata := jsonb_build_object(
    'full_name', 'Admin User',
    'org_id', 'your-org-uuid-here',
    'role', 'admin'
  )
);
```

## Getting Your Organization ID

If you don't know your organization ID, run this in SQL Editor:

```sql
SELECT id, name FROM organizations;
```

## Example: Create Test Users

```sql
-- Admin user
SELECT auth.create_user(
  email := 'admin@smartflowpro.com',
  password := 'Admin123!',
  user_metadata := jsonb_build_object(
    'full_name', 'Admin User',
    'org_id', (SELECT id FROM organizations LIMIT 1),
    'role', 'admin'
  )
);

-- Dispatcher user
SELECT auth.create_user(
  email := 'dispatcher@smartflowpro.com',
  password := 'Dispatcher123!',
  user_metadata := jsonb_build_object(
    'full_name', 'Dispatcher User',
    'org_id', (SELECT id FROM organizations LIMIT 1),
    'role', 'dispatcher'
  )
);

-- Accountant user
SELECT auth.create_user(
  email := 'accountant@smartflowpro.com',
  password := 'Accountant123!',
  user_metadata := jsonb_build_object(
    'full_name', 'Accountant User',
    'org_id', (SELECT id FROM organizations LIMIT 1),
    'role', 'accountant'
  )
);
```

## Troubleshooting

### Error: "record new has no field raw_app_metadata"
Run the trigger fix migration first:
```bash
supabase db execute --project-ref pbqbsdmwbjpsvxuuwjiv < supabase/migrations/fix_user_creation_trigger.sql
```

### Error: "Supabase CLI not found"
Install it:
```bash
brew install supabase/tap/supabase
```

### Error: "Not logged in"
Login first:
```bash
supabase login
```
