import { PrismaClient } from '@prisma/client';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

// Israel timezone constant
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

export interface TimeSlot {
  start: string; // ISO string
  end: string; // ISO string
  available: boolean;
}

export interface CreateAvailabilityRuleDto {
  specificDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotIntervalMinutes: number;
}

export class AvailabilityService {
  /**
   * Get all availability rules
   */
  static async getRules() {
    const rules = await prisma.availabilityRule.findMany({
      orderBy: { specificDate: 'asc' },
    });

    return rules.map((rule) => ({
      id: rule.id,
      specificDate: rule.specificDate.toISOString().split('T')[0],
      startTime: AvailabilityService.formatTime(rule.startTime),
      endTime: AvailabilityService.formatTime(rule.endTime),
      slotIntervalMinutes: rule.slotIntervalMinutes,
      createdAt: rule.createdAt,
    }));
  }

  /**
   * Create a new availability rule
   */
  static async createRule(data: CreateAvailabilityRuleDto) {
    const rule = await prisma.availabilityRule.create({
      data: {
        specificDate: new Date(data.specificDate + 'T00:00:00.000Z'),
        startTime: AvailabilityService.parseTime(data.startTime),
        endTime: AvailabilityService.parseTime(data.endTime),
        slotIntervalMinutes: data.slotIntervalMinutes,
      },
    });

    return {
      id: rule.id,
      specificDate: rule.specificDate.toISOString().split('T')[0],
      startTime: AvailabilityService.formatTime(rule.startTime),
      endTime: AvailabilityService.formatTime(rule.endTime),
      slotIntervalMinutes: rule.slotIntervalMinutes,
      createdAt: rule.createdAt,
    };
  }

  /**
   * Delete an availability rule
   */
  static async deleteRule(id: string) {
    await prisma.availabilityRule.delete({
      where: { id },
    });

    return { message: 'Availability rule deleted successfully' };
  }

  /**
   * Get distinct dates that have availability rules
   */
  static async getAvailableDates(): Promise<string[]> {
    const rules = await prisma.availabilityRule.findMany({
      select: { specificDate: true },
      distinct: ['specificDate'],
      orderBy: { specificDate: 'asc' },
    });

    // Return unique date strings in YYYY-MM-DD format
    const dates = new Set(
      rules.map((r) => r.specificDate.toISOString().split('T')[0])
    );
    return [...dates];
  }

  /**
   * Get available time slots for a specific date
   * Ported from src/db/api.ts lines 84-160
   */
  static async getAvailableTimeSlots(dateStr: string): Promise<TimeSlot[]> {
    // Parse the date string (YYYY-MM-DD)
    const date = new Date(dateStr + 'T00:00:00.000Z');

    // Get all availability rules for this specific date (supports multiple shifts)
    const allRules = await prisma.availabilityRule.findMany({
      where: {
        specificDate: date,
      },
      orderBy: { startTime: 'asc' },
    });

    if (!allRules || allRules.length === 0) {
      return [];
    }

    // Get existing appointments for this day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'booked',
        startDatetime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startDatetime: true,
        endDatetime: true,
      },
    });

    // Generate time slots from all rules
    const slots: TimeSlot[] = [];
    // Get current time in Israel timezone for accurate "past slot" filtering
    const nowUtc = new Date();

    for (const rules of allRules) {
      const startTime = AvailabilityService.formatTime(rules.startTime);
      const endTime = AvailabilityService.formatTime(rules.endTime);

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      // Create date in Israel timezone and convert to UTC
      // This ensures admin's input time (e.g., 16:00) is treated as Israel time
      const [year, month, day] = dateStr.split('-').map(Number);

      // Create a date object representing this time in Israel timezone
      const israelStartDate = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
      const israelEndDate = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

      // Convert to UTC for consistent storage/comparison
      let currentTime = fromZonedTime(israelStartDate, ISRAEL_TIMEZONE);
      const endTimeDate = fromZonedTime(israelEndDate, ISRAEL_TIMEZONE);

      while (currentTime < endTimeDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(
          currentTime.getTime() + rules.slotIntervalMinutes * 60 * 1000
        );

        // Skip slots that have already passed (for today)
        // Compare in UTC since both slotStart and nowUtc are in UTC
        if (slotStart <= nowUtc) {
          currentTime = slotEnd;
          continue;
        }

        // Check if slot is available (not overlapping with existing appointments)
        const isAvailable = !appointments.some((apt) => {
          const aptStart = apt.startDatetime;
          const aptEnd = apt.endDatetime;

          const condition1 = slotStart >= aptStart && slotStart < aptEnd;
          const condition2 = slotEnd > aptStart && slotEnd <= aptEnd;
          const condition3 = slotStart <= aptStart && slotEnd >= aptEnd;
          return condition1 || condition2 || condition3;
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: isAvailable,
        });

        currentTime = slotEnd;
      }
    }

    return slots;
  }

  /**
   * Helper to format time from Date to HH:MM (in Israel timezone)
   */
  private static formatTime(date: Date): string {
    // Convert UTC date to Israel timezone for display
    const israelDate = toZonedTime(date, ISRAEL_TIMEZONE);
    const hours = israelDate.getHours().toString().padStart(2, '0');
    const minutes = israelDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper to parse HH:MM string to Date (today at that time in Israel timezone, stored as UTC)
   */
  private static parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const israelDate = toZonedTime(now, ISRAEL_TIMEZONE);
    israelDate.setHours(hours, minutes, 0, 0);
    // Convert back to UTC for storage
    return fromZonedTime(israelDate, ISRAEL_TIMEZONE);
  }
}
