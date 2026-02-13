import { supabase } from './supabase';
import type { Treatment, AvailabilityRule, TimeSlot } from '@/types/index';

// Treatments
export async function getTreatments(activeOnly = true) {
  let query = supabase.from('treatments').select('*').order('name_en');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getTreatmentById(id: string) {
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTreatment(treatment: Omit<Treatment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('treatments')
    .insert([treatment])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateTreatment(id: string, updates: Partial<Treatment>) {
  const { data, error } = await supabase
    .from('treatments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteTreatment(id: string) {
  const { error } = await supabase.from('treatments').delete().eq('id', id);
  if (error) throw error;
}

// Availability Rules
export async function getAvailabilityRules() {
  const { data, error } = await supabase
    .from('availability_rules')
    .select('*')
    .order('day_of_week');

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createAvailabilityRule(rule: Omit<AvailabilityRule, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('availability_rules')
    .insert([rule])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteAvailabilityRule(id: string) {
  const { error } = await supabase.from('availability_rules').delete().eq('id', id);
  if (error) throw error;
}

// Generate time slots based on availability rules
export async function getAvailableTimeSlots(date: Date): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();

  // Get all availability rules for this day (supports multiple shifts, e.g. morning + afternoon)
  const { data: allRules, error: rulesError } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .order('start_time');

  if (rulesError || !allRules || allRules.length === 0) {
    return [];
  }

  // Get existing appointments for this day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('start_datetime, end_datetime')
    .eq('status', 'booked')
    .gte('start_datetime', startOfDay.toISOString())
    .lte('start_datetime', endOfDay.toISOString());

  if (appointmentsError) throw appointmentsError;

  // Generate time slots from all rules
  const slots: TimeSlot[] = [];
  const now = new Date();

  for (const rules of allRules) {
    const [startHour, startMinute] = rules.start_time.split(':').map(Number);
    const [endHour, endMinute] = rules.end_time.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + rules.slot_interval_minutes * 60 * 1000);

      // Skip slots that have already passed (for today)
      if (slotStart <= now) {
        currentTime = slotEnd;
        continue;
      }

      // Check if slot is available (not overlapping with existing appointments)
      const isAvailable = !appointments?.some((apt) => {
        const aptStart = new Date(apt.start_datetime);
        const aptEnd = new Date(apt.end_datetime);
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable,
      });

      currentTime = slotEnd;
    }
  }

  return slots;
}

// Appointments
export async function getAppointments(status?: 'booked' | 'canceled') {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      treatments:treatment_id (*)
    `)
    .order('start_datetime', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getUpcomingAppointments() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      treatments:treatment_id (*)
    `)
    .eq('status', 'booked')
    .gte('start_datetime', now)
    .order('start_datetime', { ascending: true })
    .limit(50);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createAppointment(appointment: {
  customer_name: string;
  phone: string;
  notes: string | null;
  treatment_id: string;
  start_datetime: string;
  end_datetime: string;
  price_at_booking: number;
}) {
  // Try the atomic RPC first (race-safe, requires migration 00002 to be applied).
  // Falls back to direct insert if the function doesn't exist in the database.
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_appointment_atomic', {
    p_customer_name: appointment.customer_name,
    p_phone: appointment.phone,
    p_notes: appointment.notes,
    p_treatment_id: appointment.treatment_id,
    p_start_datetime: appointment.start_datetime,
    p_end_datetime: appointment.end_datetime,
    p_price_at_booking: appointment.price_at_booking,
  });

  if (!rpcError) {
    return { id: rpcData };
  }

  // If the RPC function doesn't exist, fall back to direct insert
  const isMissingFunction = rpcError.message?.includes('could not find') ||
    rpcError.message?.includes('schema cache') ||
    rpcError.code === '42883'; // PostgreSQL "undefined_function"

  if (!isMissingFunction) {
    // A real error from the RPC (e.g. conflict). Wrap as Error for proper display.
    throw new Error(rpcError.message || 'Failed to create booking');
  }

  // Fallback: direct insert (works without the migration applied)
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ ...appointment, status: 'booked' }])
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to create booking');
  }
  return data;
}

export async function cancelAppointment(id: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Settings
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
