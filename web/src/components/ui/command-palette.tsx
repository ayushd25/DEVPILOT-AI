'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors">
        <Search className="w-3.5 h-3.5" />
        <span>Command...</span>
        <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
      </button>
    );
  }

  const commands = [
    { label: 'Go to Dashboard', action: () => router.push('/') },
    { label: 'Go to Issues', action: () => router.push('/issues') },
    { label: 'Go to Settings', action: () => router.push('/settings') },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="fixed left-1/2 top-1/2 z-[201] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl animate-slide-up">
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input autoFocus className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" placeholder="Type a command or search..." />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {commands.map((cmd) => (
            <button key={cmd.label} onClick={() => { cmd.action(); setOpen(false); }} className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm hover:bg-secondary transition-colors text-left">
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}