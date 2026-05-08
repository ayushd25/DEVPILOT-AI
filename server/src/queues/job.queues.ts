import { Queue, Worker, Job, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';
import { SolveJobData, EmbedJobData } from '../types/job.types.js';

let redisConnection: Redis;

export function getRedisConnection(url: string): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return redisConnection;
}

export function createSolveQueue(redisUrl: string): Queue {
  const connection = getRedisConnection(redisUrl);
  return new Queue('solve', { connection });
}

export function createEmbedQueue(redisUrl: string): Queue {
  const connection = getRedisConnection(redisUrl);
  return new Queue('embed', { connection });
}

export async function addSolveJob(queue: Queue, data: SolveJobData): Promise<string> {
  const job = await queue.add('solve', data, {
    attempts: 1,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
  return job.id || '';
}

export async function addEmbedJob(queue: Queue, data: EmbedJobData): Promise<string> {
  const job = await queue.add('embed', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  return job.id || '';
}