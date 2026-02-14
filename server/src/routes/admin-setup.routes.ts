import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/setup
 * Create default admin user if no profiles exist
 * This endpoint is intentionally public to allow initial setup
 */
router.post(
  '/setup',
  asyncHandler(async (req, res) => {
    // Check if any profiles exist
    const profileCount = await prisma.profile.count();

    if (profileCount > 0) {
      res.status(400).json({
        message: 'Admin setup has already been completed',
      });
      return;
    }

    // Create default admin profile
    const hashedPassword = await AuthService.hashPassword(
      config.defaultAdminPassword
    );

    const adminProfile = await prisma.profile.create({
      data: {
        email: config.defaultAdminEmail,
        password: hashedPassword,
        role: 'admin',
      },
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      email: adminProfile.email,
      // Don't return the password, but remind the user what it is
      passwordHint: 'Use the DEFAULT_ADMIN_PASSWORD from environment variables',
    });
  })
);

export default router;
