import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import prisma from './config/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Favicon handler (ignore requests)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Routes
import authRoutes from './routes/auth.routes';
import machinesRoutes from './routes/machines.routes';
import ordersRoutes from './routes/orders.routes';
import productionRoutes from './routes/production.routes';
import tasksRoutes from './routes/tasks.routes';
import usersRoutes from './routes/users.routes';
import qrRoutes from './routes/qr.routes';
import shiftsRoutes from './routes/shifts.routes';
import worklogsRoutes from './routes/worklogs.routes';
import analyticsRoutes from './routes/analytics.routes';
import incidentsRoutes from './routes/incidents.routes';
import commentsRoutes from './routes/comments.routes';
import materialsRoutes from './routes/materials.routes';
app.use('/api/auth', authRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/worklogs', worklogsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/materials', materialsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

// Socket.io connection handling
import { setupSocketHandlers } from './socket/socket.handler';
setupSocketHandlers(io);

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL environment variable is not set!');
  logger.error('Please set DATABASE_URL in your environment variables.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  logger.warn('⚠️  JWT_SECRET environment variable is not set. Using default (NOT SECURE FOR PRODUCTION)');
}

httpServer.listen(PORT, HOST, () => {
  logger.info(`✅ Server running on ${HOST}:${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`🔗 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, io, prisma };

