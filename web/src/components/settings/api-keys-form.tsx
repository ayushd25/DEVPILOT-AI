'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings.store';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { GitBranch, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export function ApiKeysForm() {
  const { githubToken, setSettings } = useSettingsStore();
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!githubToken) return toast('Please enter a GitHub token', 'error');
    try {
      await api.saveSettings({ githubToken });
      toast('GitHub token saved securely', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res: any = await api.testConnection();
      toast(`Connected as ${res.user.login}`, 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
                   <GitBranch className="w-5 h-5 text-muted-foreground" /> 
          GitHub Access
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-6 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            DevPilot needs a GitHub token to read issues and create pull requests. 
            Your token is sent directly to the backend and is never stored in our database.
            <a href="https://github.com/settings/tokens?type=beta" target="_blank" className="text-emerald-400 hover:underline ml-1">Generate a token →</a>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">GitHub Personal Access Token</label>
          <div className="relative">
            <Input 
              type={show ? 'text' : 'password'} 
              placeholder="github_pat_xxxxxxxxxxxx" 
              value={githubToken} 
              onChange={e => setSettings({ githubToken: e.target.value })} 
            />
            <button 
              onClick={() => setShow(!show)} 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button onClick={save}>Save Token</Button>
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? 'Verifying...' : 'Verify Connection'}
          </Button>
        </div>
      </div>
    </Card>
  );
}