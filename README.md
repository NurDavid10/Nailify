# Nails Booking Application

A comprehensive appointment booking system for a nail salon with multi-language support (Arabic, Hebrew, English) and admin management features.

## 🔑 Quick Start - Default Admin Credentials

**For immediate access to the admin panel:**

- **Email**: `admin@admin.com`
- **Password**: `admin123`

The default admin account is **automatically created** when you first visit the application. Simply navigate to `/login` and use these credentials to access all admin features immediately.

> ⚠️ **Security Note**: These default credentials are for MVP/development purposes only. For production deployment, change the password or create a new admin account and delete the default one.

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
- **Email Reminders**: Automated reminders sent 1 hour before appointment

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
- **Routing**: React Router v7
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
- Conflict prevention for double bookings

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account (automatically configured)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. The application is pre-configured with Supabase. Environment variables are already set.

### Running Locally

**Note**: This project uses a custom build system. Do not use `npm run dev` or `npm run build`.

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

1. **Login with Default Admin**:
   - Navigate to `/login`
   - Use credentials: `admin@admin.com` / `admin123`
   - You now have full admin access immediately

2. **Configure Availability**:
   - Go to "Availability" section
   - Add working hours for each day of the week
   - Set time slot intervals (e.g., 30 minutes)

3. **Add Treatments**:
   - Go to "Treatments" section
   - Add services with names in all three languages
   - Set duration and pricing
   - Activate treatments

4. **Configure Reminders**:
   - Go to "Settings"
   - Enable email reminders
   - Reminders are sent 1 hour before appointments

## Usage

### For Customers

1. Visit the home page
2. Click "Book Appointment"
3. Select desired date and available time slot
4. Choose a treatment (price displayed prominently)
5. Enter your name and phone number
6. Review booking summary
7. Confirm booking
8. Receive confirmation and reminder email

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

## Email Reminders

The application includes an Edge Function (`send-reminders`) that:
- Checks for appointments starting in approximately 1 hour
- Sends email reminders to customers
- Includes appointment details and pricing
- Can be enabled/disabled from admin settings

**Note**: For production use, integrate with an email service provider (SendGrid, Resend, AWS SES, etc.) in the Edge Function.

## Deployment

The application is designed to be deployed on platforms that support:
- React/Vite applications
- Supabase backend
- Edge Functions

Recommended platforms:
- Vercel
- Netlify
- Cloudflare Pages

## Security Features

- Row Level Security (RLS) on all database tables
- Admin-only access to management features
- Secure authentication with Supabase Auth
- Protected API routes
- Input validation with Zod schemas

## Price Preservation

When a customer books an appointment, the current treatment price is stored in `price_at_booking`. This ensures that:
- Historical bookings reflect the price at time of booking
- Admin can change treatment prices without affecting existing bookings
- Accurate financial records are maintained

## Timezone

All appointments are stored and displayed in **Asia/Jerusalem** timezone to ensure consistency for the salon's location.

## Support

For issues or questions:
1. Check the TODO.md file for implementation notes
2. Review the database schema in the migration files
3. Examine the Edge Function for reminder customization

## License

© 2026 Nails Booking. All rights reserved.
