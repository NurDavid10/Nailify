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
    console.log('[GET /appointments] Fetching appointments with status:', status);
    const appointments = await AppointmentsService.getAppointments(status);
    console.log('[GET /appointments] Found appointments:', appointments.length);
    console.log('[GET /appointments] Appointments data:', JSON.stringify(appointments, null, 2));
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
    console.log('Received appointment request:', JSON.stringify(req.body, null, 2));
    const result = createAppointmentSchema.safeParse(req.body);

    if (!result.success) {
      console.error('Validation failed:', result.error.errors);
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    try {
      console.log('Creating appointment with data:', result.data);
      const appointment = await AppointmentsService.createAppointment(result.data);
      console.log('Appointment created successfully:', appointment);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
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
