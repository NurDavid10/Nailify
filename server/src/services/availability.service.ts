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

    console.log('[getAvailableTimeSlots] Received dateStr:', dateStr);
    console.log('[getAvailableTimeSlots] Parsed as UTC date:', date.toISOString());

    // Get all availability rules for this specific date (supports multiple shifts)
    const allRules = await prisma.availabilityRule.findMany({
      where: {
        specificDate: date,
      },
      orderBy: { startTime: 'asc' },
    });

    console.log('[getAvailableTimeSlots] Found availability rules:', allRules.length);
    allRules.forEach((rule, idx) => {
      console.log(`  Rule ${idx + 1}:`, {
        specificDate: rule.specificDate.toISOString(),
        startTime: rule.startTime.toISOString(),
        endTime: rule.endTime.toISOString(),
        interval: rule.slotIntervalMinutes,
      });
    });

    if (!allRules || allRules.length === 0) {
      console.log('[getAvailableTimeSlots] No rules found, returning empty array');
      return [];
    }

    // Get existing appointments for this day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log('[getAvailableTimeSlots] Querying appointments for date range:', {
      dateStr,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
    });

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

    console.log('[getAvailableTimeSlots] Found appointments:', appointments.map(apt => ({
      start: apt.startDatetime.toISOString(),
      end: apt.endDatetime.toISOString(),
    })));

    // Generate time slots from all rules
    const slots: TimeSlot[] = [];
    const now = new Date();
    console.log('[getAvailableTimeSlots] Current time (now):', now.toISOString());

    for (const rules of allRules) {
      const startTime = AvailabilityService.formatTime(rules.startTime);
      const endTime = AvailabilityService.formatTime(rules.endTime);

      console.log('[getAvailableTimeSlots] Processing rule with times:', { startTime, endTime });

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      // Create date in local timezone (Israel) - NOT UTC
      // This ensures admin's input time (e.g., 16:00) is treated as local time
      const [year, month, day] = dateStr.split('-').map(Number);
      let currentTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);

      const endTimeDate = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

      console.log('[getAvailableTimeSlots] Generating slots from', currentTime.toISOString(), 'to', endTimeDate.toISOString());

      let slotsGenerated = 0;
      let slotsSkippedPast = 0;

      while (currentTime < endTimeDate) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(
          currentTime.getTime() + rules.slotIntervalMinutes * 60 * 1000
        );

        // Skip slots that have already passed (for today)
        if (slotStart <= now) {
          slotsSkippedPast++;
          currentTime = slotEnd;
          continue;
        }

        slotsGenerated++;

        // Check if slot is available (not overlapping with existing appointments)
        const isAvailable = !appointments.some((apt) => {
          const aptStart = apt.startDatetime;
          const aptEnd = apt.endDatetime;
          const overlaps = (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          );

          if (overlaps) {
            console.log('[getAvailableTimeSlots] Slot overlaps with appointment:', {
              slotStart: slotStart.toISOString(),
              slotEnd: slotEnd.toISOString(),
              aptStart: aptStart.toISOString(),
              aptEnd: aptEnd.toISOString(),
            });
          }

          return overlaps;
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: isAvailable,
        });

        currentTime = slotEnd;
      }

      console.log('[getAvailableTimeSlots] Rule generated:', slotsGenerated, 'slots, skipped', slotsSkippedPast, 'past slots');
    }

    console.log('[getAvailableTimeSlots] Total slots generated:', slots.length);
    console.log('[getAvailableTimeSlots] Available slots:', slots.filter(s => s.available).length);

    return slots;
  }

  /**
   * Helper to format time from Date to HH:MM (in local timezone)
   */
  private static formatTime(date: Date): string {
    // Use local time, not UTC
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper to parse HH:MM string to Date (today at that time in local timezone)
   */
  private static parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    // Use local time, not UTC
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
