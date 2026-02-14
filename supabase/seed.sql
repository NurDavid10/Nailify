-- Seed data for local development
-- Run ONLY after migrations have been applied (see supabase/README.md).
--   With Supabase: supabase db reset   (migrations + seed) or  supabase db seed
--   With Docker:   psql $DATABASE_URL -f supabase/seed.sql

-- Sample treatments (skip if any exist)
INSERT INTO public.treatments (id, name_ar, name_he, name_en, duration_minutes, price, is_active)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'مانيكير', 'מניקור', 'Manicure', 45, 80.00, true),
  (gen_random_uuid(), 'باديكير', 'פדיקור', 'Pedicure', 60, 120.00, true),
  (gen_random_uuid(), 'جل صناعي', 'ציפורניים מלאכותיות', 'Gel Nails', 90, 150.00, true)
) AS v(id, name_ar, name_he, name_en, duration_minutes, price, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.treatments LIMIT 1);

-- Sample availability (next 7 days, 09:00–17:00) – adjust dates as needed
-- Uses specific_date from migration 00004
INSERT INTO public.availability_rules (id, specific_date, start_time, end_time, slot_interval_minutes)
SELECT gen_random_uuid(), d::date, '09:00'::time, '17:00'::time, 30
FROM generate_series(current_date, current_date + 6, '1 day'::interval) AS d
WHERE NOT EXISTS (SELECT 1 FROM public.availability_rules LIMIT 1);
