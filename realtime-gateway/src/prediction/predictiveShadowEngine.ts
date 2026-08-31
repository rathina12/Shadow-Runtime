import { getRecentTraces } from '../telemetry/telemetryService';

export interface ServiceShadowProfile {
  serviceId: string;
  expectedP50LatencyMs: number;
  expectedP95LatencyMs: number;
  expectedP99LatencyMs: number;
  slaUpperLimitMs: number;
  expectedThroughputRps: number;
  expectedDownstreamCalls: string[];
  expectedErrorRatePercent: number;
}

export interface ShadowExecutionComparison {
  serviceId: string;
  actualLatencyMs: number;
  predictedLatencyMs: number;
  deltaMs: number;
  deltaPercent: number;
  isAnomaly: boolean;
  actualStatus: string;
  predictedStatus: string;
  expectedPath: string[];
  actualPath: string[];
  divergenceDetected: boolean;
}

// Baseline knowledge priors
const STATIC_BASELINES: Record<string, ServiceShadowProfile> = {
  'api-gateway': {
    serviceId: 'api-gateway',
    expectedP50LatencyMs: 40,
    expectedP95LatencyMs: 85,
    expectedP99LatencyMs: 120,
    slaUpperLimitMs: 100,
    expectedThroughputRps: 150,
    expectedDownstreamCalls: ['auth-service', 'order-service'],
    expectedErrorRatePercent: 0.1,
  },
  'auth-service': {
    serviceId: 'auth-service',
    expectedP50LatencyMs: 25,
    expectedP95LatencyMs: 65,
    expectedP99LatencyMs: 90,
    slaUpperLimitMs: 80,
    expectedThroughputRps: 110,
    expectedDownstreamCalls: ['database-cluster'],
    expectedErrorRatePercent: 0.05,
  },
  'order-service': {
    serviceId: 'order-service',
    expectedP50LatencyMs: 65,
    expectedP95LatencyMs: 160,
    expectedP99LatencyMs: 230,
    slaUpperLimitMs: 250,
    expectedThroughputRps: 60,
    expectedDownstreamCalls: ['inventory-service', 'payment-gateway', 'notification-service'],
    expectedErrorRatePercent: 0.2,
  },
  'payment-gateway': {
    serviceId: 'payment-gateway',
    expectedP50LatencyMs: 180,
    expectedP95LatencyMs: 290,
    expectedP99LatencyMs: 340,
    slaUpperLimitMs: 350,
    expectedThroughputRps: 35,
    expectedDownstreamCalls: ['database-cluster'],
    expectedErrorRatePercent: 0.5,
  },
  'inventory-service': {
    serviceId: 'inventory-service',
    expectedP50LatencyMs: 35,
    expectedP95LatencyMs: 80,
    expectedP99LatencyMs: 120,
    slaUpperLimitMs: 150,
    expectedThroughputRps: 55,
    expectedDownstreamCalls: ['database-cluster'],
    expectedErrorRatePercent: 0.1,
  },
  'notification-service': {
    serviceId: 'notification-service',
    expectedP50LatencyMs: 20,
    expectedP95LatencyMs: 70,
    expectedP99LatencyMs: 110,
    slaUpperLimitMs: 500,
    expectedThroughputRps: 40,
    expectedDownstreamCalls: ['analytics-worker'],
    expectedErrorRatePercent: 0.1,
  },
  'analytics-worker': {
    serviceId: 'analytics-worker',
    expectedP50LatencyMs: 15,
    expectedP95LatencyMs: 45,
    expectedP99LatencyMs: 80,
    slaUpperLimitMs: 600,
    expectedThroughputRps: 45,
    expectedDownstreamCalls: [],
    expectedErrorRatePercent: 0.0,
  },
  'database-cluster': {
    serviceId: 'database-cluster',
    expectedP50LatencyMs: 12,
    expectedP95LatencyMs: 35,
    expectedP99LatencyMs: 48,
    slaUpperLimitMs: 50,
    expectedThroughputRps: 220,
    expectedDownstreamCalls: [],
    expectedErrorRatePercent: 0.0,
  },
};

export class PredictiveShadowEngine {
  async getShadowProfiles(): Promise<Record<string, ServiceShadowProfile>> {
    return STATIC_BASELINES;
  }

  async compareExecutionWithShadow(serviceId: string, actualLatencyMs: number, actualPath: string[] = []): Promise<ShadowExecutionComparison> {
    const baseline = STATIC_BASELINES[serviceId] || {
      serviceId,
      expectedP50LatencyMs: 50,
      expectedP95LatencyMs: 120,
      expectedP99LatencyMs: 200,
      slaUpperLimitMs: 250,
      expectedThroughputRps: 50,
      expectedDownstreamCalls: [],
      expectedErrorRatePercent: 0.1,
    };

    const deltaMs = actualLatencyMs - baseline.expectedP95LatencyMs;
    const deltaPercent = Math.round(((actualLatencyMs - baseline.expectedP95LatencyMs) / baseline.expectedP95LatencyMs) * 100);
    const isAnomaly = actualLatencyMs > baseline.slaUpperLimitMs || deltaPercent > 40;

    const divergenceDetected = actualPath.length > 0 && !this.pathsMatch(actualPath, baseline.expectedDownstreamCalls);

    return {
      serviceId,
      actualLatencyMs,
      predictedLatencyMs: baseline.expectedP95LatencyMs,
      deltaMs,
      deltaPercent,
      isAnomaly,
      actualStatus: isAnomaly ? 'DEGRADED' : 'HEALTHY',
      predictedStatus: 'HEALTHY (SHADOW BASELINE)',
      expectedPath: baseline.expectedDownstreamCalls,
      actualPath,
      divergenceDetected,
    };
  }

  private pathsMatch(actual: string[], expected: string[]): boolean {
    if (actual.length !== expected.length) return false;
    return actual.every((val, idx) => val === expected[idx]);
  }
}
