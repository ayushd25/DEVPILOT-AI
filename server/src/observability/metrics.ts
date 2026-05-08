export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();

  incrementCounter(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + value);
  }

  recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  getHistogramStats(name: string): { min: number; max: number; avg: number; p50: number; p95: number; p99: number; count: number } {
    const values = this.histograms.get(name) || [];
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: sorted.length,
    };
  }

  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, value] of this.counters) {
      result[`counter.${name}`] = value;
    }

    for (const [name] of this.histograms) {
      result[`histogram.${name}`] = this.getHistogramStats(name);
    }

    for (const [name, value] of this.gauges) {
      result[`gauge.${name}`] = value;
    }

    return result;
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }
}

let globalMetrics: MetricsCollector;

export function getMetrics(): MetricsCollector {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector();
  }
  return globalMetrics;
}