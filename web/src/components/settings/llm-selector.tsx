'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export function LlmSelector() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-muted-foreground" /> AI Engine</CardTitle>
      </CardHeader>
      <div className="px-6 pb-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Multi-Agent System Active</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DevPilot uses a 5-agent orchestration pipeline (Planner, Retriever, Coder, Tester, Reviewer) 
              powered by enterprise AI models with semantic code retrieval (RAG) and autonomous debugging capabilities.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">RAG</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Auto-Debug</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Multi-Agent</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}