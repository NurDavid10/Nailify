-- Standalone schema for plain Postgres (e.g. your Docker container).
-- No Supabase/auth dependency. Run this, then run seed.sql.
--
-- Usage:
--   psql "$DATABASE_URL" -f supabase/schema-standalone.sql
--   psql "$DATABASE_URL" -f supabase/seed.sql

-- Treatments
CREATE TABLE IF NOT EXISTS public.treatments (
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

-- Availability by date (matches migration 00004)
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specific_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_interval_minutes int NOT NULL CHECK (slot_interval_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_availability_rules_date ON public.availability_rules(specific_date);

-- Appointments (with created_by)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  notes text,
  treatment_id uuid NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  price_at_booking numeric(10, 2) NOT NULL CHECK (price_at_booking >= 0),
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'canceled')),
  created_by text NOT NULL DEFAULT 'customer' CHECK (created_by IN ('admin', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);
CREATE INDEX IF NOT EXISTS idx_appointments_start_datetime ON appointments(start_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_treatments_is_active ON treatments(is_active);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.settings (key, value) VALUES ('reminders_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Atomic booking function
CREATE OR REPLACE FUNCTION create_appointment_atomic(
  p_customer_name text,
  p_phone text,
  p_notes text,
  p_treatment_id uuid,
  p_start_datetime timestamptz,
  p_end_datetime timestamptz,
  p_price_at_booking numeric,
  p_created_by text DEFAULT 'customer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict_count int;
  v_new_id uuid;
BEGIN
  LOCK TABLE appointments IN SHARE ROW EXCLUSIVE MODE;
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE status = 'booked'
    AND (
      (p_start_datetime >= start_datetime AND p_start_datetime < end_datetime)
      OR (p_end_datetime > start_datetime AND p_end_datetime <= end_datetime)
      OR (p_start_datetime <= start_datetime AND p_end_datetime >= end_datetime)
    );
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot is no longer available';
  END IF;
  INSERT INTO appointments (
    customer_name, phone, notes, treatment_id,
    start_datetime, end_datetime, price_at_booking, status, created_by
  ) VALUES (
    p_customer_name, p_phone, p_notes, p_treatment_id,
    p_start_datetime, p_end_datetime, p_price_at_booking, 'booked', p_created_by
  )
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION create_appointment_atomic TO public;
