import { getRedis } from '../config/redis';
import { broadcastChaosEvent } from '../sockets/socketManager';

export interface ChaosExperiment {
  id: string;
  serviceId: string;
  faultType: 'LATENCY' | 'HTTP_ERROR' | 'PACKET_DROP' | 'CPU_SPIKE';
  latencyMs?: number;
  httpStatusCode?: number;
  errorRatePercentage?: number;
  ttlSeconds: number;
  startedAt: number;
  expiresAt: number;
  description: string;
}

export class ChaosEngine {
  private redis = getRedis();

  async injectFault(params: {
    serviceId: string;
    faultType: 'LATENCY' | 'HTTP_ERROR' | 'PACKET_DROP' | 'CPU_SPIKE';
    latencyMs?: number;
    httpStatusCode?: number;
    errorRatePercentage?: number;
    ttlSeconds?: number;
  }): Promise<ChaosExperiment> {
    const ttl = params.ttlSeconds || 45;
    const now = Date.now();
    const experiment: ChaosExperiment = {
      id: `chaos_${params.serviceId}_${now}`,
      serviceId: params.serviceId,
      faultType: params.faultType,
      latencyMs: params.latencyMs || 800,
      httpStatusCode: params.httpStatusCode || 500,
      errorRatePercentage: params.errorRatePercentage || 80,
      ttlSeconds: ttl,
      startedAt: now,
      expiresAt: now + ttl * 1000,
      description: `Injected ${params.faultType} on ${params.serviceId} (TTL: ${ttl}s)`,
    };

    const redisKey = `chaos:active:${params.serviceId}`;
    await this.redis.setex(redisKey, ttl, JSON.stringify(experiment));

    // Broadcast chaos injection start event
    broadcastChaosEvent({
      type: 'CHAOS_STARTED',
      experiment,
    });

    console.log(`🔥 Chaos experiment initiated on [${params.serviceId}]: ${experiment.description}`);
    return experiment;
  }

  async getActiveChaosExperiments(): Promise<ChaosExperiment[]> {
    const keys = await this.redis.keys('chaos:active:*');
    const experiments: ChaosExperiment[] = [];

    for (const key of keys) {
      const val = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          parsed.remainingTtlSeconds = Math.max(0, ttl);
          experiments.push(parsed);
        } catch {}
      }
    }

    return experiments;
  }

  async getActiveFaultForService(serviceId: string): Promise<ChaosExperiment | null> {
    const val = await this.redis.get(`chaos:active:${serviceId}`);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }

  async revertChaos(serviceId: string): Promise<{ reverted: boolean; serviceId: string }> {
    const key = `chaos:active:${serviceId}`;
    const deleted = await this.redis.del(key);

    broadcastChaosEvent({
      type: 'CHAOS_STOPPED',
      serviceId,
      timestamp: Date.now(),
    });

    console.log(`🛑 Chaos reverted for [${serviceId}]`);
    return { reverted: deleted > 0, serviceId };
  }
}

export const chaosEngine = new ChaosEngine();
