'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useSolveStore } from '@/stores/solve.store';
import { api } from '@/lib/api';
import { WorkflowGraph } from '@/components/solve/workflow-graph';
import { AgentLogs } from '@/components/solve/agent-logs';
import { ReasoningTimeline } from '@/components/solve/reasoning-timeline';
import { AgentChatPanel } from '@/components/solve/agent-chat-panel';
import { CodeDiffViewer } from '@/components/solve/code-diff-viewer';
import { TerminalPanel } from '@/components/solve/terminal-panel';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SolvePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  useSocket(sessionId);
  
  const { events, prUrl, reset } = useSolveStore();
  const [issue, setIssue] = useState<any>(null);

    useEffect(() => {
    api.getSession(sessionId)
      .then((s: any) => setIssue({ number: s.issueNumber, title: s.issueTitle || 'Solving...' }))
      .catch(() => {}); // Ignore race condition errors
    return () => reset();
  }, [sessionId, reset]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/issues" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-semibold text-lg">Solving #{issue?.number || '...'}</h1>
            <p className="text-xs text-muted-foreground truncate max-w-md">{issue?.title}</p>
          </div>
        </div>
        {prUrl && (
          <a href={prUrl} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
            View PR <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Column: Graph & Timeline */}
        <div className="w-[45%] border-r border-border overflow-y-auto p-6 space-y-6">
          <WorkflowGraph />
          <ReasoningTimeline />
        </div>

        {/* Right Column: Logs, Chat, Code, Terminal */}
        <div className="w-[55%] flex flex-col">
          <div className="h-1/2 border-b border-border">
            <AgentLogs />
          </div>
          <div className="h-1/2 flex">
            <div className="w-1/2 border-r border-border overflow-hidden">
              <AgentChatPanel />
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="h-1/2 border-b border-border overflow-hidden">
                <CodeDiffViewer />
              </div>
              <div className="h-1/2 overflow-hidden">
                <TerminalPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}