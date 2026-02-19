import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

interface AppointmentWithTreatment {
  id: string;
  customerName: string;
  phone: string;
  startDatetime: Date;
  priceAtBooking: number;
  treatment: {
    nameAr: string;
    nameHe: string;
    nameEn: string;
  };
}

export class ReminderService {
  private static twilioClient: twilio.Twilio | null = null;

  /**
   * Initialize Twilio client
   */
  private static getTwilioClient(): twilio.Twilio | null {
    if (this.twilioClient) {
      return this.twilioClient;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return null;
    }

    this.twilioClient = twilio(accountSid, authToken);
    return this.twilioClient;
  }

  /**
   * Main function to check and send WhatsApp reminders
   * Called by cron job every 10 minutes
   */
  static async sendWhatsAppReminders(): Promise<{
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  }> {
    const client = this.getTwilioClient();
    if (!client) {
      return { total: 0, sent: 0, failed: 0, skipped: 0 };
    }

    // Get appointments starting in 55-65 minutes
    const now = new Date();
    const startWindow = new Date(now.getTime() + 55 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 65 * 60 * 1000);

    // Query appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'booked',
        startDatetime: {
          gte: startWindow,
          lte: endWindow,
        },
        // Only get appointments without reminders sent yet
        reminders: {
          none: {},
        },
      },
      include: {
        treatment: true,
      },
    });

    if (appointments.length === 0) {
      return { total: 0, sent: 0, failed: 0, skipped: 0 };
    }

    const results = {
      total: appointments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Send reminders for each appointment
    for (const appointment of appointments) {
      try {
        const success = await this.sendWhatsAppMessage(
          client,
          appointment as unknown as AppointmentWithTreatment
        );

        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error('[Reminder] Error processing appointment:', error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Send WhatsApp message via Twilio for a single appointment
   */
  private static async sendWhatsAppMessage(
    client: twilio.Twilio,
    appointment: AppointmentWithTreatment
  ): Promise<boolean> {
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!whatsappFrom) {
      return false;
    }

    try {
      // Format the message (detect language based on phone prefix or use multilingual)
      const message = this.formatWhatsAppMessage(appointment);

      // Ensure phone number has + prefix
      const toNumber = appointment.phone.startsWith('+')
        ? `whatsapp:${appointment.phone}`
        : `whatsapp:+${appointment.phone}`;

      // Send via Twilio WhatsApp API
      await client.messages.create({
        from: whatsappFrom,
        to: toNumber,
        body: message,
      });

      // Record successful reminder
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: appointment.id,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return true;
    } catch (error: any) {
      // Record failed reminder
      await prisma.appointmentReminder.create({
        data: {
          appointmentId: appointment.id,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        },
      });

      return false;
    }
  }

  /**
   * Format WhatsApp message with multilingual support
   */
  private static formatWhatsAppMessage(appointment: AppointmentWithTreatment): string {
    const appointmentTime = new Date(appointment.startDatetime);

    // Format date and time in local timezone (Asia/Jerusalem)
    const dateStr = appointmentTime.toLocaleDateString('en-US', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeStr = appointmentTime.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Multilingual message (Arabic, Hebrew, English)
    const message = `
🌸 *تذكير بالموعد / Appointment Reminder / תזכורת לפגישה* 🌸

*العربية:*
مرحباً ${appointment.customerName} 👋
لديك موعد خلال ساعة واحدة!

📅 التاريخ: ${dateStr}
🕐 الوقت: ${timeStr}
💅 الخدمة: ${appointment.treatment.nameAr}
💰 السعر: ₪${appointment.priceAtBooking}

نتطلع لرؤيتك! ✨

━━━━━━━━━━━━━━━━

*עברית:*
שלום ${appointment.customerName} 👋
יש לך פגישה בעוד שעה!

📅 תאריך: ${dateStr}
🕐 שעה: ${timeStr}
💅 טיפול: ${appointment.treatment.nameHe}
💰 מחיר: ₪${appointment.priceAtBooking}

אנחנו מצפים לראותך! ✨

━━━━━━━━━━━━━━━━

*English:*
Hi ${appointment.customerName} 👋
You have an appointment in 1 hour!

📅 Date: ${dateStr}
🕐 Time: ${timeStr}
💅 Treatment: ${appointment.treatment.nameEn}
💰 Price: ₪${appointment.priceAtBooking}

Looking forward to seeing you! ✨
    `.trim();

    return message;
  }

  /**
   * Send immediate booking confirmation via WhatsApp
   */
  static async sendBookingConfirmation(appointment: AppointmentWithTreatment): Promise<boolean> {
    console.log('[Reminder] 📱 sendBookingConfirmation called', {
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      phone: appointment.phone,
    });

    const client = this.getTwilioClient();
    if (!client) {
      console.warn('[Reminder] ⚠️  Twilio not configured - skipping booking confirmation');
      return false;
    }

    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappFrom) {
      console.error('[Reminder] ❌ TWILIO_WHATSAPP_NUMBER not configured in .env');
      return false;
    }

    try {
      const message = this.formatBookingConfirmationMessage(appointment);

      // Ensure phone number has + prefix
      const toNumber = appointment.phone.startsWith('+')
        ? `whatsapp:${appointment.phone}`
        : `whatsapp:+${appointment.phone}`;

      console.log('[Reminder] 📤 Sending booking confirmation...', {
        from: whatsappFrom,
        to: toNumber,
        phoneOriginal: appointment.phone,
        messageLength: message.length,
      });

      // Send via Twilio WhatsApp API
      const result = await client.messages.create({
        from: whatsappFrom,
        to: toNumber,
        body: message,
      });

      console.log('[Reminder] ✅ Booking confirmation sent successfully!', {
        messageSid: result.sid,
        status: result.status,
        to: toNumber,
      });

      return true;
    } catch (error: any) {
      console.error('[Reminder] ❌ Failed to send booking confirmation:', {
        errorMessage: error.message,
        errorCode: error.code,
        errorStatus: error.status,
        moreInfo: error.moreInfo,
        phone: appointment.phone,
        appointmentId: appointment.id,
      });
      return false;
    }
  }

  /**
   * Format WhatsApp booking confirmation message
   */
  private static formatBookingConfirmationMessage(appointment: AppointmentWithTreatment): string {
    const appointmentTime = new Date(appointment.startDatetime);

    // Format date and time in Israel timezone
    const dateStr = appointmentTime.toLocaleDateString('en-US', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeStr = appointmentTime.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Multilingual confirmation message (Arabic, Hebrew, English)
    const message = `
🌸 *تأكيد الحجز / Booking Confirmation / אישור הזמנה* 🌸

*العربية:*
مرحباً ${appointment.customerName} 👋
تم تأكيد موعدك بنجاح!

📅 التاريخ: ${dateStr}
🕐 الوقت: ${timeStr}
💅 الخدمة: ${appointment.treatment.nameAr}
💰 السعر: ₪${appointment.priceAtBooking}

سنرسل لك تذكيراً قبل الموعد بساعة. نراكم قريباً! ✨

━━━━━━━━━━━━━━━━

*עברית:*
שלום ${appointment.customerName} 👋
הפגישה שלך אושרה בהצלחה!

📅 תאריך: ${dateStr}
🕐 שעה: ${timeStr}
💅 טיפול: ${appointment.treatment.nameHe}
💰 מחיר: ₪${appointment.priceAtBooking}

נשלח לך תזכורת שעה לפני הפגישה. נתראה בקרוב! ✨

━━━━━━━━━━━━━━━━

*English:*
Hi ${appointment.customerName} 👋
Your appointment has been confirmed!

📅 Date: ${dateStr}
🕐 Time: ${timeStr}
💅 Treatment: ${appointment.treatment.nameEn}
💰 Price: ₪${appointment.priceAtBooking}

We'll send you a reminder 1 hour before your appointment. See you soon! ✨
    `.trim();

    return message;
  }

  /**
   * Get reminder statistics for admin dashboard
   */
  static async getReminderStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    recentReminders: any[];
  }> {
    const [totalSent, totalFailed, recentReminders] = await Promise.all([
      prisma.appointmentReminder.count({
        where: { status: 'sent' },
      }),
      prisma.appointmentReminder.count({
        where: { status: 'failed' },
      }),
      prisma.appointmentReminder.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' },
        include: {
          appointment: {
            include: {
              treatment: true,
            },
          },
        },
      }),
    ]);

    return {
      totalSent,
      totalFailed,
      recentReminders,
    };
  }
}
