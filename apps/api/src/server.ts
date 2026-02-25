import './instrumentation'; // Must be first import — registers OTel auto-instrumentation

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { logger, createLogger } from './lib/logger';
import { registry } from './lib/metrics';
import contentRoutes from './routes/content';
import aiRoutes from './routes/ai';
import publicRoutes from './routes/public';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';

const log = createLogger('server');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Initialize Prisma
const prisma = new PrismaClient();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Structured request/response logging with request ID
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || uuidv4(),
    autoLogging: {
      ignore: (req) => req.url === '/health' || req.url === '/metrics',
    },
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req: any) => ({ method: req.method, url: req.url }),
      res: (res: any) => ({ statusCode: res.statusCode }),
    },
  })
);

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch {
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      ai: process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API test endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'API is working!',
    features: ['Auth', 'Content', 'AI Generation'],
    timestamp: new Date().toISOString()
  });
});

// Test database endpoint
app.get('/api/db-test', async (_req, res) => {
  try {
    const orgCount = await prisma.organization.count();

    res.json({
      message: 'Database connection successful!',
      organizationCount: orgCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/api/auth', '/api/content', '/api/ai', '/api/public', '/health', '/metrics']
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    log.info('Database connected successfully');

    app.listen(PORT, () => {
      log.info({
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        ai: process.env.GEMINI_API_KEY ? 'enabled' : 'not configured',
      }, 'Server started');
    });
  } catch (error) {
    log.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

export default app;
