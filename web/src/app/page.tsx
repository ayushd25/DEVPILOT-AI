'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { AgentPipeline } from '@/components/dashboard/agent-pipeline';
import { QuickStart } from '@/components/dashboard/quick-start';
import { useSettingsStore } from '@/stores/settings.store';

export default function DashboardPage() {
  const { repoOwner, repoName } = useSettingsStore();

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DevPilot AI</h1>
          <p className="text-muted-foreground mt-1">
            Autonomous multi-agent system for solving GitHub issues
          </p>
        </div>

        <StatsGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <AgentPipeline />
          <QuickStart />
        </div>

        {repoOwner && repoName && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {repoOwner}/{repoName}
              </h2>
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Repository connected. Go to <a href="/issues" className="text-emerald-400 hover:underline">Issues</a> to start solving.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}