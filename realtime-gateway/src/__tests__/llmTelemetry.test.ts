import {
  getLlmTelemetrySnapshot,
  recordLlmCall,
  resetLlmTelemetry,
} from '../ai/llmTelemetry';

describe('LLM telemetry', () => {
  beforeEach(() => resetLlmTelemetry());

  test('tracks outcomes and average latency', () => {
    recordLlmCall({
      operation: 'diagnosis',
      model: 'gemini-test',
      latencyMs: 100,
      outcome: 'success',
      promptChars: 400,
      responseChars: 200,
    });
    recordLlmCall({
      operation: 'diagnosis',
      model: 'local-fallback',
      latencyMs: 20,
      outcome: 'fallback',
      promptChars: 200,
      responseChars: 100,
    });

    const snapshot = getLlmTelemetrySnapshot();
    expect(snapshot.totalCalls).toBe(2);
    expect(snapshot.successCount).toBe(1);
    expect(snapshot.fallbackCount).toBe(1);
    expect(snapshot.averageLatencyMs).toBe(60);
    expect(snapshot.estimatedInputTokens).toBe(150);
  });

  test('calculates p95 latency', () => {
    [10, 20, 30, 40, 500].forEach(latencyMs =>
      recordLlmCall({
        operation: 'query',
        model: 'gemini-test',
        latencyMs,
        outcome: 'success',
        promptChars: 10,
        responseChars: 10,
      })
    );

    expect(getLlmTelemetrySnapshot().p95LatencyMs).toBe(500);
  });
});
