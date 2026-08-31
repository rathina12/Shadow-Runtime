'use client';

import React, { useState } from 'react';
import { useTelemetryStore, TraceSummary } from '../../store/telemetryStore';
import { Activity, Clock, Filter, AlertTriangle, CheckCircle, Search, ExternalLink } from 'lucide-react';

export const TraceStreamView: React.FC<{ onInspectTrace: (trace: any) => void }> = ({ onInspectTrace }) => {
  const { recentTraces, services } = useTelemetryStore();
  const [filterService, setFilterService] = useState<string>('ALL');
  const [filterErrorOnly, setFilterErrorOnly] = useState<boolean>(false);

  const filteredTraces = recentTraces.filter((t) => {
    if (filterService !== 'ALL' && !t.servicesInvolved?.includes(filterService)) return false;
    if (filterErrorOnly && !t.hasErrors && t.statusCode !== 'ERROR') return false;
    return true;
  });

  return (
    <div className="rounded-2xl bg-surface-100/90 border border-white/10 p-6 shadow-2xl space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyber-cyan" />
            Live Distributed Trace Ingestion Stream
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            High-throughput OpenTelemetry spans buffered and correlated across microservices.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Service Filter */}
          <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-1.5 rounded-lg border border-white/10">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="ALL">All Services</option>
              {Object.keys(services).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Error Only Toggle */}
          <button
            onClick={() => setFilterErrorOnly(!filterErrorOnly)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              filterErrorOnly
                ? 'bg-cyber-red/20 text-cyber-red border-cyber-red'
                : 'bg-surface-50 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            Errors Only
          </button>
        </div>
      </div>

      {/* Traces List Table */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-surface-50 text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-3.5">STATUS</th>
              <th className="p-3.5">TRACE ID</th>
              <th className="p-3.5">ROOT OPERATION</th>
              <th className="p-3.5">SERVICES TRAVERSED</th>
              <th className="p-3.5">DURATION</th>
              <th className="p-3.5">SPANS</th>
              <th className="p-3.5 text-right">INSPECT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-surface-100">
            {filteredTraces.length > 0 ? (
              filteredTraces.map((trace, idx) => {
                const isError = trace.hasErrors || trace.statusCode === 'ERROR';
                return (
                  <tr
                    key={trace.traceId || idx}
                    onClick={() => onInspectTrace(trace)}
                    className="hover:bg-surface-200/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5">
                      <span
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                          isError ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-green/20 text-cyber-green'
                        }`}
                      >
                        {isError ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {isError ? 'ERROR' : 'OK'}
                      </span>
                    </td>
                    <td className="p-3.5 text-cyber-cyan font-bold">{trace.traceId}</td>
                    <td className="p-3.5 text-white font-medium">{trace.name || 'POST /checkout'}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {trace.servicesInvolved?.map((svc: string) => (
                          <span
                            key={svc}
                            className="px-1.5 py-0.5 rounded bg-surface-50 text-gray-300 text-[10px] border border-white/5"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      <span className={trace.durationMs > 300 ? 'text-cyber-amber' : 'text-white'}>
                        {trace.durationMs}ms
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-400">{trace.spansCount || trace.spans?.length || 4}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectTrace(trace);
                        }}
                        className="p-1 rounded bg-surface-50 hover:bg-surface-200 text-cyber-cyan border border-white/10"
                        title="View Gantt Waterfall"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400 text-xs">
                  Streaming incoming traces... Microservice traffic generator is active.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
