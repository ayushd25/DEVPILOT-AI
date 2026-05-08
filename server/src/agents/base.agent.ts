import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { AgentEvent, AgentName, AgentStatus } from '../types/agent.types.js';
import { LLMProvider } from '../services/llm/provider.interface.js';
import { createAgentLogger } from '../observability/logger.js';
import { getTracer } from '../observability/tracer.js';
import { getMetrics } from '../observability/metrics.js';

export abstract class BaseAgent extends EventEmitter {
  protected name: AgentName;
  protected description: string;
  protected llm: LLMProvider;
  protected sessionId: string;
  protected logger: ReturnType<typeof createAgentLogger>;

  constructor(name: AgentName, description: string, llm: LLMProvider, sessionId: string) {
    super();
    this.name = name;
    this.description = description;
    this.llm = llm;
    this.sessionId = sessionId;
    this.logger = createAgentLogger(name, sessionId);
  }

  protected emitEvent(type: AgentEvent['type'], data: Record<string, any>): void {
    const event: AgentEvent = {
      id: nanoid(),
      type,
      agent: this.name,
      timestamp: Date.now(),
      data,
    };
    this.emit('event', event);
  }

  protected emitStatus(status: AgentStatus, detail?: string): void {
    this.emitEvent('status', { status, detail });
  }

    protected emitLog(level: 'info' | 'success' | 'error' | 'warning' | 'debug', message: string): void {
    this.emitEvent('log', { level, message });
    try {
      const fn = level === 'success' ? 'info' : level;
      if (fn === 'error') this.logger.error(message);
      else if (fn === 'warning') this.logger.warn(message);
      else if (fn === 'debug') this.logger.debug(message);
      else this.logger.info(message);
    } catch(e) {}
  }

  protected async withTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const tracer = getTracer();
    const spanId = tracer.startSpan(`${this.name}:${name}`, undefined, {
      agent: this.name,
      sessionId: this.sessionId,
    });

    const metrics = getMetrics();
    const start = Date.now();

    try {
      const result = await fn();
      tracer.endSpan(spanId, { success: true });
      metrics.recordHistogram(`agent.${this.name}.duration`, Date.now() - start);
      return result;
    } catch (error) {
      tracer.endSpan(spanId, { success: false, error: (error as Error).message });
      metrics.recordHistogram(`agent.${this.name}.duration`, Date.now() - start);
      metrics.incrementCounter(`agent.${this.name}.errors`);
      throw error;
    }
  }

  abstract run(input: any): Promise<any>;
}