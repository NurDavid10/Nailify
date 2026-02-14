import { api } from './client';
import type { Treatment, AvailabilityRule, TimeSlot, Appointment, Setting } from '@/types/index';

// Treatments
export async function getTreatments(activeOnly = true): Promise<Treatment[]> {
  return api.get<Treatment[]>(`/treatments?activeOnly=${activeOnly}`);
}

export async function getTreatmentById(id: string): Promise<Treatment | null> {
  try {
    return await api.get<Treatment>(`/treatments/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createTreatment(
  treatment: Omit<Treatment, 'id' | 'created_at' | 'updated_at'>
): Promise<Treatment> {
  // Transform snake_case to camelCase for API
  const payload = {
    nameAr: treatment.name_ar,
    nameHe: treatment.name_he,
    nameEn: treatment.name_en,
    durationMinutes: treatment.duration_minutes,
    price: treatment.price,
    isActive: treatment.is_active,
  };
  return api.post<Treatment>('/treatments', payload);
}

export async function updateTreatment(
  id: string,
  updates: Partial<Treatment>
): Promise<Treatment> {
  // Transform snake_case to camelCase for API
  const payload: Record<string, any> = {};
  if (updates.name_ar !== undefined) payload.nameAr = updates.name_ar;
  if (updates.name_he !== undefined) payload.nameHe = updates.name_he;
  if (updates.name_en !== undefined) payload.nameEn = updates.name_en;
  if (updates.duration_minutes !== undefined) payload.durationMinutes = updates.duration_minutes;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.is_active !== undefined) payload.isActive = updates.is_active;

  return api.put<Treatment>(`/treatments/${id}`, payload);
}

export async function deleteTreatment(id: string): Promise<void> {
  await api.delete<void>(`/treatments/${id}`);
}

// Availability Rules
export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  return api.get<AvailabilityRule[]>('/availability/rules');
}

export async function createAvailabilityRule(
  rule: Omit<AvailabilityRule, 'id' | 'created_at'>
): Promise<AvailabilityRule> {
  return api.post<AvailabilityRule>('/availability/rules', {
    specificDate: rule.specific_date,
    startTime: rule.start_time,
    endTime: rule.end_time,
    slotIntervalMinutes: rule.slot_interval_minutes,
  });
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  await api.delete<void>(`/availability/rules/${id}`);
}

// Get available time slots for a specific date
export async function getAvailableTimeSlots(date: Date): Promise<TimeSlot[]> {
  // Format as YYYY-MM-DD
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const slots = await api.get<{ start: string; end: string; available: boolean }[]>(
    `/availability/slots?date=${dateStr}`
  );

  // Convert ISO strings back to Date objects
  return slots.map((slot) => ({
    start: new Date(slot.start),
    end: new Date(slot.end),
    available: slot.available,
  }));
}

// Get distinct dates that have availability rules (for calendar filtering)
export async function getAvailableDates(): Promise<string[]> {
  return api.get<string[]>('/availability/dates');
}

// Appointments
export async function getAppointments(
  status?: 'booked' | 'canceled'
): Promise<Appointment[]> {
  const queryParam = status ? `?status=${status}` : '';
  return api.get<Appointment[]>(`/appointments${queryParam}`);
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  return api.get<Appointment[]>('/appointments/upcoming');
}

export async function createAppointment(appointment: {
  customer_name: string;
  phone: string;
  notes: string | null;
  treatment_id: string;
  start_datetime: string;
  end_datetime: string;
  price_at_booking: number;
  created_by?: 'admin' | 'customer';
}): Promise<{ id: string }> {
  const response = await api.post<Appointment>('/appointments', {
    customerName: appointment.customer_name,
    phone: appointment.phone,
    notes: appointment.notes,
    treatmentId: appointment.treatment_id,
    startDatetime: appointment.start_datetime,
    endDatetime: appointment.end_datetime,
    priceAtBooking: appointment.price_at_booking,
    createdBy: appointment.created_by || 'customer',
  });

  return { id: response.id };
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  return api.patch<Appointment>(`/appointments/${id}/cancel`);
}

// Settings
export async function getSettings(): Promise<Setting[]> {
  return api.get<Setting[]>('/settings');
}

export async function getSetting(key: string): Promise<Setting | null> {
  try {
    return await api.get<Setting>(`/settings/${key}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function updateSetting(key: string, value: string): Promise<Setting> {
  return api.put<Setting>(`/settings/${key}`, { value });
}
