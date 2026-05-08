'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { IssueList } from '@/components/issues/issue-list';

export default function IssuesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Open Issues</h1>
            <p className="text-muted-foreground mt-1">Select an issue for DevPilot to solve</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
            Refresh
          </button>
        </div>
        <IssueList />
      </div>
    </MainLayout>
  );
}