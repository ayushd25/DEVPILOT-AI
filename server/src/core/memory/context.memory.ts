import Redis from 'ioredis';

export interface ContextEntry {
  key: string;
  value: any;
  metadata?: Record<string, any>;
  expiresAt?: number;
}

export class ContextMemory {
  private redis: Redis;
  private ttl = 3600; // 1 hour

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  private getKey(sessionId: string, key: string): string {
    return `memory:context:${sessionId}:${key}`;
  }

  async set(sessionId: string, key: string, value: any, ttl?: number): Promise<void> {
    const redisKey = this.getKey(sessionId, key);
    await this.redis.set(redisKey, JSON.stringify(value), 'EX', ttl || this.ttl);
  }

  async get<T = any>(sessionId: string, key: string): Promise<T | null> {
    const data = await this.redis.get(this.getKey(sessionId, key));
    return data ? JSON.parse(data) : null;
  }

  async getAll(sessionId: string): Promise<ContextEntry[]> {
    const pattern = `memory:context:${sessionId}:*`;
    const keys = await this.redis.keys(pattern);
    
    const entries: ContextEntry[] = [];
    for (const key of keys) {
      const value = await this.redis.get(key);
      if (value) {
        const shortKey = key.replace(`memory:context:${sessionId}:`, '');
        entries.push({ key: shortKey, value: JSON.parse(value) });
      }
    }
    return entries;
  }

  async delete(sessionId: string, key: string): Promise<void> {
    await this.redis.del(this.getKey(sessionId, key));
  }

  async clear(sessionId: string): Promise<void> {
    const pattern = `memory:context:${sessionId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}