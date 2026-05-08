'use client';

import { useEffect } from 'react';
import { getSocket, joinSession, leaveSession } from '@/lib/socket';
import { useSolveStore } from '@/stores/solve.store';

export function useSocket(sessionId: string | null) {
  const addEvent = useSolveStore((s) => s.addEvent);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    
    const handler = (event: any) => addEvent(event);
    socket.on('agent-event', handler);
    joinSession(sessionId);

    return () => {
      socket.off('agent-event', handler);
      leaveSession(sessionId);
    };
  }, [sessionId, addEvent]);
}