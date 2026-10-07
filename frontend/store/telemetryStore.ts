import { create } from 'zustand';
import { gatewayApi, coreApi, getSocket } from '../lib/api';

export interface ServiceNodeData {
  id: string;
  name: string;
  tier: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  slaThresholdMs: number;
  ownerTeam: string;
  endpoints: string[];
  rps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  // Shadow Prediction Overlays
  shadowP95Ms?: number;
  shadowRps?: number;
  shadowErrorRate?: number;
  // Blast Radius Status
  isBlastImpacted?: boolean;
  blastHopDistance?: number;
  isBlastRoot?: boolean;
}

export interface TraceSummary {
  traceId: string;
  rootServiceName: string;
  name: string;
  durationMs: number;
  statusCode: string;
  hasErrors: boolean;
  servicesInvolved: string[];
  spansCount: number;
  startTime: number;
  spans?: any[];
}

interface TelemetryState {
  services: Record<string, ServiceNodeData>;
  edges: Array<{ id: string; source: string; target: string; protocol: string; avgLatencyMs: number }>;
  recentTraces: TraceSummary[];
  selectedServiceId: string | null;
  selectedTrace: any | null;
  predictiveShadowMode: boolean;
  blastRadiusMode: boolean;
  blastRadiusRootId: string | null;
  isLiveConnected: boolean;
  replayMode: boolean;
  replayTimeOffsetMinutes: number;
  historicalSnapshots: any[];

