// apps/api/src/app.ts
// Updated with AI routes - only 3 lines changed!

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import aiRoutes from './routes/ai'; // 🤖 ADD THIS LINE

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ai: process.env.GEMINI_API_KEY ? 'enabled' : 'disabled' // 🤖 ADD THIS LINE
  });
});

app.get('/api/ai-test', (req, res) => {
  res.json({ message: 'AI routes debug test works' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes); // 🤖 ADD THIS LINE

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Content API: http://localhost:${PORT}/api/content`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`); // 🤖 ADD THIS LINE
  console.log(`🧠 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Not configured'}`); // 🤖 ADD THIS LINE
});

export default app;