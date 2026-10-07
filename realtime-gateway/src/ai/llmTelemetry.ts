export type LlmOutcome = 'success' | 'fallback' | 'error' | 'cache_hit';

export interface LlmCallRecord {
  operation: string;
  model: string;
  latencyMs: number;
  outcome: LlmOutcome;
  promptChars: number;
  responseChars: number;
  recordedAt: string;
}

export interface LlmTelemetrySnapshot {
  totalCalls: number;
  successCount: number;
  fallbackCount: number;
  errorCount: number;
  cacheHitCount: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

const records: LlmCallRecord[] = [];
const MAX_RECORDS = 1000;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function recordLlmCall(record: Omit<LlmCallRecord, 'recordedAt'>): void {
  records.push({ ...record, recordedAt: new Date().toISOString() });
  if (records.length > MAX_RECORDS) records.shift();
}

export function getLlmTelemetrySnapshot(): LlmTelemetrySnapshot {
  const latencies = records.map(r => r.latencyMs);
  const sumLatency = latencies.reduce((a, b) => a + b, 0);
  const promptChars = records.reduce((sum, r) => sum + r.promptChars, 0);
  const responseChars = records.reduce((sum, r) => sum + r.responseChars, 0);

  return {
    totalCalls: records.length,
    successCount: records.filter(r => r.outcome === 'success').length,
    fallbackCount: records.filter(r => r.outcome === 'fallback').length,
    errorCount: records.filter(r => r.outcome === 'error').length,
    cacheHitCount: records.filter(r => r.outcome === 'cache_hit').length,
    averageLatencyMs: records.length ? Math.round(sumLatency / records.length) : 0,
    p95LatencyMs: percentile(latencies, 0.95),
    estimatedInputTokens: Math.ceil(promptChars / 4),
    estimatedOutputTokens: Math.ceil(responseChars / 4),
  };
}

export function resetLlmTelemetry(): void {
  records.length = 0;
}
