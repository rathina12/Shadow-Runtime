import { create } from 'zustand';
import { gatewayApi } from '../lib/api';

export interface ActiveChaos {
  id: string;
  serviceId: string;
  faultType: 'LATENCY' | 'HTTP_ERROR' | 'PACKET_DROP' | 'CPU_SPIKE';
  latencyMs?: number;
  httpStatusCode?: number;
  ttlSeconds: number;
  startedAt: number;
  expiresAt: number;
  remainingTtlSeconds?: number;
}

interface ChaosState {
  activeExperiments: ActiveChaos[];
  isInjecting: boolean;
  fetchActiveExperiments: () => Promise<void>;
  injectFault: (params: {
    serviceId: string;
    faultType: 'LATENCY' | 'HTTP_ERROR' | 'PACKET_DROP' | 'CPU_SPIKE';
    latencyMs?: number;
    httpStatusCode?: number;
    ttlSeconds?: number;
  }) => Promise<void>;
  revertChaos: (serviceId: string) => Promise<void>;
}

export const useChaosStore = create<ChaosState>((set, get) => ({
  activeExperiments: [],
  isInjecting: false,

  fetchActiveExperiments: async () => {
    try {
      const res = await gatewayApi.get('/api/chaos/active');
      if (res.data && res.data.activeExperiments) {
        set({ activeExperiments: res.data.activeExperiments });
      }
    } catch {}
  },

  injectFault: async (params) => {
    set({ isInjecting: true });
    try {
      const res = await gatewayApi.post('/api/chaos/inject', params);
      await get().fetchActiveExperiments();
    } finally {
      set({ isInjecting: false });
    }
  },

  revertChaos: async (serviceId) => {
    try {
      await gatewayApi.post('/api/chaos/revert', { serviceId });
      await get().fetchActiveExperiments();
    } catch {}
  },
}));
