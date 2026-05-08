import { DocumentChunk } from '../../services/vector/chromadb.service.js';

interface ChunkOptions {
  maxChunkSize: number;
  overlapSize: number;
  minChunkSize: number;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChunkSize: 1500,
  overlapSize: 200,
  minChunkSize: 100,
};

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.rb', '.php',
  '.cpp', '.c', '.h', '.cs', '.swift', '.kt', '.scala', '.r', '.lua', '.pl',
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
]);

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /__pycache__/,
  /\.venv/,
  /vendor/,
  /\.min\./,
  /\.map$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.gif$/,
];

export function shouldIndexFile(path: string): boolean {
  if (IGNORE_PATTERNS.some(p => p.test(path))) return false;
  return CODE_EXTENSIONS.has(getExtension(path)) || path.endsWith('.md') || path.endsWith('.json') || path.endsWith('.yaml') || path.endsWith('.yml');
}

function getExtension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx).toLowerCase() : '';
}

function getLanguage(path: string): string {
  const ext = getExtension(path);
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.py': 'python', '.java': 'java', '.go': 'go',
    '.rs': 'rust', '.rb': 'ruby', '.php': 'php',
    '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp',
    '.swift': 'swift', '.kt': 'kotlin',
  };
  return map[ext] || 'text';
}

function getDocType(path: string): 'code' | 'doc' | 'config' {
  if (path.endsWith('.md')) return 'doc';
  if (path.endsWith('.json') || path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.toml')) return 'config';
  return 'code';
}

export function chunkCode(content: string, path: string, options: Partial<ChunkOptions> = {}): DocumentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: DocumentChunk[] = [];
  const lines = content.split('\n');
  const repoPath = path; // Will be updated by caller

  if (lines.length <= 20 || content.length <= opts.minChunkSize) {
    chunks.push({
      id: `${repoPath}:0`,
      text: content,
      metadata: {
        path: repoPath,
        repoOwner: '', repoName: '',
        startLine: 0,
        endLine: lines.length,
        type: getDocType(path),
        language: getLanguage(path),
      },
    });
    return chunks;
  }

  // Try to split on logical boundaries (functions, classes, etc.)
  const logicalBlocks = splitOnLogicalBoundaries(content, lines);
  
  let currentChunk = '';
  let startLine = 0;
  let chunkIndex = 0;

  for (const block of logicalBlocks) {
    if (currentChunk.length + block.content.length > opts.maxChunkSize && currentChunk.length >= opts.minChunkSize) {
      chunks.push({
        id: `${repoPath}:${chunkIndex}`,
        text: currentChunk.trim(),
        metadata: {
          path: repoPath,
          repoOwner: '', repoName: '',
          startLine,
          endLine: block.startLine - 1,
          type: getDocType(path),
          language: getLanguage(path),
        },
      });
      chunkIndex++;
      
      // Add overlap
      const overlapLines = currentChunk.split('\n').slice(-Math.floor(opts.overlapSize / 20));
      currentChunk = overlapLines.join('\n') + '\n';
      startLine = block.startLine - overlapLines.length;
    }
    
    if (!currentChunk) {
      startLine = block.startLine;
    }
    currentChunk += block.content + '\n';
  }

  // Add remaining chunk
  if (currentChunk.trim().length >= opts.minChunkSize) {
    chunks.push({
      id: `${repoPath}:${chunkIndex}`,
      text: currentChunk.trim(),
      metadata: {
        path: repoPath,
        repoOwner: '', repoName: '',
        startLine,
        endLine: lines.length,
        type: getDocType(path),
        language: getLanguage(path),
      },
    });
  }

  return chunks;
}

interface LogicalBlock {
  content: string;
  startLine: number;
}

function splitOnLogicalBoundaries(content: string, lines: string[]): LogicalBlock[] {
  const blocks: LogicalBlock[] = [];
  let currentBlock = '';
  let startLine = 0;
  
  const boundaryPatterns = [
    /^(export\s+(default\s+)?(?:function|class|const|interface|type|enum))/m,
    /^(function\s+\w+)/m,
    /^(class\s+\w+)/m,
    /^(async\s+function\s+\w+)/m,
    /^(const\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^(])\s*=>)/m,
    /^(def\s+\w+)/m,
    /^(class\s+\w+.*:)/m,
    /^(func\s+\w+)/m,
    /^(pub\s+(async\s+)?fn\s+\w+)/m,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBoundary = boundaryPatterns.some(p => p.test(line));

    if (isBoundary && currentBlock.trim()) {
      blocks.push({ content: currentBlock, startLine });
      currentBlock = '';
      startLine = i;
    }
    
    if (!currentBlock) {
      startLine = i;
    }
    currentBlock += line + '\n';
  }

  if (currentBlock.trim()) {
    blocks.push({ content: currentBlock, startLine });
  }

  return blocks.length > 0 ? blocks : [{ content, startLine: 0 }];
}

export function createDocumentChunks(
  repoOwner: string,
  repoName: string,
  files: Array<{ path: string; content: string }>
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];

  for (const file of files) {
    if (!shouldIndexFile(file.path)) continue;

    const chunks = chunkCode(file.content, file.path);
    
    for (const chunk of chunks) {
      chunk.metadata.repoOwner = repoOwner;
      chunk.metadata.repoName = repoName;
      chunk.id = `${repoOwner}_${repoName}_${chunk.id}`.replace(/[^a-z0-9_:]/gi, '_');
      allChunks.push(chunk);
    }
  }

  return allChunks;
}