export interface SolveJobData {
  sessionId: string;
  issueNumber: number;
  repoOwner: string;
  repoName: string;
  issueTitle: string;
  issueBody: string;
  issueLabels: string[];
}

export interface EmbedJobData {
  repoOwner: string;
  repoName: string;
  files: Array<{ path: string; content: string }>;
}

export type JobType = 'solve' | 'embed';

export interface JobResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}