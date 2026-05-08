'use client';

import { useSolveStore } from '@/stores/solve.store';
import { cn } from '@/lib/utils';

export function AgentLogs() {
  const events = useSolveStore((s) => s.events);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="h-10 border-b border-border flex items-center justify-between px-4 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Agent Logs</span>
        <span className="text-xs font-mono text-muted-foreground">{events.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {events.length === 0 && <div className="text-muted-foreground text-center py-10">Waiting for agents...</div>}
        {events.map((e) => {
          if (e.type === 'log') {
            const time = new Date(e.timestamp).toLocaleTimeString('en-US', { hour12: false });
            return (
              <div key={e.id} className="flex gap-2 animate-fade-in">
                <span className="text-muted-foreground shrink-0">{time}</span>
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0', `agent-${e.agent}`)}>
                  {e.agent.slice(0, 4).toUpperCase()}
                </span>
                <span className={cn(`log-${e.data.level}`)}>{e.data.message}</span>
              </div>
            );
          }
          if (e.type === 'phase') {
            return (
              <div key={e.id} className="flex items-center gap-2 py-2 my-1 border-t border-b border-border/50 text-foreground font-sans animate-fade-in">
                <span className="text-emerald-400">⚡</span>
                <span className="font-medium text-xs">{e.data.message}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}