  // Actions
  fetchTopology: () => Promise<void>;
  fetchTraces: () => Promise<void>;
  setSelectedService: (id: string | null) => void;
  setSelectedTrace: (trace: any | null) => void;
  togglePredictiveShadowMode: () => void;
  setBlastRadiusFocus: (serviceId: string | null) => Promise<void>;
  clearBlastRadius: () => void;
  initSocketListeners: () => void;
  setReplayMode: (enabled: boolean, offsetMinutes?: number) => Promise<void>;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  services: {
    'api-gateway': {
      id: 'api-gateway',
      name: 'API Gateway & Edge Router',
      tier: 'TIER_1_CRITICAL',
      status: 'HEALTHY',
      slaThresholdMs: 100,
      ownerTeam: 'Edge Platform',
      endpoints: ['GET /api/v1/health', 'POST /api/v1/checkout', 'GET /api/v1/products'],
      rps: 145,
      p50LatencyMs: 40,
      p95LatencyMs: 85,
      p99LatencyMs: 120,
      errorRatePercent: 0.1,
      shadowP95Ms: 85,
      shadowRps: 150,
    },
    'auth-service': {
      id: 'auth-service',
      name: 'Authentication & Session Service',
      tier: 'TIER_1_CRITICAL',
      status: 'HEALTHY',
      slaThresholdMs: 80,
      ownerTeam: 'Security Team',
      endpoints: ['POST /oauth/token', 'POST /auth/verify'],
      rps: 110,
      p50LatencyMs: 25,
      p95LatencyMs: 65,
      p99LatencyMs: 90,
      errorRatePercent: 0.05,
      shadowP95Ms: 65,
      shadowRps: 110,
    },
    'order-service': {
      id: 'order-service',
      name: 'Order Processing Service',
      tier: 'TIER_1_CRITICAL',
      status: 'HEALTHY',
      slaThresholdMs: 250,
      ownerTeam: 'Core Commerce',
      endpoints: ['POST /orders', 'GET /orders/{id}'],
      rps: 65,
      p50LatencyMs: 65,
      p95LatencyMs: 160,
      p99LatencyMs: 230,
      errorRatePercent: 0.2,
      shadowP95Ms: 160,
      shadowRps: 60,
    },
    'payment-gateway': {
      id: 'payment-gateway',
      name: 'Payment Gateway Adapter',
      tier: 'TIER_1_CRITICAL',
      status: 'HEALTHY',
      slaThresholdMs: 350,
      ownerTeam: 'Payments Team',
      endpoints: ['POST /payments/charge', 'POST /payments/refund'],
      rps: 38,
      p50LatencyMs: 180,
      p95LatencyMs: 310,
      p99LatencyMs: 490,
      errorRatePercent: 0.8,
      shadowP95Ms: 290,
      shadowRps: 35,
    },
    'inventory-service': {
      id: 'inventory-service',
      name: 'Inventory & Stock Service',
      tier: 'TIER_2_CORE',
      status: 'HEALTHY',
      slaThresholdMs: 150,
      ownerTeam: 'Supply Chain',
      endpoints: ['POST /inventory/reserve', 'GET /inventory/{sku}'],
      rps: 55,
      p50LatencyMs: 35,
      p95LatencyMs: 80,
      p99LatencyMs: 120,
      errorRatePercent: 0.1,
      shadowP95Ms: 80,
      shadowRps: 55,
    },
    'notification-service': {
      id: 'notification-service',
      name: 'Notification Dispatch Worker',
      tier: 'TIER_3_AUX',
      status: 'HEALTHY',
      slaThresholdMs: 500,
      ownerTeam: 'Growth & Engagement',
      endpoints: ['POST /notify/email', 'POST /notify/sms'],
      rps: 40,
      p50LatencyMs: 20,
      p95LatencyMs: 70,
      p99LatencyMs: 110,
      errorRatePercent: 0.1,
      shadowP95Ms: 70,
      shadowRps: 40,
    },
    'analytics-worker': {
      id: 'analytics-worker',
      name: 'Real-time Analytics Worker',
      tier: 'TIER_3_AUX',
      status: 'HEALTHY',
      slaThresholdMs: 600,
      ownerTeam: 'Data Engineering',
      endpoints: ['POST /events/stream'],
      rps: 45,
      p50LatencyMs: 15,
      p95LatencyMs: 45,
      p99LatencyMs: 80,
      errorRatePercent: 0.0,
      shadowP95Ms: 45,
      shadowRps: 45,
    },
    'database-cluster': {
      id: 'database-cluster',
      name: 'Primary DB & Cache Tier',
      tier: 'TIER_1_CRITICAL',
      status: 'HEALTHY',
      slaThresholdMs: 50,
      ownerTeam: 'DB Reliability',
      endpoints: ['PostgreSQL 5432', 'Redis 6379'],
      rps: 220,
      p50LatencyMs: 12,
      p95LatencyMs: 35,
      p99LatencyMs: 48,
      errorRatePercent: 0.0,
      shadowP95Ms: 35,
      shadowRps: 220,
    },
  },
  edges: [
    { id: 'e1', source: 'api-gateway', target: 'auth-service', protocol: 'HTTP_REST', avgLatencyMs: 42 },
    { id: 'e2', source: 'api-gateway', target: 'order-service', protocol: 'HTTP_REST', avgLatencyMs: 65 },
    { id: 'e3', source: 'order-service', target: 'inventory-service', protocol: 'GRPC', avgLatencyMs: 38 },
    { id: 'e4', source: 'order-service', target: 'payment-gateway', protocol: 'HTTP_REST', avgLatencyMs: 185 },
    { id: 'e5', source: 'order-service', target: 'notification-service', protocol: 'ASYNC_KAFKA', avgLatencyMs: 15 },
    { id: 'e6', source: 'payment-gateway', target: 'database-cluster', protocol: 'POSTGRES_TCP', avgLatencyMs: 22 },
    { id: 'e7', source: 'inventory-service', target: 'database-cluster', protocol: 'POSTGRES_TCP', avgLatencyMs: 18 },
    { id: 'e8', source: 'auth-service', target: 'database-cluster', protocol: 'POSTGRES_TCP', avgLatencyMs: 16 },
    { id: 'e9', source: 'notification-service', target: 'analytics-worker', protocol: 'ASYNC_KAFKA', avgLatencyMs: 12 },
  ],
  recentTraces: [],
  selectedServiceId: null,
  selectedTrace: null,
  predictiveShadowMode: false,
  blastRadiusMode: false,
  blastRadiusRootId: null,
  isLiveConnected: false,
  replayMode: false,
  replayTimeOffsetMinutes: 0,
  historicalSnapshots: [],

  fetchTopology: async () => {
    try {
      const res = await coreApi.get('/api/v1/services/topology');
      if (res.data && res.data.services) {
        const currentServices = { ...get().services };
        for (const s of res.data.services) {
          if (currentServices[s.id]) {
            currentServices[s.id] = {
              ...currentServices[s.id],
              ...s,
            };
          }
        }
        set({ services: currentServices });
      }
    } catch (error) {
      console.error('Unable to refresh service topology:', error);
    }
  },

