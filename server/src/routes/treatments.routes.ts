import { Router } from 'express';
import { z } from 'zod';
import { TreatmentsService } from '../services/treatments.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Treatment schema
const createTreatmentSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameHe: z.string().min(1, 'Hebrew name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  price: z.number().nonnegative('Price must be non-negative'),
  isActive: z.boolean().optional(),
});

const updateTreatmentSchema = createTreatmentSchema.partial();

/**
 * GET /api/treatments
 * Get all treatments (public)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly === 'true';
    const treatments = await TreatmentsService.getTreatments(activeOnly);
    res.json(treatments);
  })
);

/**
 * GET /api/treatments/:id
 * Get a single treatment by ID (public)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const treatment = await TreatmentsService.getTreatmentById(req.params.id);
    res.json(treatment);
  })
);

/**
 * POST /api/treatments
 * Create a new treatment (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = createTreatmentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    const treatment = await TreatmentsService.createTreatment(result.data);
    res.status(201).json(treatment);
  })
);

/**
 * PUT /api/treatments/:id
 * Update a treatment (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = updateTreatmentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    const treatment = await TreatmentsService.updateTreatment(
      req.params.id,
      result.data
    );
    res.json(treatment);
  })
);

/**
 * DELETE /api/treatments/:id
 * Delete a treatment (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await TreatmentsService.deleteTreatment(req.params.id);
    res.json(result);
  })
);

export default router;
