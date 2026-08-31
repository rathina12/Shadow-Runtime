import { Request, Response } from 'express';
import { PredictiveShadowEngine } from './predictiveShadowEngine';

const shadowEngine = new PredictiveShadowEngine();

export async function handleGetShadowProfiles(req: Request, res: Response): Promise<void> {
  try {
    const profiles = await shadowEngine.getShadowProfiles();
    res.json({ profiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleCompareShadow(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, actualLatencyMs, actualPath } = req.body;
    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }
    const comparison = await shadowEngine.compareExecutionWithShadow(
      serviceId,
      actualLatencyMs || 220,
      actualPath || []
    );
    res.json(comparison);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
