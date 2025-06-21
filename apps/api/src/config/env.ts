import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to get required env var
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Validate and get all required environment variables
const DATABASE_URL = getRequiredEnvVar('DATABASE_URL');
const JWT_SECRET = getRequiredEnvVar('JWT_SECRET');
const JWT_REFRESH_SECRET = getRequiredEnvVar('JWT_REFRESH_SECRET');

// Export configuration with guaranteed non-undefined values
export const config = {
  // Server
  port: parseInt(process.env.API_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/ai_cms_content',

  // JWT - These are guaranteed to be strings
  jwt: {
    secret: JWT_SECRET,
    refreshSecret: JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // File Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // AI Services
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleCloudApiKey: process.env.GOOGLE_CLOUD_API_KEY,
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
  },
} as const;

export default config;