'use client';

import React, { useState, useEffect } from 'react';
import { useChaosStore } from '../../store/chaosStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { Zap, ShieldAlert, Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

interface ChaosControlModalProps {
  initialServiceId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChaosControlModal: React.FC<ChaosControlModalProps> = ({
  initialServiceId,
  isOpen,
  onClose,
}) => {
  const { activeExperiments, isInjecting, fetchActiveExperiments, injectFault, revertChaos } = useChaosStore();
  const { services, setBlastRadiusFocus } = useTelemetryStore();

  const [serviceId, setServiceId] = useState(initialServiceId || 'payment-gateway');
  const [faultType, setFaultType] = useState<'LATENCY' | 'HTTP_ERROR' | 'PACKET_DROP'>('LATENCY');
  const [latencyMs, setLatencyMs] = useState(900);
  const [httpStatus, setHttpStatus] = useState(500);
  const [ttlSeconds, setTtlSeconds] = useState(45);

  useEffect(() => {
    if (initialServiceId) {
      setServiceId(initialServiceId);
    }
    if (isOpen) {
      fetchActiveExperiments();
    }
  }, [isOpen, initialServiceId, fetchActiveExperiments]);

  // Periodic poll active experiment countdowns
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      fetchActiveExperiments();
    }, 2000);
    return () => clearInterval(timer);
  }, [isOpen, fetchActiveExperiments]);

  if (!isOpen) return null;

  const handleExecuteChaos = async () => {
    await injectFault({
      serviceId,
      faultType,
      latencyMs: faultType === 'LATENCY' ? latencyMs : undefined,
      httpStatusCode: faultType === 'HTTP_ERROR' ? httpStatus : undefined,
      ttlSeconds,
    });
    // Auto-focus blast radius on injected service
    setBlastRadiusFocus(serviceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface-100 border border-cyber-red/40 shadow-2xl p-6 overflow-hidden">
        {/* Glow Top Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyber-amber via-cyber-red to-cyber-pink" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-red/20 text-cyber-red border border-cyber-red/40 glow-red">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red font-bold">
                  CHAOS ENGINE (REDIS TTL)
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Fault Injection & Chaos Engineering</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Active Chaos Banners */}
          {activeExperiments.length > 0 && (
            <div className="p-3.5 rounded-xl bg-cyber-red/10 border border-cyber-red/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-cyber-red font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  ACTIVE FAULT INJECTIONS ({activeExperiments.length}):
                </span>
              </div>
              {activeExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-white/5 text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-white">{exp.serviceId}</span>
                    <span className="text-gray-400 ml-2">[{exp.faultType}]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-cyber-amber flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      TTL: {exp.remainingTtlSeconds ?? exp.ttlSeconds}s
                    </span>
                    <button
                      onClick={() => revertChaos(exp.serviceId)}
                      className="px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30 text-[11px] font-bold"
                    >
                      Revert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Service Selection */}
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5 font-semibold">
                TARGET MICROSERVICE:
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-surface-50 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyber-red/60"
              >
                {Object.keys(services).map((sId) => (
                  <option key={sId} value={sId}>
                    {sId} ({services[sId]?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Fault Type Selection */}
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5 font-semibold">
                FAULT TYPE:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['LATENCY', 'HTTP_ERROR', 'PACKET_DROP'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFaultType(type)}
                    className={`py-2 px-1 text-[11px] font-mono font-medium rounded-lg border transition-all ${
                      faultType === type
                        ? 'bg-cyber-red/20 text-cyber-red border-cyber-red glow-red'
                        : 'bg-surface-50 text-gray-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {type === 'LATENCY' ? 'LATENCY' : type === 'HTTP_ERROR' ? 'HTTP 5XX' : 'DROP'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Configuration Sliders */}
          {faultType === 'LATENCY' && (
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-gray-300">INJECTED LATENCY OVERHEAD:</span>
                <span className="text-cyber-cyan font-bold">+{latencyMs}ms</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={latencyMs}
                onChange={(e) => setLatencyMs(parseInt(e.target.value, 10))}
                className="w-full accent-cyber-cyan cursor-pointer"
              />
            </div>
          )}

          {faultType === 'HTTP_ERROR' && (
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                HTTP ERROR STATUS CODE:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 502, 504].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setHttpStatus(status)}
                    className={`py-1.5 text-xs font-mono rounded-lg border ${
                      httpStatus === status
                        ? 'bg-cyber-red/20 text-cyber-red border-cyber-red'
                        : 'bg-surface-50 text-gray-400 border-white/5'
                    }`}
                  >
                    HTTP {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Redis TTL Expiry Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-gray-300">SESSION AUTO-EXPIRY TTL (REDIS):</span>
              <span className="text-cyber-amber font-bold">{ttlSeconds} Seconds</span>
            </div>
            <input
              type="range"
              min="10"
              max="180"
              step="5"
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(parseInt(e.target.value, 10))}
              className="w-full accent-cyber-amber cursor-pointer"
            />
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              Fault auto-reverts via Redis TTL countdown without leaving orphaned failure states.
            </p>
          </div>

          {/* Trigger Action */}
          <div className="pt-2">
            <button
              onClick={handleExecuteChaos}
              disabled={isInjecting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyber-red hover:bg-cyber-red/90 text-white font-bold text-sm font-mono transition-all shadow-lg glow-red"
            >
              <Zap className="w-4 h-4" />
              <span>{isInjecting ? 'Injecting Fault...' : `Trigger Chaos Injection on ${serviceId}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
