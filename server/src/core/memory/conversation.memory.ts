import { LLMMessage } from '../../services/llm/provider.interface.js';
import Redis from 'ioredis';

export class ConversationMemory {
  private redis: Redis;
  private ttl = 86400; // 24 hours

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  private getKey(sessionId: string): string {
    return `memory:conversation:${sessionId}`;
  }

  async addMessage(sessionId: string, message: LLMMessage): Promise<void> {
    const key = this.getKey(sessionId);
    const entry = JSON.stringify({ ...message, timestamp: Date.now() });
    await this.redis.rpush(key, entry);
    await this.redis.expire(key, this.ttl);
  }

  async getMessages(sessionId: string, options: { lastN?: number; roles?: string[] } = {}): Promise<LLMMessage[]> {
    const key = this.getKey(sessionId);
    let messages = await this.redis.lrange(key, 0, -1);
    
    let parsed = messages.map(m => JSON.parse(m));

    if (options.roles) {
      parsed = parsed.filter((m: any) => options.roles!.includes(m.role));
    }

    if (options.lastN) {
      parsed = parsed.slice(-options.lastN);
    }

    return parsed.map(({ role, content }: any) => ({ role, content }));
  }

  async clear(sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(sessionId));
  }

  async getSize(sessionId: string): Promise<number> {
    return this.redis.llen(this.getKey(sessionId));
  }
}