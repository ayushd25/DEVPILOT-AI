export interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  children: Span[];
}

export class Tracer {
  private rootSpans: Map<string, Span> = new Map();
  private activeSpans: Map<string, Span> = new Map();

  startSpan(name: string, parentId?: string, attributes: Record<string, any> = {}): string {
    const id = `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const span: Span = {
      id,
      name,
      startTime: Date.now(),
      attributes,
      children: [],
    };

    if (parentId) {
      const parent = this.activeSpans.get(parentId);
      if (parent) {
        parent.children.push(span);
      }
    } else {
      this.rootSpans.set(id, span);
    }

    this.activeSpans.set(id, span);
    return id;
  }

  endSpan(spanId: string, attributes: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.attributes = { ...span.attributes, ...attributes };
      this.activeSpans.delete(spanId);
    }
  }

  getTrace(rootSpanId: string): Span | undefined {
    return this.rootSpans.get(rootSpanId);
  }

  getTraceDuration(rootSpanId: string): number {
    const span = this.rootSpans.get(rootSpanId);
    if (!span?.endTime) return 0;
    return span.endTime - span.startTime;
  }

  formatTraceForDisplay(span: Span, indent = 0): string {
    const prefix = '  '.repeat(indent);
    const duration = span.endTime ? `${span.endTime - span.startTime}ms` : '...';
    let result = `${prefix}[${duration}] ${span.name}\n`;
    for (const child of span.children) {
      result += this.formatTraceForDisplay(child, indent + 1);
    }
    return result;
  }

  clearTrace(rootSpanId: string): void {
    this.rootSpans.delete(rootSpanId);
  }
}

let globalTracer: Tracer;

export function getTracer(): Tracer {
  if (!globalTracer) {
    globalTracer = new Tracer();
  }
  return globalTracer;
}