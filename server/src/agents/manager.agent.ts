import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { AgentEvent, SolveSession, SolveMetrics, CodeChange, ImplementationPlan } from '../types/agent.types.js';
import { LLMFactory } from '../services/llm/llm.factory.js';
import { ChromaDBService } from '../services/vector/chromadb.service.js';
import { GitHubService } from '../services/github/github.service.js';
import { DockerExecutor } from '../services/sandbox/docker.executor.js';
import { PlannerAgent } from './planner.agent.js';
import { RetrieverAgent } from './retriever.agent.js';
import { CoderAgent } from './coder.agent.js';
import { TesterAgent } from './tester.agent.js';
import { ReviewerAgent } from './reviewer.agent.js';
import { createAgentLogger } from '../observability/logger.js';
import { getTracer } from '../observability/tracer.js';
import { getMetrics } from '../observability/metrics.js';

const MAX_DEBUG_RETRIES = 3;

export class ManagerAgent extends EventEmitter {
  private sessionId: string;
  private llmFactory: LLMFactory;
  private chroma: ChromaDBService;
  private github: GitHubService;
  private sandbox: DockerExecutor;
  private logger: ReturnType<typeof createAgentLogger>;
  private events: AgentEvent[] = [];
  private metrics: SolveMetrics;

  constructor(config: {
    sessionId: string;
    llmFactory: LLMFactory;
    chroma: ChromaDBService;
    github: GitHubService;
    sandbox: DockerExecutor;
    redisUrl: string;
  }) {
    super();
    this.sessionId = config.sessionId;
    this.llmFactory = config.llmFactory;
    this.chroma = config.chroma;
    this.github = config.github;
    this.sandbox = config.sandbox;
    this.logger = createAgentLogger('manager', config.sessionId);
    this.metrics = {
      totalTokens: 0,
      totalDuration: 0,
      agentDurations: { planner: 0, retriever: 0, coder: 0, tester: 0, reviewer: 0, manager: 0 },
      debugLoops: 0,
      filesRetrieved: 0,
      embeddingsGenerated: 0,
    };
  }

  private emitEvent(type: AgentEvent['type'], data: Record<string, any>): void {
    const event: AgentEvent = {
      id: nanoid(),
      type: 'phase' as any,
      agent: 'manager' as any,
      timestamp: Date.now(),
      data,
    };
    this.events.push(event);
    this.emit('event', event);
  }

