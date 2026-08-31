import { Request, Response } from 'express';
import {
  ingestTelemetry,
  getRecentTraces,
  getTraceById,
  getRecentLogs,
  getLiveMetrics,
  createSnapshot,
  getSnapshots
} from './telemetryService';

export async function handleIngest(req: Request, res: Response): Promise<void> {
  try {
    const result = await ingestTelemetry(req.body);
    res.status(202).json({
      status: 'accepted',
      ...result,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleGetTraces(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const service = req.query.service as string | undefined;
    const traces = await getRecentTraces(limit, service);
    res.json({ total: traces.length, traces });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetTraceById(req: Request, res: Response): Promise<void> {
  try {
    const traceId = req.params.id as string;
    const trace = await getTraceById(traceId);
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }
    res.json(trace);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetLogs(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string || '100', 10);
    const service = req.query.service as string | undefined;
    const logs = await getRecentLogs(limit, service);
    res.json({ total: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export function handleGetLiveMetrics(req: Request, res: Response): void {
  res.json({ metrics: getLiveMetrics(), timestamp: Date.now() });
}

export async function handleCreateSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const label = req.body.label as string | undefined;
    const snapshot = await createSnapshot(label);
    res.status(201).json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetSnapshots(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string || '20', 10);
    const snapshots = await getSnapshots(limit);
    res.json({ snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
