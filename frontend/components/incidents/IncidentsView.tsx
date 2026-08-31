'use client';

import React, { useState, useEffect } from 'react';
import { coreApi } from '../../lib/api';
import { AlertOctagon, BookOpen, ShieldCheck, CheckCircle, Clock, ArrowUpRight, Copy, Check, Sparkles } from 'lucide-react';

export const IncidentsView: React.FC<{ onOpenAiDiagnosis: (serviceId: string) => void }> = ({ onOpenAiDiagnosis }) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, rbRes] = await Promise.all([
          coreApi.get('/api/v1/incidents'),
          coreApi.get('/api/v1/runbooks'),
        ]);
        if (incRes.data) {
          setIncidents(incRes.data);
          if (incRes.data.length > 0) setSelectedIncident(incRes.data[0]);
        }
        if (rbRes.data) setRunbooks(rbRes.data);
      } catch {
        // Mock fallback
        const mockInc = [{
          id: 1,
          serviceId: 'payment-gateway',
          title: 'High Latency & Connection Pool Starvation on Payment Gateway',
          description: 'Spike in P99 latency exceeding 1,850ms on /payments/charge endpoint due to database connection timeout under peak load.',
          severity: 'HIGH',
          status: 'INVESTIGATING',
          triggerMetric: 'p99_latency_1850ms_sla_breached',
          rootCauseSummary: 'Database connection pool capacity (10) saturated by long-running third-party Stripe webhook validations, blocking incoming charge requests.',
          matchedRunbookId: 1,
          createdAt: new Date().toISOString(),
          matchedRunbook: {
            title: 'Mitigate Payment Gateway HikariCP Connection Pool Starvation',
            autoFixScript: 'kubectl scale deployment payment-gateway --replicas=4 && kubectl rollout restart deployment payment-gateway',
            stepsMarkdown: '1. Scale deployment to 4 replicas\n2. Adjust max pool size to 50\n3. Restart degraded pods',
          }
        }];
        setIncidents(mockInc);
        setSelectedIncident(mockInc[0]);
      }
    };
    fetchData();
  }, []);

  const handleCopy = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(script);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-cyber-red" />
            Active Incidents & Automated Runbooks
          </h2>
          <p className="text-xs text-gray-400">PostgreSQL relational incident records mapped to automated SRE mitigation runbooks.</p>
        </div>
      </div>

      {/* Grid: Incident List & Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-mono text-gray-400 uppercase font-semibold">Recorded Incidents:</div>
          <div className="space-y-2.5">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  selectedIncident?.id === inc.id
                    ? 'bg-surface-200 border-cyber-cyan glow-cyan'
                    : 'bg-surface-100/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red">
                    {inc.severity}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{inc.title}</h4>
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>{inc.serviceId}</span>
                  <span className="text-cyber-amber font-semibold">{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Incident Details & Runbook */}
        {selectedIncident && (
          <div className="lg:col-span-2 rounded-2xl bg-surface-100/90 border border-white/10 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-cyber-cyan">{selectedIncident.serviceId}</span>
                <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">Trigger: {selectedIncident.triggerMetric}</p>
              </div>
              <button
                onClick={() => onOpenAiDiagnosis(selectedIncident.serviceId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyber-purple to-cyber-blue text-white shadow-lg glow-purple"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Root-Cause</span>
              </button>
            </div>

            {/* Description & Root Cause */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-surface-50 border border-white/5">
                <div className="text-xs font-mono text-gray-400 uppercase font-semibold mb-1">Incident Summary:</div>
                <p className="text-xs text-gray-300 leading-relaxed">{selectedIncident.description}</p>
              </div>

              {selectedIncident.rootCauseSummary && (
                <div className="p-3.5 rounded-xl bg-surface-50 border border-cyber-red/20">
                  <div className="text-xs font-mono text-cyber-red uppercase font-semibold mb-1">Diagnosed Root Cause:</div>
                  <p className="text-xs text-gray-200">{selectedIncident.rootCauseSummary}</p>
                </div>
              )}
            </div>

            {/* Matched Runbook */}
            {selectedIncident.matchedRunbook && (
              <div className="p-4 rounded-xl bg-surface-50 border border-cyber-green/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyber-green uppercase">
                    <BookOpen className="w-4 h-4" />
                    <span>Auto-Matched Remediation Runbook</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white">{selectedIncident.matchedRunbook.title}</h4>
                <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed font-sans">
                  {selectedIncident.matchedRunbook.stepsMarkdown}
                </div>

                {selectedIncident.matchedRunbook.autoFixScript && (
                  <div className="relative">
                    <div className="bg-black/90 p-3 rounded-lg border border-white/10 font-mono text-xs text-cyber-green overflow-x-auto">
                      <code>{selectedIncident.matchedRunbook.autoFixScript}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedIncident.matchedRunbook.autoFixScript)}
                      className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono px-2 py-1 bg-surface-200 hover:bg-surface-300 text-gray-200 rounded"
                    >
                      {copiedScript === selectedIncident.matchedRunbook.autoFixScript ? (
                        <>
                          <Check className="w-3 h-3 text-cyber-green" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
