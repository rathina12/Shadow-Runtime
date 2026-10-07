import { Request, Response } from 'express';
import { GeminiOrchestrator } from './geminiOrchestrator';
import { getLlmTelemetrySnapshot, recordLlmCall } from './llmTelemetry';

const orchestrator = new GeminiOrchestrator();

export async function handleDiagnose(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, incidentTitle } = req.body;
    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }
    const startedAt = Date.now();
    const result = await orchestrator.diagnoseServiceIncident(serviceId, incidentTitle);
    recordLlmCall({
      operation: 'diagnoseServiceIncident',
      model: result.aiModelUsed,
      latencyMs: Date.now() - startedAt,
      outcome: result.cached ? 'cache_hit' : (result.aiModelUsed.includes('deterministic') ? 'fallback' : 'success'),
      promptChars: JSON.stringify({ serviceId, incidentTitle }).length,
      responseChars: JSON.stringify(result).length,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleNlQuery(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query text is required' });
      return;
    }
    const startedAt = Date.now();
    const result = await orchestrator.translateAndExecuteNlQuery(query);
    recordLlmCall({
      operation: 'translateAndExecuteNlQuery',
      model: 'gemini-or-deterministic',
      latencyMs: Date.now() - startedAt,
      outcome: 'success',
      promptChars: query.length,
      responseChars: JSON.stringify(result).length,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleDraftRunbook(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, issue } = req.body;
    const startedAt = Date.now();
    const result = await orchestrator.draftRunbook(serviceId || 'core-service', issue || 'High latency');
    recordLlmCall({
      operation: 'draftRunbook',
      model: result.source || 'unknown',
      latencyMs: Date.now() - startedAt,
      outcome: result.source === 'shadow-runtime-ai-engine' ? 'fallback' : 'success',
      promptChars: JSON.stringify({ serviceId, issue }).length,
      responseChars: JSON.stringify(result).length,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


export async function handleLlmMetrics(_req: Request, res: Response): Promise<void> {
  res.json(getLlmTelemetrySnapshot());
}
