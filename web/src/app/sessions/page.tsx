'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.getSessions().then(setSessions).catch(() => {});
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">History of autonomous solve runs</p>
        </div>
        <div className="space-y-3">
          {sessions.length === 0 && <div className="text-muted-foreground text-sm py-10 text-center border border-dashed border-border rounded-xl">No sessions yet.</div>}
          {sessions.map((s) => (
            <Link key={s.id} href={`/solve/${s.id}`} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20 block">
              <div className={`w-3 h-3 rounded-full ${s.status === 'completed' ? 'bg-emerald-500' : s.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Issue #{s.issueNumber}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  {s.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : s.status === 'failed' ? <XCircle className="w-3 h-3 text-red-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  <span>•</span>
                  <span>{s.metrics?.totalDuration ? `${(s.metrics.totalDuration / 1000).toFixed(1)}s` : '...'}</span>
                </div>
              </div>
              {s.pr && <a href={s.pr.url} target="_blank" onClick={e => e.stopPropagation()} className="text-xs text-emerald-400 hover:underline">View PR →</a>}
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}