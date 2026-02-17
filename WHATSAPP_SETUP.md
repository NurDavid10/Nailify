# WhatsApp Reminder Setup Guide

This guide walks you through setting up automatic WhatsApp reminders for appointment bookings using Twilio WhatsApp API.

## Overview

The system automatically sends WhatsApp reminders to customers **1 hour before their appointment** time. Reminders are sent in **three languages** (Arabic, Hebrew, and English) and include:

- Customer name
- Appointment date and time
- Treatment name
- Price

---

## Prerequisites

- Twilio account (free trial available)
- Phone number to receive WhatsApp messages (for testing)
- Server running with PostgreSQL database

---

## Part 1: Twilio Account Setup

### Step 1: Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number
4. You'll receive **$15 free credit** for testing

### Step 2: Get Your Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. **Copy these** - you'll need them for environment variables

---

## Part 2: WhatsApp Sandbox Setup (Testing)

For **testing**, Twilio provides a WhatsApp Sandbox - no approval needed!

### Step 1: Access WhatsApp Sandbox

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see the sandbox WhatsApp number: `+1 415 523 8886`
3. You'll also see a **join code** like: `join <code>`

### Step 2: Connect Your Phone to Sandbox

1. **On your phone**, open WhatsApp
2. Start a new chat to: `+1 415 523 8886`
3. Send the message: `join <your-code>` (e.g., `join shadow-mountain`)
4. You'll receive a confirmation message: "Sandbox connected!"

✅ Your phone is now ready to receive test messages!

---

## Part 3: Configure Backend

### Step 1: Update Environment Variables

Edit `server/.env`:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Important:**
- Replace `ACxxx...` with your actual Account SID
- Replace `your_auth_token_here` with your actual Auth Token
- For sandbox testing, use `whatsapp:+14155238886`
- The `whatsapp:` prefix is required!

### Step 2: Restart Server

```bash
cd server
npm run dev
```

You should see:
```
⏰ WhatsApp reminder cron job started (every 10 minutes)
```

---

## Part 4: Testing

### Method 1: Create a Test Appointment

1. **Create an appointment** that starts **in 1 hour** (or 55-65 minutes)
2. Use **your phone number** (the one connected to WhatsApp sandbox)
3. Wait for the cron job to run (every 10 minutes)
4. You should receive a WhatsApp message on your phone!

**Example:**
- Current time: 2:00 PM
- Create appointment for: 3:00 PM
- Phone: +972501234567 (use your actual number)

### Method 2: Manual Trigger (Admin Only)

For **immediate testing** without waiting:

```bash
# In your terminal
curl -X POST http://localhost:3001/api/reminders/send \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Or use the admin panel route (needs to be added to frontend).

### Method 3: Check Reminder Stats

```bash
curl http://localhost:3001/api/reminders/stats \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Returns:
```json
{
  "totalSent": 5,
  "totalFailed": 0,
  "recentReminders": [...]
}
```

---

## Part 5: Phone Number Format

**Important:** Phone numbers must include country code!

✅ **Correct formats:**
- `+972501234567` (Israel)
- `+1234567890` (US)
- `+971501234567` (UAE)

❌ **Wrong formats:**
- `0501234567` (missing country code)
- `501234567` (missing + and country code)

The system automatically adds the `whatsapp:` prefix when sending.

---

## Part 6: Production Setup (Optional)

For **production**, you need an approved WhatsApp Business number.

### Step 1: Request WhatsApp Business Profile

1. In Twilio Console, go to **Messaging** → **WhatsApp** → **Senders**
2. Click **"Request to send messages to any WhatsApp number"**
3. Fill out the form:
   - Business name
   - Business description
   - Website URL
   - Business address

### Step 2: Get a Phone Number

**Option A: Buy a Twilio Number**
1. Go to **Phone Numbers** → **Buy a number**
2. Select country (e.g., Israel, US)
3. Enable **WhatsApp** capability
4. Purchase number (~$1-2/month)

**Option B: Use Your Own Number**
1. Verify ownership of your existing phone number
2. Link it to your Twilio account
3. Enable WhatsApp capability

### Step 3: Submit Message Templates

WhatsApp requires **pre-approved message templates** for production.

1. Go to **Messaging** → **WhatsApp** → **Message Templates**
2. Create a template:
   - Name: `appointment_reminder`
   - Category: `Appointment Update`
   - Language: Select all needed (Arabic, Hebrew, English)
   - Content: Copy from `reminder.service.ts` formatWhatsAppMessage()

3. Submit for approval (usually takes 1-2 business days)

### Step 4: Update Environment Variables

```bash
# Production WhatsApp number
TWILIO_WHATSAPP_NUMBER=whatsapp:+972YOUR_NUMBER
```

### Step 5: Deploy

Deploy to Railway/Render with updated environment variables.

---

## Part 7: Monitoring & Troubleshooting

### Check Logs

**Server logs:**
```bash
# Look for these log messages:
[Cron] Running WhatsApp reminder check...
[Reminder] Found X appointments to remind
[Reminder] Sending WhatsApp to +972...
[Reminder] Successfully sent WhatsApp to +972...
```

