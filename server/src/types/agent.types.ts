export type AgentStatus = 'idle' | 'working' | 'done' | 'error' | 'waiting';

export type AgentName = 'planner' | 'retriever' | 'coder' | 'tester' | 'reviewer' | 'manager';

export interface AgentEvent {
  id: string;
  type: 'status' | 'log' | 'phase' | 'debug_loop' | 'pr_created' | 'embedding' | 'memory';
  agent: AgentName;
  timestamp: number;
  data: Record<string, any>;
}

export interface AgentLogData {
  level: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
}

export interface AgentStatusData {
  status: AgentStatus;
  detail?: string;
}

export interface PlanStep {
  id: number;
  description: string;
  likelyFiles: string[];
  changeType: 'modify' | 'create' | 'delete' | 'config';
  complexity: 'low' | 'medium' | 'high';
}

export interface ImplementationPlan {
  summary: string;
  steps: PlanStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  estimatedFiles: string[];
}

export interface CodeChange {
  file: string;
  action: 'modify' | 'create';
  originalCode?: string;
  newCode: string;
  explanation?: string;
}

export interface CoderResult {
  explanation: string;
  changes: CodeChange[];
}

export interface TestResult {
  passed: boolean;
  score: number;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    file?: string;
    line?: number | null;
    message: string;
  }>;
  summary: string;
  executionOutput?: string;
}

export interface ReviewResult {
  approved: boolean;
  overallQuality: 'excellent' | 'good' | 'needs_work' | 'poor';
  feedback: Array<{
    category: 'style' | 'logic' | 'performance' | 'security' | 'documentation';
    comment: string;
  }>;
  summary: string;
}

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  duration: number;
}

export interface SolveSession {
  id: string;
  issueNumber: number;
  repoOwner: string;
  repoName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  plan?: ImplementationPlan;
  changes: CodeChange[];
  testResults: TestResult[];
  reviewResult?: ReviewResult;
  pr?: { number: number; url: string };
  error?: string;
  createdAt: number;
  completedAt?: number;
  events: AgentEvent[];
  metrics: SolveMetrics;
}

export interface SolveMetrics {
  totalTokens: number;
  totalDuration: number;
  agentDurations: Record<AgentName, number>;
  debugLoops: number;
  filesRetrieved: number;
  embeddingsGenerated: number;
}