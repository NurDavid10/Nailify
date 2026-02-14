import { Router } from 'express';
import { z } from 'zod';
import { AppointmentsService } from '../services/appointments.service';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Appointment schema
const createAppointmentSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  notes: z.string().optional(),
  treatmentId: z.string().uuid('Invalid treatment ID'),
  startDatetime: z.string().datetime('Invalid start datetime'),
  endDatetime: z.string().datetime('Invalid end datetime'),
  priceAtBooking: z.number().nonnegative('Price must be non-negative'),
  createdBy: z.enum(['admin', 'customer']).optional(),
});

/**
 * GET /api/appointments?status=booked
 * Get all appointments (admin only)
 */
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = req.query.status as 'booked' | 'canceled' | undefined;
    const appointments = await AppointmentsService.getAppointments(status);
    res.json(appointments);
  })
);

/**
 * GET /api/appointments/upcoming
 * Get upcoming appointments (next 7 days) (admin only)
 */
router.get(
  '/upcoming',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const appointments = await AppointmentsService.getUpcomingAppointments();
    res.json(appointments);
  })
);

/**
 * POST /api/appointments
 * Create a new appointment with atomic transaction (public + admin)
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = createAppointmentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    try {
      const appointment = await AppointmentsService.createAppointment(result.data);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof Error && error.message === 'Time slot is no longer available') {
        res.status(409).json({ message: error.message });
      } else {
        throw error;
      }
    }
  })
);

/**
 * PATCH /api/appointments/:id/cancel
 * Cancel an appointment (admin only)
 */
router.patch(
  '/:id/cancel',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const appointment = await AppointmentsService.cancelAppointment(req.params.id);
    res.json(appointment);
  })
);

export default router;
