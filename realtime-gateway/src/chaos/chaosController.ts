import { Request, Response } from 'express';
import { chaosEngine } from './chaosEngine';

export async function handleInjectFault(req: Request, res: Response): Promise<void> {
  try {
    const { serviceId, faultType, latencyMs, httpStatusCode, errorRatePercentage, ttlSeconds } = req.body;
    if (!serviceId || !faultType) {
      res.status(400).json({ error: 'serviceId and faultType are required' });
      return;
    }

    const experiment = await chaosEngine.injectFault({
      serviceId,
      faultType,
      latencyMs: latencyMs ? parseInt(latencyMs, 10) : undefined,
      httpStatusCode: httpStatusCode ? parseInt(httpStatusCode, 10) : undefined,
      errorRatePercentage: errorRatePercentage ? parseInt(errorRatePercentage, 10) : undefined,
      ttlSeconds: ttlSeconds ? parseInt(ttlSeconds, 10) : undefined,
    });

    res.status(201).json(experiment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetActiveChaos(req: Request, res: Response): Promise<void> {
  try {
    const experiments = await chaosEngine.getActiveChaosExperiments();
    res.json({ activeExperiments: experiments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleRevertChaos(req: Request, res: Response): Promise<void> {
  try {
    const serviceId = req.params.serviceId || req.body.serviceId;
    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }
    const result = await chaosEngine.revertChaos(serviceId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
