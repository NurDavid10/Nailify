import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {},
  locale = "en-US"
) {
  return new Intl.DateTimeFormat(locale, {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

/**
 * Get localized field value from an object with multi-language fields
 * @param obj - Object with localized fields (e.g., { name_ar: '...', name_he: '...', name_en: '...' })
 * @param fieldPrefix - Field name prefix (e.g., 'name' for name_ar, name_he, name_en)
 * @param language - Language code ('ar', 'he', or 'en')
 * @returns Localized field value or empty string if not found
 *
 * @example
 * const treatment = { name_ar: 'مانيكير', name_he: 'מניקור', name_en: 'Manicure' };
 * getLocalizedField(treatment, 'name', 'ar'); // Returns 'مانيكير'
 */
export function getLocalizedField<T extends Record<string, any>>(
  obj: T | null | undefined,
  fieldPrefix: string,
  language: 'ar' | 'he' | 'en'
): string {
  if (!obj) return '';

  const fieldKey = `${fieldPrefix}_${language}` as keyof T;
  const value = obj[fieldKey];

  // Return the localized value, or fallback to English, or empty string
  if (typeof value === 'string') return value;

  const fallbackKey = `${fieldPrefix}_en` as keyof T;
  const fallback = obj[fallbackKey];

  return typeof fallback === 'string' ? fallback : '';
}
