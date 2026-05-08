'use client';

import { useSolveStore } from '@/stores/solve.store';

export function AgentChatPanel() {
  const events = useSolveStore((s) => s.events);
  const statusEvents = events.filter(e => e.type === 'status');

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="h-10 border-b border-border flex items-center px-4 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Comms</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {statusEvents.map((e) => (
          <div key={e.id} className={`flex flex-col p-2.5 rounded-lg border text-xs agent-${e.agent}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold uppercase">{e.agent}</span>
              <span className="opacity-70 capitalize text-[10px]">{e.data.status}</span>
            </div>
            {e.data.detail && <span className="opacity-90">{e.data.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}