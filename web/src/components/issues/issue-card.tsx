'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

export function IssueCard({ issue }: { issue: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [solving, setSolving] = useState(false);

  const handleSolve = async () => {
    setSolving(true);
    try {
      const data: any = await api.solveIssue(issue.number);
      toast(`Starting agents for #${issue.number}...`, 'success');
      router.push(`/solve/${data.sessionId}`);
    } catch (e: any) {
      toast(e.message, 'error');
      setSolving(false);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20 group">
      <div className="font-mono text-sm text-muted-foreground w-16 shrink-0">#{issue.number}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{issue.title}</h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          {issue.labels.map((l: any) => (
            <Badge key={l.name} style={{ backgroundColor: `${l.color}15`, color: l.color, borderColor: `${l.color}30` }}>{l.name}</Badge>
          ))}
          <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" /></svg> {issue.comments}</span>
          <span>{timeAgo(issue.created_at)}</span>
        </div>
      </div>
      <button onClick={handleSolve} disabled={solving} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
        <Bot className="w-4 h-4" />
        {solving ? 'Starting...' : 'Solve'}
      </button>
    </div>
  );
}