'use client';

import { useSolveStore } from '@/stores/solve.store';

export function ReasoningTimeline() {
  const events = useSolveStore((s) => s.events);
  const phases = events.filter(e => e.type === 'phase' || e.type === 'debug_loop');

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">AI Reasoning Timeline</h3>
      <div className="space-y-4">
        {phases.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Waiting for execution...</p>}
        {phases.map((p, i) => (
          <div key={p.id} className="flex gap-3 relative">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${p.type === 'debug_loop' ? 'bg-red-500' : 'bg-emerald-500'} shrink-0 mt-0.5`} />
              {i < phases.length - 1 && <div className="w-px h-full bg-border absolute top-3 left-[5px]" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-foreground">{p.data.message}</p>
              {p.type === 'debug_loop' && (
                <p className="text-xs text-red-400 mt-1 font-mono">Retry {p.data.attempt}/{p.data.maxRetries}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}