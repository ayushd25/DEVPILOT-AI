'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { RepoConfig } from '@/components/settings/repo-config';
import { LlmSelector } from '@/components/settings/llm-selector';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure API keys, repository, and agent models</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ApiKeysForm />
          <RepoConfig />
        </div>
        <LlmSelector />
      </div>
    </MainLayout>
  );
}