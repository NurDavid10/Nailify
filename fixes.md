# Codebase Fixes Summary

## 1. CRITICAL: Booking creation broken + race condition vulnerability

**File:** `src/db/api.ts` — `createAppointment()`

**Problem:** The function was changed to call `supabase.rpc('create_appointment_atomic')`, but migration `00002_add_atomic_booking.sql` was never applied to the running database, so the function doesn't exist. This caused every booking attempt to fail with `"Could not find the function"`. Additionally, the raw `PostgrestError` thrown was not an `instanceof Error`, so the catch block in `ConfirmPage.tsx` fell through to the generic `'Failed to create booking'` message.

**Fix:** `createAppointment` now tries the atomic RPC first (race-safe). If the function doesn't exist in the database (detected by error message or PostgreSQL error code `42883`), it falls back to a direct insert which works with the existing RLS policy. All Supabase errors are now wrapped in standard `Error` objects so error messages always display correctly in the UI.

---

## 2. SECURITY: RouteGuard allowed any authenticated user to access admin pages

**File:** `src/components/common/RouteGuard.tsx`

**Problem:** The guard only checked whether a user was logged in (`!user && !isPublic`). Any authenticated user — even one with `role: 'user'` — could navigate to `/admin/*` routes and access the full admin panel.

**Fix:** Added an `ADMIN_ROUTES` pattern list and a role check. The guard now redirects to `/login` if a non-admin user attempts to access admin routes (`profile?.role !== 'admin'`). Renamed `matchPublicRoute` to `matchRoute` since it's now used for both public and admin patterns.

---

## 3. BUG: Time slot generation only used one availability rule per day

**File:** `src/db/api.ts` — `getAvailableTimeSlots()`

**Problem:** The query used `.maybeSingle()`, which returns at most one row. If the admin configured multiple availability rules for the same day (e.g., morning 09:00–12:00 and afternoon 14:00–18:00), only the first rule was used and the afternoon slots were silently ignored.

**Fix:** Changed to a regular `.select('*')` query (no `.maybeSingle()`) that returns all rules, ordered by `start_time`. The function now loops over all rules to generate slots from each one.

---

## 4. BUG: Past time slots shown when booking for today

**File:** `src/db/api.ts` — `getAvailableTimeSlots()`

**Problem:** When a customer selected today's date, the time slot list included slots that had already passed (e.g., at 3 PM it would still show 9 AM, 10 AM, etc.). Customers could select and attempt to book a time in the past.

**Fix:** Added a `now` timestamp check inside the slot generation loop. Slots whose start time is in the past (`slotStart <= now`) are skipped entirely and excluded from the returned list.

---

## 5. BUG: `formatDate` utility hardcoded Chinese (zh-CN) locale

**File:** `src/lib/utils.ts` — `formatDate()`

**Problem:** The function hardcoded `"zh-CN"` as the `Intl.DateTimeFormat` locale. This is a nail salon app targeting Arabic, Hebrew, and English speakers — dates would display in Chinese formatting.

**Fix:** Added an optional `locale` parameter defaulting to `"en-US"`. Callers can now pass the appropriate locale for their language context.

---

## 6. BUG: Booking flow allowed skipping steps and had unsafe JSON.parse calls

**Files:**
- `src/pages/booking/TreatmentPage.tsx`
- `src/pages/booking/DetailsPage.tsx`
- `src/pages/booking/ConfirmPage.tsx`

**Problem:**
1. Users could directly navigate to `/booking/treatment` or `/booking/details` via the URL bar without completing previous steps. The pages would render with missing data or crash on undefined values.
2. Multiple `JSON.parse(localStorage.getItem('bookingData'))` calls had no `try/catch`. Corrupted localStorage data would throw an unhandled exception and crash the page.

**Fix:**
- **TreatmentPage:** Added a `useEffect` that checks localStorage on mount. If `selectedDate` or `selectedTime` are missing, the user is redirected to step 1. Wrapped `JSON.parse` in try/catch.
- **DetailsPage:** Added a `useEffect` with the same pattern, also checking for `selectedTreatment`. Added the missing `useEffect` import. Wrapped `JSON.parse` in try/catch.
- **ConfirmPage:** Wrapped the existing `JSON.parse` call in try/catch with a redirect fallback on parse failure.

