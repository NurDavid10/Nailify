export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface Treatment {
  id: string;
  name_ar: string;
  name_he: string;
  name_en: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  created_at: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface Appointment {
  id: string;
  customer_name: string;
  phone: string;
  notes: string | null;
  treatment_id: string;
  start_datetime: string;
  end_datetime: string;
  price_at_booking: number;
  status: 'booked' | 'canceled';
  created_by: 'admin' | 'customer';
  created_at: string;
  treatments?: Treatment;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface BookingFormData {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedTreatment: Treatment | null;
  customerName: string;
  phone: string;
  notes: string;
}

export interface PageBackground {
  pageKey: string;
  name_en: string;
  name_ar: string;
  name_he: string;
  path: string;
  currentBackgroundUrl: string | null;
  defaultBackgroundUrl: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  isDefault: boolean;
}

