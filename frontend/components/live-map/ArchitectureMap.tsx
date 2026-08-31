'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomServiceNode } from './CustomServiceNode';
import { useTelemetryStore } from '../../store/telemetryStore';
import { Zap, ShieldAlert, Ghost, Radio, Sparkles } from 'lucide-react';

const nodeTypes: NodeTypes = {
  serviceNode: CustomServiceNode,
};

// Explicit high-polish hierarchical layout
const SERVICE_POSITIONS: Record<string, { x: number; y: number }> = {
  'api-gateway': { x: 380, y: 30 },
  'auth-service': { x: 120, y: 190 },
  'order-service': { x: 640, y: 190 },
  'inventory-service': { x: 420, y: 360 },
  'payment-gateway': { x: 700, y: 360 },
  'notification-service': { x: 960, y: 360 },
  'database-cluster': { x: 380, y: 540 },
  'analytics-worker': { x: 960, y: 540 },
};

export const ArchitectureMap: React.FC<{ onOpenAiDiagnosis: (serviceId: string) => void; onOpenChaos: (serviceId: string) => void }> = ({
  onOpenAiDiagnosis,
  onOpenChaos,
}) => {
  const {
    services,
    edges: rawEdges,
    selectedServiceId,
    setSelectedService,
    predictiveShadowMode,
    togglePredictiveShadowMode,
    blastRadiusMode,
    blastRadiusRootId,
    setBlastRadiusFocus,
    clearBlastRadius,
  } = useTelemetryStore();

  // Construct React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    return Object.entries(services).map(([id, serviceData]) => {
      const pos = SERVICE_POSITIONS[id] || { x: 400, y: 250 };
      return {
        id,
        type: 'serviceNode',
        position: pos,
        data: serviceData as any,
        selected: selectedServiceId === id,
      };
    });
  }, [services, selectedServiceId]);

  // Construct React Flow Edges with animated flows and blast radius colors
  const edges: Edge[] = useMemo(() => {
    return rawEdges.map((e) => {
      const sourceService = services[e.source];
      const targetService = services[e.target];

      const isTargetBlast = targetService?.isBlastImpacted;
      const isSourceBlast = sourceService?.isBlastImpacted;
      const isImpactedEdge = isTargetBlast || isSourceBlast;

      const hasCriticalFailure = sourceService?.status === 'CRITICAL' || targetService?.status === 'CRITICAL';

      let strokeColor = '#3b82f6';
      if (isImpactedEdge) strokeColor = '#ffb703';
      if (hasCriticalFailure) strokeColor = '#ff0055';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: {
          stroke: strokeColor,
          strokeWidth: isImpactedEdge ? 3 : 2,
          strokeDasharray: '6 4',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 16,
          height: 16,
        },
        label: `${e.protocol || 'HTTP'} (${e.avgLatencyMs}ms)`,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#0d1322', fillOpacity: 0.85 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };
    });
  }, [rawEdges, services]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedService(node.id);
  }, [setSelectedService]);

  const selectedServiceData = selectedServiceId ? services[selectedServiceId] : null;

  return (
    <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-white/10 bg-background shadow-2xl">
      {/* Top Floating Action Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* Predictive Shadow Mode Toggle Button */}
        <button
          onClick={togglePredictiveShadowMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border ${
            predictiveShadowMode
              ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan glow-cyan'
              : 'bg-surface-100/90 text-gray-300 border-white/10 hover:border-cyber-cyan/40'
          }`}
        >
          <Ghost className="w-4 h-4" />
          <span>PREDICTIVE SHADOW MODE: {predictiveShadowMode ? 'ACTIVE' : 'OFF'}</span>
        </button>

        {/* Blast Radius Reset / Indicator */}
        {blastRadiusMode && (
          <button
            onClick={clearBlastRadius}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyber-red/20 text-cyber-red border border-cyber-red/40 glow-red animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>EXIT BLAST RADIUS ({blastRadiusRootId})</span>
          </button>
        )}
      </div>

      {/* Main Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.6}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
      >
        <Background color="#1e2c4c" gap={20} size={1.5} />
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            if (data?.status === 'CRITICAL' || data?.isBlastRoot) return '#ff0055';
            if (data?.status === 'DEGRADED' || data?.isBlastImpacted) return '#ffb703';
            return '#00f0ff';
          }}
          className="!bg-surface-100 !border !border-white/10 !rounded-lg"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Side Detail Inspector Drawer */}
      {selectedServiceData && (
        <div className="absolute top-4 right-4 z-10 w-80 rounded-xl bg-surface-100/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl animate-in slide-in-from-right">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-mono text-cyber-cyan uppercase tracking-wider">{selectedServiceData.tier}</span>
              <h3 className="text-base font-bold text-white">{selectedServiceData.name}</h3>
              <p className="text-xs text-gray-400 font-mono">{selectedServiceData.id}</p>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-surface-200 rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Status:</span>
              <span className={selectedServiceData.status === 'HEALTHY' ? 'text-cyber-green' : 'text-cyber-red font-bold'}>
                {selectedServiceData.status}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">SLA Target:</span>
              <span className="text-white">&lt; {selectedServiceData.slaThresholdMs}ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Owner:</span>
              <span className="text-white">{selectedServiceData.ownerTeam}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">P99 Latency:</span>
              <span className="text-cyber-cyan">{selectedServiceData.p99LatencyMs || 250}ms</span>
            </div>
          </div>

          {/* Endpoints */}
          <div className="mb-4">
            <div className="text-[11px] text-gray-400 font-mono mb-1.5 uppercase">Registered Endpoints:</div>
            <div className="space-y-1">
              {selectedServiceData.endpoints?.map((ep, idx) => (
                <div key={idx} className="text-[11px] font-mono text-gray-300 bg-surface-50 px-2 py-1 rounded truncate border border-white/5">
                  {ep}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => onOpenAiDiagnosis(selectedServiceData.id)}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyber-purple to-cyber-blue text-white hover:opacity-90 shadow-lg glow-purple"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Root-Cause Diagnosis</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBlastRadiusFocus(selectedServiceData.id)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium bg-surface-200 text-cyber-amber hover:bg-surface-300 border border-cyber-amber/30"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Blast Radius</span>
              </button>

              <button
                onClick={() => onOpenChaos(selectedServiceData.id)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30 border border-cyber-red/30"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inject Chaos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
