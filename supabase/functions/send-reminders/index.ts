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
        JSON.stringify({ message: 'Reminders are disabled' }),
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

    // Send reminders (in a real implementation, integrate with email service)
    // For MVP, we'll log the reminders that would be sent
    const reminders = appointments.map((apt: Appointment) => {
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

      return {
        customer: apt.customer_name,
        phone: apt.phone,
        date: formattedDate,
        time: formattedTime,
        treatment: apt.treatments.name_en,
        price: apt.price_at_booking,
        message: `Reminder: You have an appointment on ${formattedDate} at ${formattedTime} for ${apt.treatments.name_en}. Price: ₪${apt.price_at_booking}`,
      };
    });

    console.log('Reminders to send:', reminders);

    // In a production environment, you would integrate with an email service here
    // Example: SendGrid, Resend, AWS SES, etc.
    // For each reminder, send an email to the customer

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        count: reminders.length,
        reminders,
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
