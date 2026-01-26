-- Fix for user creation issue
-- The error suggests a trigger is trying to access raw_app_metadata which doesn't exist in the public.users table

-- First, let's check if there's a trigger causing this issue
-- Run this in Supabase SQL Editor to see existing triggers:
-- SELECT * FROM information_schema.triggers WHERE event_object_table = 'users';

-- Solution: Create a proper trigger function for handling new user creation
-- This function will be called when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table when a new auth.users record is created
  INSERT INTO public.users (id, email, full_name, org_id, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'org_id')::uuid, NULL),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'technician'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Note: If you're creating users via the Supabase Dashboard or Admin API,
-- you need to ensure the user metadata includes org_id and role:
-- 
-- Example user creation with metadata:
-- {
--   "email": "user@example.com",
--   "password": "password123",
--   "user_metadata": {
--     "full_name": "John Doe",
--     "org_id": "your-org-uuid",
--     "role": "admin"
--   }
-- }
