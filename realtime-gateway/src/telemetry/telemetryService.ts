import { TraceModel, ITrace } from './models/Trace';
import { ISpan } from './models/Span';
import { ServiceLogModel, IServiceLog } from './models/ServiceLog';
import { SnapshotModel } from './models/Snapshot';
import { isDbConnected } from '../config/database';
import { broadcastTrace, broadcastMetrics, broadcastServiceHealth } from '../sockets/socketManager';
import { getRedis } from '../config/redis';

// In-memory ring buffer for low latency & offline fallback
const memoryTraces: any[] = [];
const memoryLogs: any[] = [];
const memorySnapshots: any[] = [];
const MAX_MEMORY_ITEMS = 500;

export interface IngestPayload {
  traces?: Array<{
    traceId: string;
    rootSpanId: string;
    rootServiceName: string;
    name: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    statusCode: 'OK' | 'ERROR' | 'UNSET';
    spans: ISpan[];
  }>;
  spans?: ISpan[];
  logs?: Array<{
    serviceId: string;
    traceId?: string;
    spanId?: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
}

export interface ServiceLiveMetric {
  serviceId: string;
  rps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  lastUpdated: number;
}

const serviceMetricsCache = new Map<string, ServiceLiveMetric>();

export async function ingestTelemetry(payload: IngestPayload): Promise<{ ingestedTraces: number; ingestedSpans: number; ingestedLogs: number }> {
  let traceCount = 0;
  let spanCount = 0;
  let logCount = 0;

  // Process Logs
  if (payload.logs && payload.logs.length > 0) {
    for (const l of payload.logs) {
      logCount++;
      const logEntry: any = {
        ...l,
        timestamp: l.timestamp || Date.now(),
        createdAt: new Date(),
      };

      memoryLogs.unshift(logEntry);
      if (memoryLogs.length > MAX_MEMORY_ITEMS) memoryLogs.pop();

      if (isDbConnected()) {
        (ServiceLogModel as any).create(logEntry).catch(() => {});
      }
    }
  }

  // Process Traces
  if (payload.traces && payload.traces.length > 0) {
    for (const t of payload.traces) {
      traceCount++;
      const services = Array.from(new Set(t.spans.map(s => s.serviceName)));
      const hasErrors = t.statusCode === 'ERROR' || t.spans.some(s => s.statusCode === 'ERROR');

      const traceDoc: any = {
        traceId: t.traceId,
        rootSpanId: t.rootSpanId || (t.spans[0] ? t.spans[0].spanId : 'span-root'),
        rootServiceName: t.rootServiceName || (t.spans[0] ? t.spans[0].serviceName : 'api-gateway'),
        name: t.name || 'Distributed Flow',
        startTime: t.startTime,
        endTime: t.endTime,
        durationMs: t.durationMs,
        statusCode: t.statusCode,
        hasErrors,
        servicesInvolved: services,
        spansCount: t.spans.length,
        spans: t.spans,
        createdAt: new Date(),
      };

      memoryTraces.unshift(traceDoc);
      if (memoryTraces.length > MAX_MEMORY_ITEMS) memoryTraces.pop();

      if (isDbConnected()) {
        (TraceModel as any).findOneAndUpdate({ traceId: t.traceId }, traceDoc, { upsert: true }).catch(() => {});
      }

      // Update metrics for services in this trace
      for (const span of t.spans) {
        spanCount++;
        updateServiceMetrics(span);
      }

      // Broadcast over WebSocket
      broadcastTrace(traceDoc);
    }
  }

  return { ingestedTraces: traceCount, ingestedSpans: spanCount, ingestedLogs: logCount };
}

function updateServiceMetrics(span: ISpan) {
  const current = serviceMetricsCache.get(span.serviceName) || {
    serviceId: span.serviceName,
    rps: 12,
    p50LatencyMs: span.durationMs,
    p95LatencyMs: Math.round(span.durationMs * 1.3),
    p99LatencyMs: Math.round(span.durationMs * 1.8),
    errorRatePercent: span.statusCode === 'ERROR' ? 5.0 : 0.0,
    status: 'HEALTHY',
    lastUpdated: Date.now(),
  };

  const isError = span.statusCode === 'ERROR';
  const alpha = 0.2;
  current.p50LatencyMs = Math.round(current.p50LatencyMs * (1 - alpha) + span.durationMs * alpha);
  current.p95LatencyMs = Math.round(Math.max(current.p50LatencyMs * 1.25, current.p95LatencyMs * (1 - alpha) + (span.durationMs * 1.4) * alpha));
  current.p99LatencyMs = Math.round(Math.max(current.p95LatencyMs * 1.3, current.p99LatencyMs * (1 - alpha) + (span.durationMs * 1.8) * alpha));
  
  const targetErr = isError ? 15.0 : 0.0;
  current.errorRatePercent = Math.round((current.errorRatePercent * 0.85 + targetErr * 0.15) * 10) / 10;

  // Determine health
  if (current.errorRatePercent >= 10 || current.p95LatencyMs > 600) {
    current.status = 'CRITICAL';
  } else if (current.errorRatePercent > 2 || current.p95LatencyMs > 250) {
    current.status = 'DEGRADED';
  } else {
    current.status = 'HEALTHY';
  }

  current.lastUpdated = Date.now();
  serviceMetricsCache.set(span.serviceName, current);
}

export function getLiveMetrics(): ServiceLiveMetric[] {
  return Array.from(serviceMetricsCache.values());
}

export async function getRecentTraces(limit = 50, filterService?: string): Promise<any[]> {
  if (isDbConnected()) {
    try {
      const query: any = {};
      if (filterService) {
        query.servicesInvolved = filterService;
      }
      const traces = await (TraceModel as any).find(query).sort({ startTime: -1 }).limit(limit).lean();
      if (traces && traces.length > 0) return traces;
    } catch {}
  }

  let filtered = memoryTraces;
  if (filterService) {
    filtered = filtered.filter(t => t.servicesInvolved?.includes(filterService));
  }
  return filtered.slice(0, limit);
}

export async function getTraceById(traceId: string): Promise<any | null> {
  if (isDbConnected()) {
    try {
      const trace = await (TraceModel as any).findOne({ traceId }).lean();
      if (trace) return trace;
    } catch {}
  }
  return memoryTraces.find(t => t.traceId === traceId) || null;
}

export async function getRecentLogs(limit = 100, serviceId?: string): Promise<any[]> {
  if (isDbConnected()) {
    try {
      const query: any = {};
      if (serviceId) query.serviceId = serviceId;
      const logs = await (ServiceLogModel as any).find(query).sort({ timestamp: -1 }).limit(limit).lean();
      if (logs && logs.length > 0) return logs;
    } catch {}
  }

  let filtered = memoryLogs;
  if (serviceId) {
    filtered = filtered.filter(l => l.serviceId === serviceId);
  }
  return filtered.slice(0, limit);
}

export async function createSnapshot(label?: string): Promise<any> {
  const metrics = getLiveMetrics();
  const servicesState: Record<string, any> = {};
  let totalRps = 0;
  let totalLatency = 0;

  for (const m of metrics) {
    servicesState[m.serviceId] = {
      status: m.status,
      rps: m.rps,
      p95LatencyMs: m.p95LatencyMs,
      errorRatePercent: m.errorRatePercent,
    };
    totalRps += m.rps;
    totalLatency += m.p95LatencyMs;
  }

  const snapshot = {
    timestamp: Date.now(),
    label: label || `Snapshot ${new Date().toLocaleTimeString()}`,
    servicesState,
    activeIncidentsCount: metrics.filter(m => m.status === 'CRITICAL').length,
    activeChaosExperiments: [],
    totalThroughputRps: totalRps || 120,
    avgSystemLatencyMs: metrics.length ? Math.round(totalLatency / metrics.length) : 75,
    createdAt: new Date(),
  };

  memorySnapshots.unshift(snapshot);
  if (memorySnapshots.length > 50) memorySnapshots.pop();

  if (isDbConnected()) {
    (SnapshotModel as any).create(snapshot).catch(() => {});
  }

  return snapshot;
}

export async function getSnapshots(limit = 20): Promise<any[]> {
  if (isDbConnected()) {
    try {
      const snaps = await (SnapshotModel as any).find().sort({ timestamp: -1 }).limit(limit).lean();
      if (snaps && snaps.length > 0) return snaps;
    } catch {}
  }
  return memorySnapshots.slice(0, limit);
}

// Initial pre-fill of default service metrics
const DEFAULT_SERVICES = [
  'api-gateway', 'auth-service', 'order-service', 'payment-gateway',
  'inventory-service', 'notification-service', 'analytics-worker', 'database-cluster'
];
for (const s of DEFAULT_SERVICES) {
  serviceMetricsCache.set(s, {
    serviceId: s,
    rps: s === 'api-gateway' ? 145 : (s === 'payment-gateway' ? 38 : 62),
    p50LatencyMs: s === 'payment-gateway' ? 185 : (s === 'api-gateway' ? 45 : 30),
    p95LatencyMs: s === 'payment-gateway' ? 310 : (s === 'api-gateway' ? 85 : 55),
    p99LatencyMs: s === 'payment-gateway' ? 490 : (s === 'api-gateway' ? 130 : 95),
    errorRatePercent: s === 'payment-gateway' ? 1.2 : 0.0,
    status: 'HEALTHY',
    lastUpdated: Date.now(),
  });
}
