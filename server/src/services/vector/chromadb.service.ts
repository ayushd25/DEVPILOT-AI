import { ChromaClient } from 'chromadb';

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    path: string;
    repoOwner: string;
    repoName: string;
    startLine?: number;
    endLine?: number;
    type: 'code' | 'doc' | 'config';
    language?: string;
  };
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: DocumentChunk['metadata'];
  score: number;
}

export class ChromaDBService {
  private client: ChromaClient;
  private collections: Map<string, Collection> = new Map();

  constructor(url: string) {
    this.client = new ChromaClient({ url });
  }

  private getCollectionName(repoOwner: string, repoName: string): string {
    return `${repoOwner}_${repoName}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  }

  async getOrCreateCollection(repoOwner: string, repoName: string): Promise<Collection> {
    const name = this.getCollectionName(repoOwner, repoName);
    
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    try {
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: { hnsw: { space: 'cosine' } },
      });
      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      throw new Error(`Failed to get/create collection: ${error}`);
    }
  }

  async addDocuments(repoOwner: string, repoName: string, chunks: DocumentChunk[]): Promise<void> {
    const collection = await this.getOrCreateCollection(repoOwner, repoName);

    const batch_size = 100;
    for (let i = 0; i < chunks.length; i += batch_size) {
      const batch = chunks.slice(i, i + batch_size);
      await collection.upsert({
        ids: batch.map(c => c.id),
        documents: batch.map(c => c.text),
        metadatas: batch.map(c => c.metadata as any),
      });
    }
  }

  async search(
    repoOwner: string,
    repoName: string,
    query: string,
    queryEmbedding: number[],
    options: { nResults?: number; where?: any } = {}
  ): Promise<SearchResult[]> {
    const collection = await this.getOrCreateCollection(repoOwner, repoName);
    const { nResults = 10, where } = options;

    const whereFilter = where
      ? { ...where, repoOwner, repoName }
      : { repoOwner, repoName };

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
      where: whereFilter,
      include: ['documents', 'metadatas', 'distances'],
    });

    if (!results.ids?.[0]?.length) return [];

    return results.ids[0].map((id, idx) => ({
      id,
      text: results.documents?.[0]?.[idx] || '',
      metadata: results.metadatas?.[0]?.[idx] as DocumentChunk['metadata'],
      score: 1 - (results.distances?.[0]?.[idx] || 1),
    }));
  }

  async getCollectionStats(repoOwner: string, repoName: string): Promise<{ count: number }> {
    const collection = await this.getOrCreateCollection(repoOwner, repoName);
    const count = await collection.count();
    return { count };
  }

  async deleteCollection(repoOwner: string, repoName: string): Promise<void> {
    const name = this.getCollectionName(repoOwner, repoName);
    try {
      await this.client.deleteCollection({ name });
      this.collections.delete(name);
    } catch {
      // Collection might not exist
    }
  }
}