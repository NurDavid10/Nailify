import { Router } from 'express';
import { ReminderService } from '../services/reminder.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/reminders/send
 * Manually trigger WhatsApp reminders (for testing)
 * Admin only
 */
router.post(
  '/send',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const results = await ReminderService.sendWhatsAppReminders();

    res.json({
      message: 'Reminder check completed',
      ...results,
    });
  })
);

/**
 * GET /api/reminders/stats
 * Get reminder statistics
 * Admin only
 */
router.get(
  '/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await ReminderService.getReminderStats();

    res.json(stats);
  })
);

export default router;
