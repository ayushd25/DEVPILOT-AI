import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { nanoid } from 'nanoid';
import { LLMFactory } from './services/llm/llm.factory.js';
import { ChromaDBService } from './services/vector/chromadb.service.js';
import { GitHubService } from './services/github/github.service.js';
import { DockerExecutor } from './services/sandbox/docker.executor.js';
import { ManagerAgent } from './agents/manager.agent.js';
import { logger } from './observability/logger.js';
import { getMetrics } from './observability/metrics.js';

const PORT = parseInt(process.env.SERVER_PORT || '4000');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

const STATE_FILE = path.join(process.cwd(), 'state.json');

function loadSettings() {
  const defaults = {
    llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'groq',
    llmModel: process.env.DEFAULT_LLM_MODEL || 'llama-3.1-8b-instant',
    openrouterKey: process.env.OPENROUTER_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    groqKey: process.env.GROQ_API_KEY || '',
    githubToken: '',
    repoOwner: '',
    repoName: '',
    sandboxEnabled: false,
  };

  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return { ...defaults, ...saved, llmProvider: 'groq', llmModel: 'llama-3.1-8b-instant' };
    }
  } catch (e) { /* ignore errors */ }
  
  return defaults;
}

function saveSettings() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    // Cloud environments (Render) often have read-only filesystems.
    // Settings are kept in memory for the session instead.
  }
}

let settings = loadSettings();
const sessions = new Map<string, any>();

function getLLMFactory(): LLMFactory {
  console.log(`🔥 USING MODEL: ${settings.llmModel} via ${settings.llmProvider}`);
  return new LLMFactory({
    openrouterKey: settings.openrouterKey,
    geminiKey: settings.geminiKey,
    groqKey: settings.groqKey,
    defaultProvider: settings.llmProvider,
    defaultModel: settings.llmModel,
  });
}

function getGitHubService(): GitHubService {
  if (!settings.githubToken) throw new Error('GitHub token not configured');
  return new GitHubService(settings.githubToken);
}

async function initChroma(): Promise<ChromaDBService> {
  return new ChromaDBService(CHROMA_URL);
}

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: 'http://localhost:3000' },
  path: '/ws',
});

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);
  socket.on('join-session', (sessionId: string) => socket.join(`session:${sessionId}`));
  socket.on('disconnect', () => {});
});

function emitToSession(sessionId: string, event: any) {
  io.to(`session:${sessionId}`).emit('agent-event', event);
}

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.get('/api/settings', (req, res) => {
  res.json({
    llmProvider: settings.llmProvider,
    llmModel: settings.llmModel,
    repoOwner: settings.repoOwner,
    repoName: settings.repoName,
  });
});

app.post('/api/settings', (req, res) => {
  try {
    const body = req.body;
    if (body.githubToken) settings.githubToken = body.githubToken;
    if (body.repoOwner) settings.repoOwner = body.repoOwner;
    if (body.repoName) settings.repoName = body.repoName;
    saveSettings();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/test-connection', async (req, res) => {
  try {
    if (!settings.githubToken) {
      return res.json({ ok: false, error: 'Save a token first' });
    }
    const github = getGitHubService();
    const user = await github.getUser();
    res.json({ ok: true, user });
  } catch (e: any) {
    res.json({ ok: false, error: 'Invalid token or network error' });
  }
});

app.get('/api/issues', async (req, res) => {
  try {
    if (!settings.repoOwner || !settings.repoName) {
      return res.status(400).json({ error: 'Enter repo owner and name in Settings first' });
    }
    if (!settings.githubToken) {
      return res.status(400).json({ error: 'Enter GitHub token in Settings first' });
    }
    const github = getGitHubService();
    const issues = await github.getIssues(settings.repoOwner, settings.repoName);
    res.json(issues);
  } catch (e: any) {
    console.error('ISSUES ERROR:', e.message);
    res.status(500).json({ error: `GitHub API Error: ${e.message}` });
  }
});

app.post('/api/solve/:issueNumber', async (req, res) => {
  try {
    const issueNumber = parseInt(req.params.issueNumber);
    const github = getGitHubService();
    const chroma = await initChroma();
    const sandbox = new DockerExecutor(settings.sandboxEnabled);

    const issue = await github.getIssue(settings.repoOwner, settings.repoName, issueNumber);
    const sessionId = `solve_${Date.now()}_${nanoid(8)}`;

    sessions.set(sessionId, { id: sessionId, issueNumber, issueTitle: issue.title, status: 'running', events: [], createdAt: Date.now() });

    (async () => {
      const manager = new ManagerAgent({
        sessionId, llmFactory: getLLMFactory(), chroma, github, sandbox, redisUrl: REDIS_URL,
      });
      manager.on('event', (event: any) => {
        const session = sessions.get(sessionId);
        if (session) { session.events.push(event); emitToSession(sessionId, event); }
      });
      try {
        const result = await manager.run({
          issueNumber, repoOwner: settings.repoOwner, repoName: settings.repoName,
          issueTitle: issue.title, issueBody: issue.body, issueLabels: issue.labels.map((l: any) => l.name),
        });
        const session = sessions.get(sessionId);
        if (session) Object.assign(session, result);
      } catch (error: any) {
        const session = sessions.get(sessionId);
        if (session) { session.status = 'failed'; session.error = error.message; }
      }
    })();

    res.json({ sessionId, issueNumber });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

app.get('/api/sessions', (req, res) => {
  res.json([...sessions.values()].sort((a: any, b: any) => b.createdAt - a.createdAt));
});

httpServer.listen(PORT, () => {
  logger.info(`DevPilot API running -> http://localhost:${PORT}`);
});