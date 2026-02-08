Act as a senior product designer + full-stack engineer. Build a focused MVP appointment-booking web app for a nail salon.

PRODUCT NAME (temporary): “Nails Booking”

PRIMARY GOAL
Customers can book an appointment by selecting an available date/time and then choosing a treatment. Only the owner (admin) manages availability, treatments, and prices. Show the selected treatment price clearly during booking (and on confirmation).

LANGUAGES (REQUIRED)
- Default UI language: Arabic
- Additional languages: Hebrew (2nd), English (3rd)
- Add a language switcher visible on every page.
- Support RTL correctly for Arabic + Hebrew, LTR for English (layout, alignment, direction).

USER ROLES
1) Customer (no login)
2) Admin/Owner (login required)

CUSTOMER BOOKING FLOW (MVP)
1) Home page:
   - Salon name, short intro, “Book Appointment” button.
2) Select Date & Time:
   - Calendar (month view) + available time slots for selected day.
   - Only show slots that are available (no double booking).
3) Select Treatment:
   - List of treatments (fetched from DB, managed by admin).
   - Each treatment card shows: name + duration + price.
   - When a customer selects a treatment:
     - Show a “Selected Treatment” section with name + duration + price.
     - Price must appear directly under the selected treatment name (prominent).
4) Customer Details:
   - Full name (required)
   - Phone number (required)
   - Notes (optional)
5) Confirm:
   - Summary: date/time, treatment name, duration, PRICE, customer details.
   - Create appointment and lock the slot.
6) Success screen:
   - Confirmation message with appointment details and price.

ADMIN PANEL (MVP) — OWNER ONLY
Admin Login:
- Simple email/password login (MVP).

Admin Features:
A) Treatments Management
- CRUD treatments:
  - Name in Arabic/Hebrew/English (or a single base name + translations)
  - Duration in minutes (required)
  - Price (required) — numeric, stored in DB
  - Active/Inactive toggle
B) Availability Management
- Define working schedule:
  - Days of week
  - Start time / end time
  - Slot interval (e.g., 30 or 60 minutes)
- Generate future slots (e.g., next 30 days) based on rules OR manage specific slots.
- Ability to block a specific day/time (vacation/break).
C) Appointments
- View upcoming appointments (list view is enough for MVP).
- Cancel appointment (status becomes canceled, slot becomes available again).
- No overlapping appointments.

REMINDERS (MVP)
- Send automated reminder 1 hour before appointment.
- Choose the simplest reliable implementation:
  - Email reminders first (preferred for MVP), OR SMS/WhatsApp if easy via provider.
- Reminder content: “Appointment reminder” + date/time + treatment name + price.
- Admin can enable/disable reminders globally.

BUSINESS RULES (STRICT)
- Slots originate ONLY from admin availability configuration.
- No double booking: atomic check on server.
- Appointment duration = selected treatment duration.
- Slots must accommodate duration (if using fixed interval slots, ensure treatment fits).
- Store timestamps in Asia/Jerusalem timezone consistently.

DATA MODEL (REQUIRED FIELDS)
- AdminUser: id, email, passwordHash, createdAt
- Treatment/Service:
  - id
  - name_ar, name_he, name_en
  - durationMinutes
  - price (required)
  - isActive
  - createdAt, updatedAt
- AvailabilityRule:
  - id, dayOfWeek, startTime, endTime, slotIntervalMinutes
- TimeSlot:
  - id, startDateTime, endDateTime, isAvailable (or computed)
- Appointment:
  - id
  - customerName, phone, notes
  - treatmentId
  - startDateTime, endDateTime
  - priceAtBooking (copy from treatment.price at time of booking)
  - status (booked/canceled)
  - createdAt

IMPORTANT: Use priceAtBooking to preserve the price even if admin changes treatment price later.

UI REQUIREMENTS
- Mobile-first, clean, simple stepper: (1) Date/Time → (2) Treatment → (3) Details → (4) Confirm
- Selected Treatment box should always show PRICE right under the treatment name.
- RTL/LTR must look correct.

TECHNICAL REQUIREMENTS (DELIVERABLES)
- Build a working MVP with:
  - Frontend (customer + admin)
  - Backend API
  - Database (SQLite for MVP; structure ready for Postgres)
- Include basic validation, error handling, and security:
  - Admin routes protected
  - Customers can only create/view their own booking confirmation (MVP can be “show confirmation once”)
- Provide a README with local run + deployment steps.

OUTPUT FORMAT I WANT FROM YOU
1) Pick a simple stack (recommended) and justify briefly.
2) List screens/pages.
3) DB schema (tables + fields).
4) API endpoints (request/response examples).
5) Step-by-step implementation plan.
6) Generate the code for the MVP.

Keep scope tight: booking + treatments w/ price + admin availability + reminder + multi-language (Arabic default).

