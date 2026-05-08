'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings.store';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { FolderGit2 } from 'lucide-react';

export function RepoConfig() {
  const { repoOwner, repoName, setSettings } = useSettingsStore();
  const { toast } = useToast();

  const save = async () => {
    if (!repoOwner || !repoName) return toast('Enter both fields', 'error');
    try {
      await api.saveSettings({ repoOwner, repoName });
      toast(`Connected to ${repoOwner}/${repoName}`, 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FolderGit2 className="w-5 h-5 text-muted-foreground" /> Repository</CardTitle>
      </CardHeader>
      <div className="px-6 pb-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Owner</label>
          <Input placeholder="e.g. vercel" value={repoOwner} onChange={e => setSettings({ repoOwner: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Repository Name</label>
          <Input placeholder="e.g. next.js" value={repoName} onChange={e => setSettings({ repoName: e.target.value })} />
        </div>
        <Button onClick={save}>Connect Repository</Button>
      </div>
    </Card>
  );
}