**Twilio logs:**
1. Go to [Twilio Console](https://console.twilio.com/)
2. Click **Monitor** → **Logs** → **WhatsApp**
3. Check message status: `delivered`, `failed`, etc.

### Common Issues

#### 1. "Twilio credentials not configured"

**Problem:** Environment variables not set

**Fix:**
```bash
# Check .env file
cat server/.env | grep TWILIO

# Should show:
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### 2. "Phone not connected to sandbox"

**Problem:** Customer's phone didn't join sandbox

**Fix:**
- Customer must send `join <code>` to `+1 415 523 8886`
- Wait for confirmation message
- Try again

#### 3. "Failed to send WhatsApp"

**Problem:** Invalid phone number format or Twilio error

**Fix:**
- Check phone includes country code: `+972...`
- Check Twilio logs for detailed error
- Verify Twilio account has credit

#### 4. "No reminders sent"

**Problem:** No appointments in the 55-65 minute window

**Fix:**
- Create test appointment exactly 1 hour from now
- Or use manual trigger: `POST /api/reminders/send`
- Check appointment status is `booked`, not `canceled`

#### 5. "Reminder sent multiple times"

**Problem:** Database tracking issue

**Fix:**
- Check `appointment_reminders` table
- Should have unique constraint on `appointment_id`
- Run: `SELECT * FROM appointment_reminders WHERE appointment_id = 'xxx';`

---

## Part 8: Database Schema

The reminders are tracked in the `appointment_reminders` table:

```sql
CREATE TABLE appointment_reminders (
  id UUID PRIMARY KEY,
  appointment_id UUID UNIQUE NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL,  -- 'sent' or 'failed'
  error_message TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

**Query recent reminders:**
```sql
SELECT
  ar.sent_at,
  ar.status,
  a.customer_name,
  a.phone,
  a.start_datetime
FROM appointment_reminders ar
JOIN appointments a ON ar.appointment_id = a.id
ORDER BY ar.sent_at DESC
LIMIT 10;
```

---

## Part 9: Costs

### Twilio Pricing

**Free Trial:**
- $15 credit (enough for ~1,500-3,000 messages)
- No time limit
- Perfect for testing

**Production Pricing:**
- WhatsApp messages: $0.005 per message (Israel)
- Varies by country: $0.004-0.01 per message
- Phone number: $1-2/month (optional)

**Example:**
- 100 appointments/month = $0.50/month
- 1000 appointments/month = $5/month

**Free alternatives:**
- Use Meta WhatsApp Business API directly (free but complex setup)
- Use other providers: Vonage, MessageBird, Infobip

---

## Part 10: Advanced Configuration

### Change Reminder Timing

Edit `server/src/index.ts`:

```typescript
// Default: every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  // ...
});

// Options:
// Every 5 minutes: '*/5 * * * *'
// Every 15 minutes: '*/15 * * * *'
// Every hour: '0 * * * *'
```

Edit reminder window in `reminder.service.ts`:

```typescript
// Default: 55-65 minutes
const startWindow = new Date(now.getTime() + 55 * 60 * 1000);
const endWindow = new Date(now.getTime() + 65 * 60 * 1000);

// Change to 2 hours:
const startWindow = new Date(now.getTime() + 115 * 60 * 1000);
const endWindow = new Date(now.getTime() + 125 * 60 * 1000);
```

### Customize Message Template

Edit `server/src/services/reminder.service.ts` → `formatWhatsAppMessage()`:

```typescript
private static formatWhatsAppMessage(appointment: AppointmentWithTreatment): string {
  // Customize your message here
  // Add emojis, change format, add business info, etc.
}
```

### Disable Reminders Temporarily

Set environment variable:
```bash
# In .env or Railway dashboard
TWILIO_ACCOUNT_SID=  # Leave blank to disable
```

Or comment out the cron job in `index.ts`.

---

## Part 11: Verification Checklist

Before going live, verify:

- [ ] Twilio account created and verified
- [ ] Account SID and Auth Token copied
- [ ] WhatsApp sandbox connected (or production number approved)
- [ ] Environment variables set in `.env`
- [ ] Server restarted with new config
- [ ] Test appointment created in 1 hour
- [ ] WhatsApp reminder received on your phone
- [ ] Database table `appointment_reminders` has records
- [ ] No errors in server logs
- [ ] Twilio dashboard shows message as `delivered`

---

## Support

### Documentation
- Twilio WhatsApp Quickstart: https://www.twilio.com/docs/whatsapp/quickstart/node
- Twilio Console: https://console.twilio.com/
- Message Logs: https://console.twilio.com/monitor/logs/whatsapp

### Troubleshooting
- Check server logs: `npm run dev` output
- Check Twilio logs: Console → Monitor → Logs
- Check database: `SELECT * FROM appointment_reminders;`

---

## Next Steps

1. ✅ Complete Twilio setup
2. ✅ Test with sandbox
3. ✅ Verify reminders are sent
4. 📝 (Optional) Apply for production WhatsApp number
5. 📝 (Optional) Get message templates approved
6. 🚀 Deploy to production!

---

**Setup Complete! 🎉**

Your customers will now receive automatic WhatsApp reminders 1 hour before their appointments!
