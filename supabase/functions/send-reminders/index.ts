import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Appointment {
  id: string;
  customer_name: string;
  phone: string;
  start_datetime: string;
  price_at_booking: number;
  treatments: {
    name_ar: string;
    name_he: string;
    name_en: string;
  };
}

interface ReminderData {
  customer: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  treatment: string;
  treatmentAr: string;
  treatmentHe: string;
  price: number;
  appointmentId: string;
}

// Email sending function - integrates with Resend API
// To enable: Set RESEND_API_KEY in Supabase Edge Function secrets
async function sendEmailReminder(reminder: ReminderData): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.log('[Email] RESEND_API_KEY not configured - skipping email send');
    console.log('[Email] Would send reminder to:', reminder.customer);
    return false;
  }

  // Note: In production, you would need to collect customer email during booking
  // For now, we log the reminder that would be sent
  if (!reminder.email) {
    console.log('[Email] No email address for customer:', reminder.customer);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nails Booking <reminders@nailsbooking.local>',
        to: [reminder.email],
        subject: `Appointment Reminder - ${reminder.date} at ${reminder.time}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ec4899;">Appointment Reminder</h2>
            <p>Dear ${reminder.customer},</p>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            <div style="background-color: #fdf2f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Date:</strong> ${reminder.date}</p>
              <p><strong>Time:</strong> ${reminder.time}</p>
              <p><strong>Treatment:</strong> ${reminder.treatment}</p>
              <p><strong>Price:</strong> ₪${reminder.price.toFixed(2)}</p>
            </div>
            <p>We look forward to seeing you!</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              If you need to cancel or reschedule, please contact us as soon as possible.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
      return false;
    }

    console.log('[Email] Successfully sent reminder to:', reminder.email);
    return true;
  } catch (error) {
    console.error('[Email] Error sending reminder:', error);
    return false;
  }
}

// SMS sending function placeholder
// To enable: Integrate with Twilio, MessageBird, or similar
async function sendSmsReminder(reminder: ReminderData): Promise<boolean> {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log('[SMS] Twilio not configured - skipping SMS send');
    console.log('[SMS] Would send reminder to:', reminder.phone);
    return false;
  }

  try {
    const message = `Nails Booking Reminder: ${reminder.date} at ${reminder.time} - ${reminder.treatment} (₪${reminder.price.toFixed(2)})`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: reminder.phone,
          From: twilioPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[SMS] Failed to send:', error);
      return false;
    }

    console.log('[SMS] Successfully sent reminder to:', reminder.phone);
    return true;
  } catch (error) {
    console.error('[SMS] Error sending reminder:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if reminders are enabled
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'reminders_enabled')
      .maybeSingle();

    if (!settings || settings.value !== 'true') {
      return new Response(
        JSON.stringify({ message: 'Reminders are disabled', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get appointments starting in approximately 1 hour (55-65 minutes from now)
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 55 * 60 * 1000);
    const oneHourLaterMax = new Date(now.getTime() + 65 * 60 * 1000);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_name,
        phone,
        start_datetime,
        price_at_booking,
        treatments:treatment_id (
          name_ar,
          name_he,
          name_en
        )
      `)
      .eq('status', 'booked')
      .gte('start_datetime', oneHourLater.toISOString())
      .lte('start_datetime', oneHourLaterMax.toISOString());

    if (error) {
      throw error;
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No appointments to remind', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Process reminders
    const results = {
      total: appointments.length,
      emailSent: 0,
      smsSent: 0,
      failed: 0,
      reminders: [] as ReminderData[],
    };

    for (const apt of appointments as Appointment[]) {
      const appointmentDate = new Date(apt.start_datetime);
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Jerusalem',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jerusalem',
        hour: '2-digit',
        minute: '2-digit',
      });

      const reminder: ReminderData = {
        customer: apt.customer_name,
        phone: apt.phone,
        date: formattedDate,
        time: formattedTime,
        treatment: apt.treatments.name_en,
        treatmentAr: apt.treatments.name_ar,
        treatmentHe: apt.treatments.name_he,
        price: apt.price_at_booking,
        appointmentId: apt.id,
      };

      results.reminders.push(reminder);

      // Try to send email reminder
      const emailSent = await sendEmailReminder(reminder);
      if (emailSent) results.emailSent++;

      // Try to send SMS reminder
      const smsSent = await sendSmsReminder(reminder);
      if (smsSent) results.smsSent++;

      // Track failures (neither email nor SMS sent successfully)
      if (!emailSent && !smsSent) {
        results.failed++;
      }
    }

    console.log('Reminder processing complete:', results);

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
