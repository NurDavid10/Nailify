# Nails Booking Requirements Document

## 1. Application Overview

### 1.1 Application Name
Nails Booking

### 1.2 Application Description
A focused MVP appointment-booking web application for a nail salon that enables customers to book appointments by selecting available date/time slots and treatments, while allowing the salon owner (admin) to manage availability, treatments, and pricing.

### 1.3 Application Type
Web application (booking system)

### 1.4 Primary Goal
Customers can book appointments by selecting an available date/time and choosing a treatment. Only the owner (admin) manages availability, treatments, and prices. The selected treatment price must be displayed clearly during booking and on confirmation.

## 2. Language Requirements

### 2.1 Supported Languages
- Default UI language: Arabic
- Additional languages: Hebrew (2nd), English (3rd)

### 2.2 Language Features
- Language switcher visible on every page
- RTL (Right-to-Left) support for Arabic and Hebrew
- LTR (Left-to-Right) support for English
- Proper layout, alignment, and direction handling for each language

## 3. User Roles

### 3.1 Customer
- No login required
- Can book appointments
- Can view booking confirmation

### 3.2 Admin/Owner
- Login required (email/password)
- Manages treatments (CRUD operations)
- Manages availability and schedule
- Views and manages appointments
- Controls reminder settings

### 3.3 Default Admin Credentials
- Email: admin@admin.com
- Password: admin123
- This default admin user must be created automatically when the system starts
- The admin user must be able to log in immediately and access the Admin Panel without manual database setup

## 4. Customer Booking Flow

### 4.1 Home Page
- Display salon name
- Short introduction
- Book Appointment button

### 4.2 Select Date & Time
- Calendar with month view
- Available time slots for selected day
- Only show available slots (no double booking)

### 4.3 Select Treatment
- List of active treatments from database
- Each treatment card displays:
  - Treatment name
  - Duration
  - Price
- When customer selects a treatment:
  - Show Selected Treatment section
  - Display treatment name, duration, and price
  - Price must appear prominently directly under the treatment name

### 4.4 Customer Details
- Full name (required)
- Phone number (required)
- Notes (optional)

### 4.5 Confirm Booking
- Summary display:
  - Date and time
  - Treatment name
  - Duration
  - Price
  - Customer details
- Create appointment and lock the time slot

### 4.6 Success Screen
- Confirmation message
- Complete appointment details including price

## 5. Admin Panel Features

### 5.1 Admin Login
- Simple email/password authentication

### 5.2 Treatments Management
- Create, read, update, delete treatments
- Treatment fields:
  - Name in Arabic/Hebrew/English
  - Duration in minutes (required)
  - Price (required, numeric)
  - Active/Inactive toggle

### 5.3 Availability Management
- Define working schedule:
  - Days of week
  - Start time and end time
  - Slot interval (e.g., 30 or 60 minutes)
- Generate future slots (e.g., next 30 days) based on rules
- Block specific day/time for vacation or breaks

### 5.4 Appointments Management
- View upcoming appointments (list view)
- Cancel appointments
  - Status changes to canceled
  - Slot becomes available again
- Prevent overlapping appointments

## 6. Reminder System

### 6.1 Automated Reminders
- Send reminder 1 hour before appointment
- Implementation: Email reminders (preferred for MVP)
- Reminder content includes:
  - Appointment reminder message
  - Date and time
  - Treatment name
  - Price

### 6.2 Admin Control
- Global enable/disable toggle for reminders

## 7. Business Rules

### 7.1 Slot Management
- Time slots originate only from admin availability configuration
- No double booking (atomic check on server)
- Appointment duration equals selected treatment duration
- Slots must accommodate treatment duration
- Store timestamps in Asia/Jerusalem timezone consistently

### 7.2 Price Preservation
- Store priceAtBooking to preserve the price even if admin changes treatment price later

## 8. Data Model

### 8.1 AdminUser Table
- id
- email
- passwordHash
- createdAt

### 8.2 Treatment/Service Table
- id
- name_ar (Arabic name)
- name_he (Hebrew name)
- name_en (English name)
- durationMinutes (required)
- price (required, numeric)
- isActive
- createdAt
- updatedAt

### 8.3 AvailabilityRule Table
- id
- dayOfWeek
- startTime
- endTime
- slotIntervalMinutes

### 8.4 TimeSlot Table
- id
- startDateTime
- endDateTime
- isAvailable (or computed)

### 8.5 Appointment Table
- id
- customerName (required)
- phone (required)
- notes (optional)
- treatmentId
- startDateTime
- endDateTime
- priceAtBooking (copy from treatment.price at time of booking)
- status (booked/canceled)
- createdAt

## 9. UI Requirements

### 9.1 Design Approach
- Mobile-first design
- Clean and simple interface
- Stepper flow: (1) Date/Time → (2) Treatment → (3) Details → (4) Confirm

### 9.2 Treatment Display
- Selected Treatment box must always show price right under the treatment name

### 9.3 Language Support
- RTL/LTR layouts must display correctly for each language

## 10. Technical Requirements

### 10.1 Application Components
- Frontend (customer interface and admin panel)
- Backend API
- Database (SQLite for MVP, structure ready for PostgreSQL migration)

### 10.2 Security and Validation
- Admin routes protected with authentication
- Basic validation and error handling
- Customers can view their booking confirmation

### 10.3 System Initialization
- Automatically create default admin user on system startup
- Default credentials: admin@admin.com / admin123
- Ensure admin can access Admin Panel immediately without manual setup

### 10.4 Deliverables
- Working MVP application
- README with local run instructions
- Deployment steps documentation

## 11. Implementation Scope

The MVP focuses on:
- Appointment booking functionality
- Treatment management with pricing
- Admin availability management
- Automated reminder system
- Multi-language support (Arabic as default)
- Default admin user auto-creation