  async run(jobData: {
    issueNumber: number;
    repoOwner: string;
    repoName: string;
    issueTitle: string;
    issueBody: string | null;
    issueLabels: string[];
  }): Promise<SolveSession> {
    const startTime = Date.now();
    const tracer = getTracer();
    const rootSpanId = tracer.startSpan('solve_session', undefined, {
      sessionId: this.sessionId,
      issueNumber: jobData.issueNumber,
    });

    const llm = this.llmFactory.getDefaultProvider();
    const session: SolveSession = {
      id: this.sessionId,
      issueNumber: jobData.issueNumber,
      repoOwner: jobData.repoOwner,
      repoName: jobData.repoName,
      status: 'running',
      changes: [],
      testResults: [],
      createdAt: startTime,
      events: this.events,
      metrics: this.metrics,
    };

    try {
      // Get issue details
      this.emitEvent('phase', { message: 'Fetching issue details...', icon: 'fa-download' });
      const issue = await this.github.getIssue(jobData.repoOwner, jobData.repoName, jobData.issueNumber);
      
      // Get repo tree
      this.emitEvent('phase', { message: 'Fetching repository tree...', icon: 'fa-folder-tree' });
      const tree = await this.github.getRepoTree(jobData.repoOwner, jobData.repoName);

      // Phase 1: Planning
      this.emitEvent('phase', { message: 'Starting planning phase...', icon: 'fa-sitemap' });
      
      const planner = new PlannerAgent(llm, this.sessionId);
      this.pipeAgentEvents(planner);
      
      const plan = await planner.run({ issue, repoContext: `Repository has ${tree.length} files` });
      session.plan = plan;

      // Phase 2: Execute each step
      for (const step of plan.steps) {
        this.emitEvent('phase', { message: `Executing step ${step.id}: ${step.description}`, icon: 'fa-code' });

        // Retrieve relevant code
        const retriever = new RetrieverAgent(llm, this.sessionId, this.chroma, this.github);
        this.pipeAgentEvents(retriever);
        
        const codeContext = await retriever.run({
          query: step.description,
          likelyFiles: step.likelyFiles,
          repoOwner: jobData.repoOwner,
          repoName: jobData.repoName,
        });

        this.metrics.filesRetrieved += codeContext.length;

        // Code generation with auto-debug loop
        const coder = new CoderAgent(llm, this.sessionId);
        this.pipeAgentEvents(coder);
        
        const tester = new TesterAgent(llm, this.sessionId, this.sandbox);
        this.pipeAgentEvents(tester);

        let previousError: string | undefined;
        let previousAttempts: string[] = [];
        let stepSuccess = false;

        for (let attempt = 0; attempt <= MAX_DEBUG_RETRIES; attempt++) {
          if (attempt > 0) {
                         await new Promise(resolve => setTimeout(resolve, 35000));
            this.metrics.debugLoops++;
            this.emitEvent('debug_loop', {
              attempt,
              maxRetries: MAX_DEBUG_RETRIES,
              error: previousError,
            });
          }

          // Generate code
          const coderResult = await coder.run({
            step,
            issue,
            codeContext,
            previousError,
            previousAttempts,
          });

          // Test the changes
          const testResult = await tester.run({
            changes: coderResult.changes,
            issue,
            runSandbox: this.sandbox !== null,
          });

          session.testResults.push(testResult);

          if (testResult.passed) {
            session.changes.push(...coderResult.changes);
            stepSuccess = true;
            break;
          } else {
            previousError = testResult.issues.map(i => i.message).join('\n');
            previousAttempts.push(coderResult.approach || coderResult.explanation);
          }
        }

        if (!stepSuccess) {
          this.emitEvent('phase', { message: `Step ${step.id} has unresolved issues`, icon: 'fa-exclamation-triangle' });
        }
      }

      // Phase 3: Review
      this.emitEvent('phase', { message: 'Running final code review...', icon: 'fa-clipboard-check' });
      
      const reviewer = new ReviewerAgent(llm, this.sessionId);
      this.pipeAgentEvents(reviewer);

      const lastTestResult = session.testResults[session.testResults.length - 1];
      const reviewResult = await reviewer.run({
        issue,
        changes: session.changes,
        testResult: lastTestResult,
      });

      session.reviewResult = reviewResult;

      // Phase 4: Create PR
      this.emitEvent('phase', { message: 'Creating pull request...', icon: 'fa-code-branch' });
      
      try {
        const branchName = `devpilot/fix-issue-${issue.number}-${Date.now().toString(36)}`;
        await this.github.createBranch(jobData.repoOwner, jobData.repoName, branchName);

        for (const change of session.changes) {
          await this.github.commitFile(
            jobData.repoOwner,
            jobData.repoName,
            branchName,
            change.file,
            change.newCode,
            `fix: ${issue.title} (${change.file})`
          );
        }

        const prBody = this.generatePRBody(issue, plan, session.changes, reviewResult);
        const pr = await this.github.createPR(jobData.repoOwner, jobData.repoName, {
          title: `Fix #${issue.number}: ${issue.title}`,
          head: branchName,
          base: 'main',
          body: prBody,
        });

        session.pr = pr;
        this.emitEvent('pr_created', { url: pr.html_url, number: pr.number });
      } catch (error: any) {
        this.logger.error(`PR creation failed: ${error.message}`);
        this.emitEvent('phase', { message: `PR creation failed: ${error.message}`, icon: 'fa-times' });
      }

      session.status = 'completed';
      this.emitEvent('phase', { message: 'Solve completed successfully!', icon: 'fa-check-circle' });
      
      getMetrics().incrementCounter('solve.completed');

    } catch (error: any) {
      session.status = 'failed';
      session.error = error.message;
      console.error(`Solve failed:`, error.message);
      this.emitEvent('phase', { message: `Solve failed: ${error.message}`, icon: 'fa-times-circle' });
      getMetrics().incrementCounter('solve.failed');
    } finally {
      session.completedAt = Date.now();
      this.metrics.totalDuration = session.completedAt - startTime;
      tracer.endSpan(rootSpanId, { status: session.status });
    }

    return session;
  }

  private pipeAgentEvents(agent: any): void {
    agent.on('event', (event: AgentEvent) => {
      this.events.push(event);
      this.emit('event', event);
    });
  }

  private generatePRBody(
    issue: any,
    plan: ImplementationPlan,
    changes: CodeChange[],
    review: any
  ): string {
    let body = `## Fixes #${issue.number}: ${issue.title}\n\n`;
    body += `### Summary\n${plan.summary}\n\n`;
    body += `### Implementation\n`;
    plan.steps.forEach(s => {
      body += `- [x] ${s.description}\n`;
    });
    body += `\n### Files Changed\n`;
    changes.forEach(c => {
      body += `- \`${c.file}\` (${c.action})\n`;
    });
    body += `\n### Code Review\n${review.summary}\n`;
    if (review.feedback?.length) {
      body += `\n#### Feedback\n`;
      review.feedback.forEach((f: any) => {
        body += `- **${f.category}**: ${f.comment}\n`;
      });
    }
    body += `\n---\n*Automated by **DevPilot AI** — Multi-agent autonomous engineering*\n`;
    return body;
  }
}