import { LLMProvider } from '../../services/llm/provider.interface.js';
import { DocumentChunk } from '../../services/vector/chromadb.service.js';
import { createDocumentChunks, shouldIndexFile } from './chunker.js';

export class Embedder {
  private llm: LLMProvider;
  private batchSize = 50;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const result = await this.llm.embed(batch);
      embeddings.push(...result.embeddings);
    }

    return embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    const result = await this.llm.embed([query]);
    return result.embeddings[0];
  }

  async prepareAndEmbedFiles(
    repoOwner: string,
    repoName: string,
    files: Array<{ path: string; content: string }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<DocumentChunk[]> {
    const chunks = createDocumentChunks(repoOwner, repoName, files);
    
    if (chunks.length === 0) return [];

    const texts = chunks.map(c => c.text);
    const embeddings = await this.embedTexts(texts);

    chunks.forEach((chunk, idx) => {
      chunk.embedding = embeddings[idx];
      onProgress?.(idx + 1, chunks.length);
    });

    return chunks;
  }

  getEmbeddingDimensions(): number {
    // Most models use 1536 or 768 dimensions
    return 1536;
  }
}