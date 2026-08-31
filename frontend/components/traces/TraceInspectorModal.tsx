'use client';

import React, { useState } from 'react';
import { Network, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface TraceInspectorModalProps {
  trace: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TraceInspectorModal: React.FC<TraceInspectorModalProps> = ({ trace, isOpen, onClose }) => {
  const [selectedSpan, setSelectedSpan] = useState<any | null>(null);

  if (!isOpen || !trace) return null;

  const totalDuration = trace.durationMs || 100;
  const traceStartTime = trace.startTime || Date.now();
  const spans = trace.spans || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl bg-surface-100 border border-white/15 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyber-cyan font-bold">{trace.traceId}</span>
                <span className="text-xs font-mono text-gray-400">Total Duration: {totalDuration}ms</span>
              </div>
              <h2 className="text-base font-bold text-white">{trace.name || 'Distributed Trace Waterfall'}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Waterfall Gantt View */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="text-xs font-mono text-gray-400 uppercase font-semibold">Distributed Spans Waterfall:</div>
          
          <div className="space-y-2 font-mono text-xs">
            {spans.map((span: any, idx: number) => {
              const spanStartOffset = Math.max(0, (span.startTime - traceStartTime));
              const leftPercent = Math.min(90, (spanStartOffset / totalDuration) * 100);
              const widthPercent = Math.max(5, Math.min(100 - leftPercent, (span.durationMs / totalDuration) * 100));

              const isError = span.statusCode === 'ERROR';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSpan(span)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedSpan?.spanId === span.spanId
                      ? 'bg-surface-200 border-cyber-cyan'
                      : 'bg-surface-50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isError ? 'bg-cyber-red' : 'bg-cyber-green'}`} />
                      <span className="font-bold text-white">{span.serviceName}</span>
                      <span className="text-gray-400">[{span.name}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {span.httpStatusCode && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${isError ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-green/20 text-cyber-green'}`}>
                          HTTP {span.httpStatusCode}
                        </span>
                      )}
                      <span className="text-cyber-cyan font-bold">{span.durationMs}ms</span>
                    </div>
                  </div>

                  {/* Gantt Bar */}
                  <div className="w-full h-2 rounded-full bg-surface-300 relative overflow-hidden">
                    <div
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      className={`absolute top-0 bottom-0 rounded-full ${
                        isError ? 'bg-cyber-red shadow-[0_0_8px_#ff0055]' : 'bg-cyber-cyan shadow-[0_0_8px_#00f0ff]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Span Attribute Inspector */}
          {selectedSpan && (
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-2 mt-4">
              <div className="text-cyber-purple font-bold uppercase text-[10px]">Selected Span Metadata:</div>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div><span className="text-gray-500">Span ID:</span> {selectedSpan.spanId}</div>
                <div><span className="text-gray-500">Parent Span:</span> {selectedSpan.parentSpanId || 'ROOT'}</div>
                <div><span className="text-gray-500">Kind:</span> {selectedSpan.kind || 'SERVER'}</div>
                <div><span className="text-gray-500">Status:</span> {selectedSpan.statusCode}</div>
              </div>
              {selectedSpan.attributes && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-gray-500 mb-1">Attributes:</div>
                  <pre className="text-[11px] text-cyber-green">{JSON.stringify(selectedSpan.attributes, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
