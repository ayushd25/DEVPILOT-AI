import { create } from 'zustand';

interface SettingsState {
  llmProvider: string;
  llmModel: string;
  openrouterKey: string;
  geminiKey: string;
  githubToken: string;
  repoOwner: string;
  repoName: string;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  llmProvider: 'openrouter',
  llmModel: 'anthropic/claude-3.5-sonnet',
  openrouterKey: '',
  geminiKey: '',
  githubToken: '',
  repoOwner: '',
  repoName: '',
  setSettings: (settings) => set(settings),
}));