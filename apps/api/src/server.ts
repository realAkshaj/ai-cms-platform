import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import contentRoutes from './routes/content';
import aiRoutes from './routes/ai'; // ADD THIS LINE

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.API_PORT || 3001;

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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      ai: process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    features: ['Auth', 'Content', 'AI Generation'],
    timestamp: new Date().toISOString()
  });
});

// Test database endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    // Get count of organizations (should be 0 initially)
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
app.use('/api/ai', aiRoutes); // ADD THIS LINE

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/api/auth', '/api/content', '/api/ai', '/health'] // UPDATE THIS LINE
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('📊 Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API test: http://localhost:${PORT}/api/test`);
      console.log(`💾 Database test: http://localhost:${PORT}/api/db-test`);
      console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`); // ADD THIS LINE
      console.log(`🧠 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Not configured'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;