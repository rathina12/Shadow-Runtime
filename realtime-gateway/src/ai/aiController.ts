import { Request, Response } from 'express';
import { GeminiOrchestrator } from './geminiOrchestrator';

const orchestrator = new GeminiOrchestrator();

export async function handleDiagnose(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, incidentTitle } = req.body;
    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }
    const result = await orchestrator.diagnoseServiceIncident(serviceId, incidentTitle);
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
    const result = await orchestrator.translateAndExecuteNlQuery(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleDraftRunbook(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, issue } = req.body;
    const result = await orchestrator.draftRunbook(serviceId || 'core-service', issue || 'High latency');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
