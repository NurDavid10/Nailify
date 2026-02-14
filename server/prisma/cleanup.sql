-- Database cleanup script: Remove Supabase-specific objects

-- Drop RLS policies
DROP POLICY IF EXISTS "Profiles viewable by admins" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active treatments" ON treatments;
DROP POLICY IF EXISTS "Admins can view all treatments" ON treatments;
DROP POLICY IF EXISTS "Admins can insert treatments" ON treatments;
DROP POLICY IF EXISTS "Admins can update treatments" ON treatments;
DROP POLICY IF EXISTS "Admins can delete treatments" ON treatments;
DROP POLICY IF EXISTS "Anyone can view availability rules" ON availability_rules;
DROP POLICY IF EXISTS "Admins can manage availability rules" ON availability_rules;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_appointment_atomic(text, text, text, uuid, timestamptz, timestamptz, numeric, text);
DROP FUNCTION IF EXISTS create_appointment_atomic(text, text, text, uuid, timestamptz, timestamptz, numeric);

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Drop views
DROP VIEW IF EXISTS public_profiles;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS availability_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- Note: We keep the tables and data intact, just remove Supabase-specific security
