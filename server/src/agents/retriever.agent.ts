import { BaseAgent } from './base.agent.js';
import { ChromaDBService } from '../services/vector/chromadb.service.js';
import { Embedder } from '../core/embeddings/embedder.js';
import { GitHubService } from '../services/github/github.service.js';

export class RetrieverAgent extends BaseAgent {
  private chroma: ChromaDBService;
  private github: GitHubService;

  constructor(llm: any, sessionId: string, chroma: ChromaDBService, github: GitHubService) {
    super('retriever', 'Retrieves relevant code using semantic search', llm, sessionId);
    this.chroma = chroma;
    this.github = github;
  }

  async run(input: {
    query: string;
    likelyFiles: string[];
    repoOwner: string;
    repoName: string;
  }): Promise<Array<{ path: string; content: string; score: number }>> {
    this.emitStatus('working', 'Searching codebase...');
    const { query, likelyFiles, repoOwner, repoName } = input;
    const results: Array<{ path: string; content: string; score: number }> = [];
    const seenPaths = new Set<string>();

    // 1. Fetch likely files directly (Always works)
    this.emitLog('info', `Fetching ${likelyFiles.length} likely files...`);
    try {
      const directFiles = await this.github.getFilesBatch(repoOwner, repoName, likelyFiles);
      for (const file of directFiles) {
        if (!seenPaths.has(file.path)) {
          results.push({ ...file, score: 1.0 });
          seenPaths.add(file.path);
          this.emitLog('debug', `  Found: ${file.path}`);
        }
      }
    } catch (e: any) {
      this.emitLog('warning', `Failed to fetch direct files: ${e.message}`);
    }

    // 2. Try Semantic Search via Embeddings & ChromaDB (Optional - fails gracefully)
    try {
      this.emitLog('info', 'Attempting semantic search...');
      const { Embedder } = await import('../core/embeddings/embedder.js');
      const embedder = new Embedder(this.llm);
      
      const queryEmbedding = await embedder.embedQuery(query);
      const semanticResults = await this.chroma.search(
        repoOwner, repoName, query, queryEmbedding, { nResults: 5 }
      );

      const pathsToFetch = semanticResults
        .filter(r => !seenPaths.has(r.metadata.path) && r.score > 0.4)
        .slice(0, 3)
        .map(r => r.metadata.path);

      if (pathsToFetch.length > 0) {
        this.emitLog('info', `Found ${pathsToFetch.length} semantic matches...`);
        const semanticFiles = await this.github.getFilesBatch(repoOwner, repoName, pathsToFetch);
        for (const file of semanticFiles) {
          if (!seenPaths.has(file.path)) {
            const match = semanticResults.find(r => r.metadata.path === file.path);
            results.push({ ...file, score: match?.score || 0.5 });
            seenPaths.add(file.path);
          }
        }
      }
    } catch (e: any) {
      this.emitLog('debug', `Semantic search skipped: ${e.message}`);
    }

    this.emitLog('success', `Retrieved ${results.length} code files`);
    this.emitStatus('done');
    return results;
  }
}