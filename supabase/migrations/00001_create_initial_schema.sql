-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create helper function to check admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Create public_profiles view
CREATE VIEW public_profiles AS
  SELECT id, role FROM profiles;

-- Create trigger to sync users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create treatments table
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_he text NOT NULL,
  name_en text NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Treatments policies (public read, admin write)
CREATE POLICY "Anyone can view active treatments" ON treatments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all treatments" ON treatments
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert treatments" ON treatments
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update treatments" ON treatments
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete treatments" ON treatments
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Create availability_rules table
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_interval_minutes int NOT NULL CHECK (slot_interval_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

-- Availability rules policies (public read, admin write)
CREATE POLICY "Anyone can view availability rules" ON availability_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage availability rules" ON availability_rules
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  notes text,
  treatment_id uuid NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  price_at_booking numeric(10, 2) NOT NULL CHECK (price_at_booking >= 0),
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies (public insert, admin full access)
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (status = 'booked');

CREATE POLICY "Anyone can view their own appointments" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update appointments" ON appointments
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete appointments" ON appointments
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Create settings table for reminder configuration
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Settings policies (public read, admin write)
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES ('reminders_enabled', 'true');

-- Create index for better query performance
CREATE INDEX idx_appointments_start_datetime ON appointments(start_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_treatments_is_active ON treatments(is_active);
CREATE INDEX idx_availability_rules_day ON availability_rules(day_of_week);
