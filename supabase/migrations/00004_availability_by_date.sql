-- Switch availability_rules from day-of-week to specific dates

-- Add new column
ALTER TABLE public.availability_rules ADD COLUMN specific_date date;

-- Drop old column and index
DROP INDEX IF EXISTS idx_availability_rules_day;
ALTER TABLE public.availability_rules DROP COLUMN day_of_week;

-- Make specific_date required
ALTER TABLE public.availability_rules ALTER COLUMN specific_date SET NOT NULL;

-- New index on specific_date
CREATE INDEX idx_availability_rules_date ON public.availability_rules(specific_date);