  fetchTraces: async () => {
    try {
      const res = await gatewayApi.get('/api/telemetry/traces?limit=30');
      if (res.data && res.data.traces) {
        set({ recentTraces: res.data.traces });
      }
    } catch (error) {
      console.error('Unable to refresh recent traces:', error);
    }
  },

  setSelectedService: (id) => set({ selectedServiceId: id }),
  setSelectedTrace: (trace) => set({ selectedTrace: trace }),

  togglePredictiveShadowMode: () => {
    set(state => ({ predictiveShadowMode: !state.predictiveShadowMode }));
  },

  setBlastRadiusFocus: async (serviceId) => {
    if (!serviceId) {
      get().clearBlastRadius();
      return;
    }

    try {
      const res = await gatewayApi.get(`/api/blast-radius/${serviceId}`);
      const data = res.data;

      const currentServices = { ...get().services };
      for (const key of Object.keys(currentServices)) {
        const isRoot = key === serviceId;
        const traversalItem = data.traversalOrder?.find((t: any) => t.serviceId === key);
        const isImpacted = isRoot || !!traversalItem;

        currentServices[key] = {
          ...currentServices[key],
          isBlastRoot: isRoot,
          isBlastImpacted: isImpacted,
          blastHopDistance: isRoot ? 0 : (traversalItem ? traversalItem.hopDistance : undefined),
        };
      }

      set({
        blastRadiusMode: true,
        blastRadiusRootId: serviceId,
        services: currentServices,
      });
    } catch {
      set({ blastRadiusMode: true, blastRadiusRootId: serviceId });
    }
  },

  clearBlastRadius: () => {
    const currentServices = { ...get().services };
    for (const key of Object.keys(currentServices)) {
      currentServices[key] = {
        ...currentServices[key],
        isBlastRoot: false,
        isBlastImpacted: false,
        blastHopDistance: undefined,
      };
    }
    set({
      blastRadiusMode: false,
      blastRadiusRootId: null,
      services: currentServices,
    });
  },

  initSocketListeners: () => {
    const socket = getSocket();
    // Prevent duplicate events when the dashboard remounts or React Strict Mode replays effects.
    socket.removeAllListeners('connect');
    socket.removeAllListeners('disconnect');
    socket.removeAllListeners('trace_event');
    set({ isLiveConnected: socket.connected });

    socket.on('connect', () => {
      set({ isLiveConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isLiveConnected: false });
    });

    socket.on('trace_event', (trace: any) => {
      set(state => {
        const updated = [trace, ...state.recentTraces.filter(t => t.traceId !== trace.traceId).slice(0, 39)];
        const services = { ...state.services };

        if (trace.spans && Array.isArray(trace.spans)) {
          for (const sp of trace.spans) {
            if (services[sp.serviceName]) {
              const current = services[sp.serviceName];
              const isError = sp.statusCode === 'ERROR';
              const alpha = 0.25;
              const newP50 = Math.round(current.p50LatencyMs * (1 - alpha) + sp.durationMs * alpha);
              const newP95 = Math.round(Math.max(newP50 * 1.3, current.p95LatencyMs * (1 - alpha) + sp.durationMs * 1.4 * alpha));
              const newErr = Math.round((current.errorRatePercent * 0.85 + (isError ? 18.0 : 0.0) * 0.15) * 10) / 10;

              let status = current.status;
              if (newErr >= 8.0 || newP95 > 500) {
                status = 'CRITICAL';
              } else if (newErr > 1.5 || newP95 > 220) {
                status = 'DEGRADED';
              } else {
                status = 'HEALTHY';
              }

              services[sp.serviceName] = {
                ...current,
                p50LatencyMs: newP50,
                p95LatencyMs: newP95,
                errorRatePercent: newErr,
                status: status as any,
              };
            }
          }
        }

        return { recentTraces: updated, services };
      });
    });
  },

  setReplayMode: async (enabled, offsetMinutes = 0) => {
    set({ replayMode: enabled, replayTimeOffsetMinutes: offsetMinutes });
    if (enabled) {
      try {
        const res = await gatewayApi.get('/api/telemetry/snapshots');
        if (res.data?.snapshots?.length > 0) {
          set({ historicalSnapshots: res.data.snapshots });
        }
      } catch {}
    }
  },
}));
