export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface IssueData {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  user: string;
  comments: number;
}

export interface SettingsData {
  llmProvider: string;
  llmModel: string;
  openrouterKey: string;
  geminiKey: string;
  githubToken: string;
  repoOwner: string;
  repoName: string;
  sandboxEnabled: boolean;
}

export interface RepoIndexStatus {
  indexed: boolean;
  fileCount: number;
  lastIndexed?: number;
  collectionName: string;
}