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

  // Get availability rules for this day
  const { data: rules, error: rulesError } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (rulesError || !rules) {
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

  // Generate time slots
  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = rules.start_time.split(':').map(Number);
  const [endHour, endMinute] = rules.end_time.split(':').map(Number);

  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  while (currentTime < endTime) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + rules.slot_interval_minutes * 60 * 1000);

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
  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id')
    .eq('status', 'booked')
    .or(
      `and(start_datetime.lte.${appointment.start_datetime},end_datetime.gt.${appointment.start_datetime}),` +
      `and(start_datetime.lt.${appointment.end_datetime},end_datetime.gte.${appointment.end_datetime}),` +
      `and(start_datetime.gte.${appointment.start_datetime},end_datetime.lte.${appointment.end_datetime})`
    );

  if (conflicts && conflicts.length > 0) {
    throw new Error('Time slot is no longer available');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{ ...appointment, status: 'booked' }])
    .select()
    .maybeSingle();

  if (error) throw error;
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
