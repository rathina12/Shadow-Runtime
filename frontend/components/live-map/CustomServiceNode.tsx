'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Activity, AlertTriangle, ShieldCheck, Zap, Ghost, Radio } from 'lucide-react';
import { ServiceNodeData, useTelemetryStore } from '../../store/telemetryStore';

interface CustomServiceNodeProps {
  data: ServiceNodeData;
  selected?: boolean;
}

export const CustomServiceNode = memo(({ data, selected }: CustomServiceNodeProps) => {
  const { predictiveShadowMode, blastRadiusMode, setBlastRadiusFocus } = useTelemetryStore();

  const isHealthy = data.status === 'HEALTHY';
  const isDegraded = data.status === 'DEGRADED';
  const isCritical = data.status === 'CRITICAL';

  // Blast radius highlight
  const isBlastRoot = data.isBlastRoot;
  const isBlastImpacted = data.isBlastImpacted;

  // Shadow comparison
  const shadowP95 = data.shadowP95Ms || data.slaThresholdMs * 0.7;
  const latencyDelta = data.p95LatencyMs - shadowP95;
  const latencyDeltaPercent = Math.round((latencyDelta / shadowP95) * 100);

  const getBorderColor = () => {
    if (isBlastRoot) return 'border-cyber-red ring-4 ring-cyber-red/40 animate-pulse';
    if (isBlastImpacted) return 'border-cyber-amber ring-2 ring-cyber-amber/30';
    if (isCritical) return 'border-cyber-red/80 glow-red';
    if (isDegraded) return 'border-cyber-amber/80 glow-amber';
    return selected ? 'border-cyber-cyan glow-cyan' : 'border-surface-300 hover:border-cyber-cyan/50';
  };

  const getStatusBadge = () => {
    if (isCritical || isBlastRoot) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-ping" />
          CRITICAL
        </span>
      );
    }
    if (isDegraded || isBlastImpacted) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-amber" />
          {isBlastImpacted ? `BLAST HOP ${data.blastHopDistance || 1}` : 'DEGRADED'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyber-green/15 text-cyber-green border border-cyber-green/30">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
        HEALTHY
      </span>
    );
  };

  return (
    <div
      className={`relative rounded-xl bg-surface-100/90 backdrop-blur-md p-4 min-w-[260px] max-w-[300px] border shadow-2xl transition-all duration-300 ${getBorderColor()}`}
    >
      {/* Top and Bottom Target/Source Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyber-cyan !w-3 !h-3 !border-2 !border-surface-100 !-top-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyber-purple !w-3 !h-3 !border-2 !border-surface-100 !-bottom-1.5"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-cyber-cyan">
              {data.id}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white truncate max-w-[160px]" title={data.name}>
            {data.name}
          </h4>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-surface-50/70 border border-white/5 text-center text-xs font-mono">
        <div>
          <div className="text-[10px] text-gray-400">THROUGHPUT</div>
          <div className="text-white font-bold">{data.rps || 45} <span className="text-[9px] font-normal text-gray-400">RPS</span></div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400">P95 LATENCY</div>
          <div className={`font-bold ${data.p95LatencyMs > data.slaThresholdMs ? 'text-cyber-red' : 'text-white'}`}>
            {data.p95LatencyMs || 45}ms
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400">ERROR RATE</div>
          <div className={`font-bold ${data.errorRatePercent > 1.0 ? 'text-cyber-red' : 'text-cyber-green'}`}>
            {data.errorRatePercent || 0}%
          </div>
        </div>
      </div>

      {/* Predictive Shadow Mode Overlay */}
      {predictiveShadowMode && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-cyber-cyan/30 flex items-center justify-between text-[11px] font-mono text-cyber-cyan bg-cyber-cyan/5 px-2 py-1 rounded">
          <div className="flex items-center gap-1">
            <Ghost className="w-3.5 h-3.5 animate-bounce" />
            <span>SHADOW EXP:</span>
          </div>
          <div className="font-semibold">
            {shadowP95}ms ({latencyDelta >= 0 ? `+${latencyDeltaPercent}%` : `${latencyDeltaPercent}%`})
          </div>
        </div>
      )}

      {/* Blast Radius Mode Tag */}
      {blastRadiusMode && isBlastImpacted && (
        <div className="mt-2 text-[10px] text-cyber-amber bg-cyber-amber/10 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
          <Radio className="w-3 h-3 animate-spin" />
          <span>Downstream blast cascade impact</span>
        </div>
      )}
    </div>
  );
});

CustomServiceNode.displayName = 'CustomServiceNode';
