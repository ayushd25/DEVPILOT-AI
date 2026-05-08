import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../job.queues.js';
import { SolveJobData } from '../../types/job.types.js';
import { ManagerAgent } from '../../agents/manager.agent.js';
import { LLMFactory } from '../../services/llm/llm.factory.js';
import { ChromaDBService } from '../../services/vector/chromadb.service.js';
import { GitHubService } from '../../services/github/github.service.js';
import { DockerExecutor } from '../../services/sandbox/docker.executor.js';
import { logger } from '../../observability/logger.js';

interface WorkerContext {
  llmFactory: LLMFactory;
  chroma: ChromaDBService;
  sandbox: DockerExecutor;
  redisUrl: string;
  onEvent: (sessionId: string, event: any) => void;
}

export function createSolveWorker(redisUrl: string, context: WorkerContext): Worker {
  const connection = getRedisConnection(redisUrl);

  return new Worker(
    'solve',
    async (job: Job<SolveJobData>) => {
      const { sessionId, issueNumber, repoOwner, repoName, issueTitle, issueBody, issueLabels } = job.data;

      logger.info(`Starting solve job ${job.id} for session ${sessionId}`);

      const github = new GitHubService(context.llmFactory.getDefaultProvider()['apiKey'] || '');
      
      const manager = new ManagerAgent({
        sessionId,
        llmFactory: context.llmFactory,
        chroma: context.chroma,
        github,
        sandbox: context.sandbox,
        redisUrl,
      });

      manager.on('event', (event) => {
        context.onEvent(sessionId, event);
      });

      try {
        const result = await manager.run({
          issueNumber,
          repoOwner,
          repoName,
          issueTitle,
          issueBody,
          issueLabels,
        });
        return result;
      } catch (error) {
        logger.error(`Solve job failed: ${error}`);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1,
    }
  );
}