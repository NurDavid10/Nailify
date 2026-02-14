import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  profile: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate a JWT token
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  /**
   * Verify a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload & {
        iat: number;
        exp: number;
      };
      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const profile = await prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, profile.password);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({
      userId: profile.id,
      role: profile.role,
    });

    return {
      token,
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      },
    };
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }
}