---

## 7. BUG: Admin dashboard silently swallowed API errors

**File:** `src/pages/admin/AdminDashboard.tsx`

**Problem:** The `Promise.all` call that loads dashboard stats (upcoming appointments, treatments, availability rules) had no `.catch()` handler. If any API call failed (e.g., network error, RLS policy issue), the error was silently lost and the dashboard showed all zeros with no indication of failure.

**Fix:** Added a `.catch()` handler that logs the error to console. This prevents unhandled promise rejections and makes debugging easier.

---

## 8. Supabase client missing environment variable validation

**File:** `src/db/supabase.ts`

**Problem:** The Supabase client was created with `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` without checking if they exist. Missing env vars would pass `undefined` to `createClient()`, causing cryptic runtime errors deep in the Supabase SDK. Also cleaned up inconsistent indentation (extra leading whitespace throughout the file).

**Fix:** Added an explicit check that both variables are defined, throwing a clear error message pointing the developer to the `.env` file. Fixed file indentation.

---

## 9. UI: Subtle background image on DateTimePage

**File:** `src/pages/booking/DateTimePage.tsx`

**Change:** Added `IMG_8398.jpg` (sage green nails on cream background) as a fixed full-page background at very low opacity (`opacity-[0.06]`), layered under a semi-transparent `bg-background/80` overlay. This gives the booking page a refined, textured feel while keeping text and form elements fully readable. The background uses `pointer-events-none` and `fixed` positioning so it doesn't interfere with scrolling or interaction.

---

## 10. UI: Enhanced HomePage gallery with additional images

**File:** `src/pages/HomePage.tsx`

**Change:** Expanded the gallery strip from a 2-image grid to a 6-image responsive grid (2 columns on mobile, 3 on desktop). Added a section heading using the existing `home.title` translation. Selected images for visual variety and light-theme compatibility:
- `IMG_8393.jpg` — Purple/pink rose stiletto (dramatic)
- `IMG_8394.jpg` — Orchid floral almond (artistic)
- `IMG_8397.jpg` — Navy blue with gold leaf floral (rich color contrast)
- `IMG_8398.jpg` — Sage green on cream (fresh, elegant)
- `IMG_8402.jpg` — Leopard print stiletto close-up (bold)
- `IMG_8403.jpg` — Baby blue with marble accent (clean, modern)

Skipped `IMG_8399` (dark background) and `IMG_8401` (dark/muted tones) as they clash with the light theme.

---

## 11. Asset: Copied new salon images to public directory

**Files:** `public/salon/IMG_8396.jpg` through `IMG_8403.jpg` (7 files)

**Change:** Copied 7 new nail art photos from `imges/` to `public/salon/` so they're servable by Vite. Total gallery now has 10 images available.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/db/api.ts` | Fixed broken booking: RPC with direct-insert fallback; errors wrapped as Error; multi-rule time slots; past slot filtering |
| `src/db/supabase.ts` | Added env var validation; fixed indentation |
| `src/components/common/RouteGuard.tsx` | Added admin role check for `/admin/*` routes |
| `src/pages/booking/TreatmentPage.tsx` | Added step validation and safe JSON.parse |
| `src/pages/booking/DetailsPage.tsx` | Added step validation, safe JSON.parse, useEffect import |
| `src/pages/booking/ConfirmPage.tsx` | Wrapped JSON.parse in try/catch |
| `src/pages/admin/AdminDashboard.tsx` | Added .catch() to Promise.all |
| `src/lib/utils.ts` | Fixed hardcoded zh-CN locale to configurable default |
| `src/pages/booking/DateTimePage.tsx` | Added subtle IMG_8398 background at 6% opacity |
| `src/pages/HomePage.tsx` | Expanded gallery from 2 to 6 images in responsive 3-column grid |
| `public/salon/` | Added 7 new salon images (IMG_8396–IMG_8403) |
