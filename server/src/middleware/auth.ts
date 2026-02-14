import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth.service';
import { UserRole } from '@prisma/client';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT token
 * Attaches user payload to req.user if valid
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for routes that work for both authenticated and public users
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = AuthService.verifyToken(token);
      req.user = payload;
    } catch (error) {
      // Silently ignore invalid tokens for optional auth
    }
  }

  next();
}
