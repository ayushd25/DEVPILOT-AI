'use client';

import { Network, Search, Code2, TestTube2, ClipboardCheck, ChevronRight } from 'lucide-react';

const agents = [
  { name: 'Planner', icon: Network, desc: 'Analyze & plan' },
  { name: 'Retriever', icon: Search, desc: 'Semantic search' },
  { name: 'Coder', icon: Code2, desc: 'Generate fixes' },
  { name: 'Tester', icon: TestTube2, desc: 'Validate code' },
  { name: 'Reviewer', icon: ClipboardCheck, desc: 'Quality check' },
];

export function AgentPipeline() {
  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-[#0f1029] p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-5 text-white">Agent Pipeline</h2>
      <div className="flex items-center justify-between gap-2">
        {agents.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#13143a] border border-white/5 flex-1 transition-all hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-1 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-violet-400 group-hover:from-indigo-500/30 group-hover:to-violet-500/30 transition-colors">
                <agent.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-white">{agent.name}</span>
              <span className="text-[10px] text-slate-500">{agent.desc}</span>
            </div>
            {i < agents.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}