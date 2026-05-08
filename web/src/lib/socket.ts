import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { path: '/ws', transports: ['websocket'] });
  }
  return socket;
}

export function joinSession(sessionId: string) {
  const s = getSocket();
  s.emit('join-session', sessionId);
}

export function leaveSession(sessionId: string) {
  const s = getSocket();
  s.emit('leave-session', sessionId);
}