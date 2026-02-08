-- Add atomic booking function to prevent race conditions in double-booking
-- This function checks for conflicts and inserts in a single transaction

CREATE OR REPLACE FUNCTION create_appointment_atomic(
  p_customer_name text,
  p_phone text,
  p_notes text,
  p_treatment_id uuid,
  p_start_datetime timestamptz,
  p_end_datetime timestamptz,
  p_price_at_booking numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict_count int;
  v_new_id uuid;
BEGIN
  -- Lock the appointments table for the duration of this transaction
  -- to prevent race conditions
  LOCK TABLE appointments IN SHARE ROW EXCLUSIVE MODE;

  -- Check for overlapping appointments
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE status = 'booked'
    AND (
      -- New appointment starts during existing appointment
      (p_start_datetime >= start_datetime AND p_start_datetime < end_datetime)
      OR
      -- New appointment ends during existing appointment
      (p_end_datetime > start_datetime AND p_end_datetime <= end_datetime)
      OR
      -- New appointment completely contains existing appointment
      (p_start_datetime <= start_datetime AND p_end_datetime >= end_datetime)
    );

  -- If there are conflicts, raise an exception
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot is no longer available';
  END IF;

  -- Insert the new appointment
  INSERT INTO appointments (
    customer_name,
    phone,
    notes,
    treatment_id,
    start_datetime,
    end_datetime,
    price_at_booking,
    status
  ) VALUES (
    p_customer_name,
    p_phone,
    p_notes,
    p_treatment_id,
    p_start_datetime,
    p_end_datetime,
    p_price_at_booking,
    'booked'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Grant execute permission to authenticated users (for booking)
GRANT EXECUTE ON FUNCTION create_appointment_atomic TO anon;
GRANT EXECUTE ON FUNCTION create_appointment_atomic TO authenticated;
