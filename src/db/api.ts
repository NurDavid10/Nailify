import { api } from './client';
import type { Treatment, AvailabilityRule, TimeSlot, Appointment, Setting, PageBackground, GalleryImage } from '@/types/index';

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
  const rules = await api.get<any[]>('/availability/rules');
  // Transform camelCase to snake_case
  return rules.map(rule => ({
    id: rule.id,
    specific_date: rule.specificDate,
    start_time: rule.startTime,
    end_time: rule.endTime,
    slot_interval_minutes: rule.slotIntervalMinutes,
    created_at: rule.createdAt,
  }));
}

export async function createAvailabilityRule(
  rule: Omit<AvailabilityRule, 'id' | 'created_at'>
): Promise<AvailabilityRule> {
  const response = await api.post<any>('/availability/rules', {
    specificDate: rule.specific_date,
    startTime: rule.start_time,
    endTime: rule.end_time,
    slotIntervalMinutes: rule.slot_interval_minutes,
  });
  // Transform camelCase to snake_case
  return {
    id: response.id,
    specific_date: response.specificDate,
    start_time: response.startTime,
    end_time: response.endTime,
    slot_interval_minutes: response.slotIntervalMinutes,
    created_at: response.createdAt,
  };
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
  notes?: string;
  treatment_id: string;
  start_datetime: string;
  end_datetime: string;
  price_at_booking: number;
  created_by?: 'admin' | 'customer';
}): Promise<{ id: string }> {
  const payload = {
    customerName: appointment.customer_name,
    phone: appointment.phone,
    notes: appointment.notes,
    treatmentId: appointment.treatment_id,
    startDatetime: appointment.start_datetime,
    endDatetime: appointment.end_datetime,
    priceAtBooking: appointment.price_at_booking,
    createdBy: appointment.created_by || 'customer',
  };

  console.log('[createAppointment] Sending payload:', JSON.stringify(payload, null, 2));

  const response = await api.post<Appointment>('/appointments', payload);

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

// Backgrounds
export async function getPageBackgrounds(): Promise<PageBackground[]> {
  return api.get<PageBackground[]>('/backgrounds');
}

export async function getPageBackground(pageKey: string): Promise<string | null> {
  try {
    const result = await api.get<{ url: string }>(`/backgrounds/${pageKey}`);
    return result.url;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function uploadPageBackground(pageKey: string, file: File): Promise<string> {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/backgrounds/${pageKey}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export async function deletePageBackground(pageKey: string): Promise<void> {
  await api.delete(`/backgrounds/${pageKey}`);
}

// Gallery Images
export async function getGalleryImages(): Promise<GalleryImage[]> {
  return api.get<GalleryImage[]>('/backgrounds/gallery/images');
}

export async function uploadGalleryImage(imageId: number, file: File): Promise<string> {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/backgrounds/gallery/${imageId}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

export async function deleteGalleryImage(imageId: number): Promise<void> {
  await api.delete(`/backgrounds/gallery/${imageId}`);
}
