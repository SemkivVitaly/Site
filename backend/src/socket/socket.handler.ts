import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { logger } from '../utils/logger';

const authService = new AuthService();

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const payload = authService.verifyToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected`);
    });
  });
};

