import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@nailsbooking.local',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

// Validate required env vars
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
