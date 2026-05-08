import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

export function setupWebSocket(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/ws',
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket connected: ${socket.id}`);

    socket.on('join-session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.debug(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on('leave-session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`WebSocket disconnected: ${socket.id}`);
    });
  });

  return io;
}

import { logger } from '../observability/logger.js';