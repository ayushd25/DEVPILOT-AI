'use client';

import { CheckCircle2, GitBranch, Bot, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Issues Resolved', value: '0', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'PRs Created', value: '0', icon: GitBranch, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { label: 'Active Agents', value: '5', icon: Bot, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { label: 'Open Issues', value: '0', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-2xl border ${stat.border} bg-[#0f1029] p-5 flex items-center gap-4 transition-all hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5`}>
          <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}