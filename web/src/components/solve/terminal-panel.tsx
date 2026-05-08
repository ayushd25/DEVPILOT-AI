'use client';

import { useSolveStore } from '@/stores/solve.store';
import { useEffect, useRef, useState } from 'react';

export function TerminalPanel() {
  const events = useSolveStore((s) => s.events);
  const [lines, setLines] = useState<string[]>(['$ devpilot init...', '→ Agents ready.']);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEvents = events.filter(e => e.type === 'log');
    if (logEvents.length > 0) {
      const last = logEvents[logEvents.length - 1];
      const prefix = last.data.level === 'success' ? '✓' : last.data.level === 'error' ? '✗' : '→';
      setLines(prev => [...prev, `${prefix} [${last.agent}] ${last.data.message}`]);
    }
  }, [events]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      <div className="h-10 border-b border-border flex items-center gap-2 px-4 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 terminal-text text-muted-foreground">
        {lines.map((line, i) => (
          <div key={i} className="animate-fade-in whitespace-pre-wrap break-all">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}