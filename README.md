# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-9gx6nsttk3k2

# Nails Booking Application

A comprehensive appointment booking system for a nail salon with multi-language support (Arabic, Hebrew, English) and admin management features.

## 🔑 Quick Start - Admin Setup

The application automatically creates a default admin user on first launch with a **secure randomly generated password**.

**Admin Email**: `admin@nailsbooking.local`

To get the admin password:
1. Check the Supabase Edge Function logs after the first application load
2. The password is logged securely in the `setup-admin` function output
3. Save the password immediately - it's only shown once

> ⚠️ **Security Note**: For production deployment, create a new admin account with your own credentials and delete the default one.

## Features

### Customer Features
- **Multi-language Support**: Arabic (default), Hebrew, and English with RTL/LTR layout support
- **Easy Booking Flow**:
  1. Select date and time from available slots
  2. Choose treatment with clear pricing
  3. Enter customer details
  4. Confirm booking with summary
- **No Login Required**: Customers can book appointments without creating an account
- **Booking Confirmation**: Success page with appointment details
- **Email/SMS Reminders**: Automated reminders sent 1 hour before appointment

### Admin Features
- **Secure Login**: Email/password authentication for salon owner
- **Dashboard**: Overview of upcoming appointments, active treatments, and availability
- **Treatment Management**:
  - Create, edit, and delete treatments
  - Multi-language names (Arabic, Hebrew, English)
  - Set duration and pricing
  - Activate/deactivate treatments
- **Availability Management**:
  - Define working hours by day of week
  - Set time slot intervals
  - Manage salon schedule
- **Appointment Management**:
  - View all upcoming appointments
  - Cancel appointments
  - See customer details and treatment information
- **Settings**:
  - Enable/disable email reminders
  - Configure notification preferences

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Routing**: React Router v7 (with lazy loading)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Internationalization**: Custom i18n context

## Database Schema

### Tables
1. **profiles**: User profiles with role management (admin/user)
2. **treatments**: Service offerings with multi-language names, duration, and pricing
3. **availability_rules**: Salon working hours and time slot configuration
4. **appointments**: Customer bookings with preserved pricing
5. **settings**: Application configuration (e.g., reminder settings)

### Key Features
- Row Level Security (RLS) policies for data protection
- Automatic admin assignment for first registered user
- Price preservation at booking time (priceAtBooking)
- **Atomic booking function** to prevent double bookings under concurrent load

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account (automatically configured)

### Installation

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your Supabase credentials
4. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

To preview production build:
```bash
npm run preview
```

To validate your code:
```bash
npm run lint
```

This command will:
- Check TypeScript types
- Run Biome linter
- Validate Tailwind CSS
- Test build process

### First Time Setup

**The application automatically creates a default admin user on first launch!**

1. **Get Admin Credentials**:
   - Navigate to your Supabase dashboard
   - Go to Edge Functions > `setup-admin` > Logs
   - Find the generated password in the logs

2. **Login**:
   - Navigate to `/login`
   - Use email: `admin@nailsbooking.local`
   - Enter the password from the logs

3. **Configure Availability**:
   - Go to "Availability" section
   - Add working hours for each day of the week
   - Set time slot intervals (e.g., 30 minutes)

4. **Add Treatments**:
   - Go to "Treatments" section
   - Add services with names in all three languages
   - Set duration and pricing
   - Activate treatments

5. **Configure Reminders** (Optional):
   - Go to "Settings"
   - Enable email reminders
   - Set up Resend or Twilio credentials in Supabase Edge Function secrets

## Usage

### For Customers

1. Visit the home page
2. Click "Book Appointment"
3. Select desired date and available time slot
4. Choose a treatment (price displayed prominently)
5. Enter your name and phone number
6. Review booking summary
7. Confirm booking
8. Receive confirmation and reminder notification

### For Admin

1. Login at `/login`
2. Access admin panel from header
3. Manage treatments, availability, and appointments
4. View dashboard for quick overview
5. Configure reminder settings

## Multi-Language Support

The application supports three languages with proper RTL/LTR handling:

- **Arabic (العربية)**: Default language, RTL layout
- **Hebrew (עברית)**: RTL layout
- **English**: LTR layout

Language can be switched using the language selector in the header.

## Email & SMS Reminders

The application includes an Edge Function (`send-reminders`) that:
- Checks for appointments starting in approximately 1 hour
- Sends email and/or SMS reminders to customers
- Includes appointment details and pricing
- Can be enabled/disabled from admin settings

### To Enable Email Reminders (Resend)
1. Create a [Resend](https://resend.com) account
2. Add `RESEND_API_KEY` to your Supabase Edge Function secrets
3. Configure your domain for email sending

### To Enable SMS Reminders (Twilio)
1. Create a [Twilio](https://twilio.com) account
2. Add these secrets to Supabase Edge Functions:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

## Deployment

The application is designed to be deployed on platforms that support:
- React/Vite applications
- Supabase backend
- Edge Functions

Recommended platforms:
- Vercel
- Netlify
- Cloudflare Pages

### Database Migrations

Run the SQL migrations in order:
1. `00001_create_initial_schema.sql` - Core tables and RLS policies
2. `00002_add_atomic_booking.sql` - Atomic booking function

## Security Features

- Row Level Security (RLS) on all database tables
- Admin-only access to management features
- Secure authentication with Supabase Auth
- **Secure random password generation** for default admin
- Protected API routes
- Input validation with Zod schemas
- **Atomic database transactions** to prevent race conditions

## Price Preservation

When a customer books an appointment, the current treatment price is stored in `price_at_booking`. This ensures that:
- Historical bookings reflect the price at time of booking
- Admin can change treatment prices without affecting existing bookings
- Accurate financial records are maintained

## Timezone

All appointments are stored and displayed in **Asia/Jerusalem** timezone to ensure consistency for the salon's location.

## Performance

- **Lazy Loading**: All routes are code-split for faster initial load
- **Optimized Bundle**: Separate chunks for admin and customer sections
- **Responsive Design**: Mobile-first approach for all screen sizes

## Support

For issues or questions:
1. Review the database schema in the migration files
2. Examine the Edge Functions for reminder customization
3. Check the `feedback.md` file for known issues and improvements

## License

© 2026 Nails Booking. All rights reserved.
