import { Router } from 'express';
import { z } from 'zod';
import { AvailabilityService } from '../services/availability.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Availability rule schema
const createRuleSchema = z.object({
  specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  slotIntervalMinutes: z.number().int().positive('Slot interval must be positive'),
});

/**
 * GET /api/availability/rules
 * Get all availability rules (public)
 */
router.get(
  '/rules',
  asyncHandler(async (req, res) => {
    const rules = await AvailabilityService.getRules();
    res.json(rules);
  })
);

/**
 * POST /api/availability/rules
 * Create a new availability rule (admin only)
 */
router.post(
  '/rules',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = createRuleSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    const rule = await AvailabilityService.createRule(result.data);
    res.status(201).json(rule);
  })
);

/**
 * DELETE /api/availability/rules/:id
 * Delete an availability rule (admin only)
 */
router.delete(
  '/rules/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await AvailabilityService.deleteRule(req.params.id);
    res.json(result);
  })
);

/**
 * GET /api/availability/dates
 * Get all dates that have availability rules (public)
 */
router.get(
  '/dates',
  asyncHandler(async (req, res) => {
    const dates = await AvailabilityService.getAvailableDates();
    res.json(dates);
  })
);

/**
 * GET /api/availability/slots?date=YYYY-MM-DD
 * Get available time slots for a specific date (public)
 */
router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const dateStr = req.query.date as string;

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      res.status(400).json({
        message: 'Invalid or missing date parameter (expected YYYY-MM-DD)',
      });
      return;
    }

    const slots = await AvailabilityService.getAvailableTimeSlots(dateStr);
    res.json(slots);
  })
);

export default router;
