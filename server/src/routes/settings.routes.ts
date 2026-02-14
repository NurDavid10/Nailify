import { Router } from 'express';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Update setting schema
const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

/**
 * GET /api/settings
 * Get all settings (public)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await SettingsService.getSettings();
    res.json(settings);
  })
);

/**
 * GET /api/settings/:key
 * Get a single setting by key (public)
 */
router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const setting = await SettingsService.getSetting(req.params.key);
    res.json(setting);
  })
);

/**
 * PUT /api/settings/:key
 * Update a setting (admin only)
 */
router.put(
  '/:key',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = updateSettingSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    const setting = await SettingsService.updateSetting(
      req.params.key,
      result.data.value
    );
    res.json(setting);
  })
);

export default router;
