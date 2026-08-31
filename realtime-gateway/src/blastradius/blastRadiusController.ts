import { Request, Response } from 'express';
import { BlastRadiusEngine } from './blastRadiusEngine';

const blastEngine = new BlastRadiusEngine();

export async function handleCalculateBlastRadius(req: Request, res: Response): Promise<void> {
  try {
    const serviceId = (req.params.serviceId || req.query.serviceId) as string;
    if (!serviceId || typeof serviceId !== 'string') {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }
    const result = blastEngine.calculateBlastRadius(serviceId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
