'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const steps = [
  { num: '1', title: 'Add GitHub Token', desc: 'Grant access to your repository', href: '/settings' },
  { num: '2', title: 'Connect Repository', desc: 'Tell DevPilot which repo to fix', href: '/settings' },
  { num: '3', title: 'Solve an Issue', desc: 'Watch AI fix it autonomously', href: '/issues' },
];

export function QuickStart() {
  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-[#0f1029] p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-5 text-white">Get Started</h2>
      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.num} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold font-mono text-sm shrink-0 shadow-lg shadow-indigo-500/20">
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{step.title}</div>
              <div className="text-xs text-slate-400">{step.desc}</div>
            </div>
            <Link href={step.href} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                Go <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}