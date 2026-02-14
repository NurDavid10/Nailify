import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation error',
        errors: result.error.errors,
      });
      return;
    }

    const { email, password } = result.data;

    try {
      const loginResponse = await AuthService.login(email, password);
      res.json(loginResponse);
    } catch (error) {
      res.status(401).json({
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const profile = await AuthService.getProfile(req.user.userId);
    res.json({ profile });
  })
);

export default router;
