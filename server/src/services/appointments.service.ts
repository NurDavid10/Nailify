import { PrismaClient, Prisma } from '@prisma/client';
import { ReminderService } from './reminder.service';

const prisma = new PrismaClient();

export interface CreateAppointmentDto {
  customerName: string;
  phone: string;
  notes?: string;
  treatmentId: string;
  startDatetime: string; // ISO string
  endDatetime: string; // ISO string
  priceAtBooking: number;
  createdBy?: 'admin' | 'customer';
}

export interface UpdateAppointmentStatusDto {
  status: 'booked' | 'canceled';
}

export class AppointmentsService {
  /**
   * Transform treatment to snake_case for frontend
   */
  private static transformTreatment(t: any) {
    return {
      id: t.id,
      name_ar: t.nameAr,
      name_he: t.nameHe,
      name_en: t.nameEn,
      duration_minutes: t.durationMinutes,
      price: t.price.toNumber(),
      is_active: t.isActive,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
    };
  }

  /**
   * Transform appointment to snake_case for frontend
   */
  private static transformAppointment(apt: any) {
    return {
      id: apt.id,
      customer_name: apt.customerName,
      phone: apt.phone,
      notes: apt.notes,
      treatment_id: apt.treatmentId,
      start_datetime: apt.startDatetime.toISOString(),
      end_datetime: apt.endDatetime.toISOString(),
      price_at_booking: apt.priceAtBooking.toNumber(),
      status: apt.status,
      created_by: apt.createdBy,
      created_at: apt.createdAt.toISOString(),
      treatments: apt.treatment ? AppointmentsService.transformTreatment(apt.treatment) : undefined,
    };
  }

  /**
   * Get all appointments (optionally filter by status)
   */
  static async getAppointments(status?: 'booked' | 'canceled') {
    const appointments = await prisma.appointment.findMany({
      where: status ? { status } : undefined,
      include: {
        treatment: true,
      },
      orderBy: { startDatetime: 'asc' },
    });

    return appointments.map((apt) => AppointmentsService.transformAppointment(apt));
  }

  /**
   * Get upcoming appointments (next 7 days)
   */
  static async getUpcomingAppointments() {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'booked',
        startDatetime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        treatment: true,
      },
      orderBy: { startDatetime: 'asc' },
    });

    return appointments.map((apt) => AppointmentsService.transformAppointment(apt));
  }

  /**
   * Create an appointment with atomic transaction to prevent double-booking
   * Replicates the create_appointment_atomic RPC function
   */
  static async createAppointment(data: CreateAppointmentDto) {
    const startDatetime = new Date(data.startDatetime);
    const endDatetime = new Date(data.endDatetime);

    // Use a transaction with Serializable isolation level
    const appointment = await prisma.$transaction(
      async (tx) => {
        // 1. Lock the appointments table to prevent concurrent modifications
        await tx.$executeRaw`LOCK TABLE appointments IN SHARE ROW EXCLUSIVE MODE`;

        // 2. Check for overlapping booked appointments
        const conflicts = await tx.appointment.count({
          where: {
            status: 'booked',
            OR: [
              // New appointment starts during existing appointment
              {
                AND: [
                  { startDatetime: { lte: startDatetime } },
                  { endDatetime: { gt: startDatetime } },
                ],
              },
              // New appointment ends during existing appointment
              {
                AND: [
                  { startDatetime: { lt: endDatetime } },
                  { endDatetime: { gte: endDatetime } },
                ],
              },
              // New appointment completely contains existing appointment
              {
                AND: [
                  { startDatetime: { gte: startDatetime } },
                  { endDatetime: { lte: endDatetime } },
                ],
              },
            ],
          },
        });

        // 3. If conflict exists, throw error
        if (conflicts > 0) {
          throw new Error('Time slot is no longer available');
        }

        // 4. Create the appointment
        const newAppointment = await tx.appointment.create({
          data: {
            customerName: data.customerName,
            phone: data.phone,
            notes: data.notes,
            treatmentId: data.treatmentId,
            startDatetime,
            endDatetime,
            priceAtBooking: data.priceAtBooking,
            status: 'booked',
            createdBy: data.createdBy || 'customer',
          },
          include: {
            treatment: true,
          },
        });

        return newAppointment;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 seconds timeout
      }
    );

    // Send booking confirmation via WhatsApp (async, don't wait for it)
    ReminderService.sendBookingConfirmation(appointment as any).catch((error) => {
      console.error('[Appointments] Failed to send booking confirmation:', error);
    });

    return AppointmentsService.transformAppointment(appointment);
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(id: string) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'canceled' },
      include: {
        treatment: true,
      },
    });

    return AppointmentsService.transformAppointment(appointment);
  }
}
