import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      startTime: this.formatTime(rule.startTime),
      endTime: this.formatTime(rule.endTime),
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
        specificDate: new Date(data.specificDate),
        startTime: this.parseTime(data.startTime),
        endTime: this.parseTime(data.endTime),
        slotIntervalMinutes: data.slotIntervalMinutes,
      },
    });

    return {
      id: rule.id,
      specificDate: rule.specificDate.toISOString().split('T')[0],
      startTime: this.formatTime(rule.startTime),
      endTime: this.formatTime(rule.endTime),
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
    const now = new Date();

    for (const rules of allRules) {
      const startTime = this.formatTime(rules.startTime);
      const endTime = this.formatTime(rules.endTime);

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setUTCHours(startHour, startMinute, 0, 0);

      const endTimeDate = new Date(date);
      endTimeDate.setUTCHours(endHour, endMinute, 0, 0);

      while (currentTime < endTimeDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(
          currentTime.getTime() + rules.slotIntervalMinutes * 60 * 1000
        );

        // Skip slots that have already passed (for today)
        if (slotStart <= now) {
          currentTime = slotEnd;
          continue;
        }

        // Check if slot is available (not overlapping with existing appointments)
        const isAvailable = !appointments.some((apt) => {
          const aptStart = apt.startDatetime;
          const aptEnd = apt.endDatetime;
          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          );
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
   * Helper to format time from Date to HH:MM
   */
  private static formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper to parse HH:MM string to Date (today at that time)
   */
  private static parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  }
}
