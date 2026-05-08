import Redis from 'ioredis';

export interface Episode {
  id: string;
  sessionId: string;
  agent: string;
  action: string;
  observation: string;
  result: 'success' | 'failure' | 'partial';
  metadata?: Record<string, any>;
  timestamp: number;
}

export class EpisodeMemory {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async record(episode: Omit<Episode, 'id' | 'timestamp'>): Promise<string> {
    const id = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullEpisode: Episode = { ...episode, id, timestamp: Date.now() };
    
    await this.redis.lpush(
      `memory:episodes:${episode.sessionId}`,
      JSON.stringify(fullEpisode)
    );
    
    // Also store in global episodes for cross-session learning
    await this.redis.lpush(
      `memory:episodes:global`,
      JSON.stringify({ ...fullEpisode, repoOwner: episode.metadata?.repoOwner, repoName: episode.metadata?.repoName })
    );

    return id;
  }

  async getSessionEpisodes(sessionId: string, options: { agent?: string; result?: string; limit?: number } = {}): Promise<Episode[]> {
    const key = `memory:episodes:${sessionId}`;
    let episodes = await this.redis.lrange(key, 0, -1);
    let parsed = episodes.map(e => JSON.parse(e));

    if (options.agent) {
      parsed = parsed.filter((e: Episode) => e.agent === options.agent);
    }
    if (options.result) {
      parsed = parsed.filter((e: Episode) => e.result === options.result);
    }
    if (options.limit) {
      parsed = parsed.slice(0, options.limit);
    }

    return parsed;
  }

  async getFailureEpisodes(sessionId: string, limit = 5): Promise<Episode[]> {
    return this.getSessionEpisodes(sessionId, { result: 'failure', limit });
  }

  async getSimilarEpisodes(repoOwner: string, repoName: string, action: string, limit = 3): Promise<Episode[]> {
    const allEpisodes = await this.redis.lrange('memory:episodes:global', 0, 100);
    const parsed = allEpisodes.map(e => JSON.parse(e));

    // Simple keyword matching for similar episodes
    const keywords = action.toLowerCase().split(/\s+/).slice(0, 10);
    const scored = parsed
      .filter((e: any) => e.repoOwner === repoOwner && e.repoName === repoName)
      .map((e: Episode) => ({
        episode: e,
        score: keywords.filter(k => e.action.toLowerCase().includes(k)).length,
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(s => s.episode);
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.redis.del(`memory:episodes:${sessionId}`);
  }
}