'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IssueCard } from './issue-card';

export function IssueList() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getIssues().then(setIssues).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm py-10 text-center">Loading issues...</div>;
  if (error) return <div className="text-red-400 text-sm py-10 text-center">{error}. Configure repo in Settings.</div>;
  if (issues.length === 0) return <div className="text-muted-foreground text-sm py-10 text-center border border-dashed border-border rounded-xl">No open issues found.</div>;

  return (
    <div className="space-y-3">
      {issues.map(issue => (
        <IssueCard key={issue.number} issue={issue} />
      ))}
    </div>
  );
}