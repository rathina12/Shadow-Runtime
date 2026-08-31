'use client';

import React, { useState, useEffect } from 'react';
import { gatewayApi } from '../../lib/api';
import { Sparkles, AlertTriangle, ShieldCheck, Terminal, Copy, Check, Cpu, RefreshCw } from 'lucide-react';

interface AiDiagnosisModalProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AiDiagnosisModal: React.FC<AiDiagnosisModalProps> = ({ serviceId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDiagnosis = async (targetService: string) => {
    setLoading(true);
    setDiagnosis(null);
    try {
      const res = await gatewayApi.post('/api/ai/diagnose', {
        serviceId: targetService,
        incidentTitle: 'P99 Latency & Connection Degradation Analysis',
      });
      setDiagnosis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchDiagnosis(serviceId);
    }
  }, [isOpen, serviceId]);

  if (!isOpen || !serviceId) return null;

  const handleCopySnippet = () => {
    if (diagnosis?.recommendedRunbookSnippet) {
      navigator.clipboard.writeText(diagnosis.recommendedRunbookSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface-100 border border-cyber-purple/40 shadow-2xl p-6 overflow-hidden">
        {/* Glowing cyber accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-pink" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 glow-purple">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple font-semibold">
                  GEMINI AI ENGINE
                </span>
                <span className="text-xs font-mono text-gray-400">Target: {serviceId}</span>
              </div>
              <h2 className="text-lg font-bold text-white">Automated Incident Root-Cause Diagnosis</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw className="w-10 h-10 text-cyber-purple animate-spin mb-4" />
            <h3 className="text-base font-semibold text-white">Correlating Telemetry Spans & Historical Logs...</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Gemini AI is analyzing trace topologies, database thread metrics, and error rates to extract the primary failure trigger.
            </p>
          </div>
        ) : diagnosis ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Executive Summary Card */}
            <div className="p-4 rounded-xl bg-surface-50 border border-white/10">
              <div className="text-xs font-mono text-cyber-cyan font-bold uppercase mb-1">Executive Summary</div>
              <p className="text-sm text-gray-200 leading-relaxed">{diagnosis.executiveSummary}</p>
            </div>

            {/* Root Cause & Blast Radius Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-surface-50 border border-cyber-red/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-red font-bold uppercase mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Primary Anomaly Trigger</span>
                </div>
                <div className="text-xs font-semibold text-white mb-1">{diagnosis.rootCauseAnalysis?.primaryAnomaly}</div>
                <div className="text-xs text-gray-400">{diagnosis.rootCauseAnalysis?.triggerMechanism}</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-50 border border-cyber-amber/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-amber font-bold uppercase mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>Blast Radius & Severity</span>
                </div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-400">Severity:</span>
                  <span className="font-bold text-cyber-red">{diagnosis.severityAssessment}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Estimated Traffic Impact:</span>
                  <span className="font-bold text-cyber-amber">{diagnosis.estimatedBlastRadiusPercent}%</span>
                </div>
              </div>
            </div>

            {/* Cascading Failures Breakdown */}
            <div className="p-4 rounded-xl bg-surface-50 border border-white/10">
              <div className="text-xs font-mono text-gray-400 uppercase mb-2">Cascading Failure Path:</div>
              <div className="space-y-1.5 font-mono text-xs">
                {diagnosis.rootCauseAnalysis?.cascadingFailures?.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-surface-200 text-cyber-cyan flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Remediation & CLI Snippet */}
            <div className="p-4 rounded-xl bg-surface-50 border border-cyber-green/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyber-green font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Recommended Remediation Commands</span>
                </div>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 bg-surface-200 hover:bg-surface-300 rounded text-gray-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-1.5 mb-3 text-xs text-gray-300">
                {diagnosis.immediateRemediationSteps?.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyber-green font-bold">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {diagnosis.recommendedRunbookSnippet && (
                <div className="bg-black/80 rounded-lg p-3 font-mono text-xs text-cyber-green overflow-x-auto border border-white/10">
                  <code>{diagnosis.recommendedRunbookSnippet}</code>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">Failed to load diagnosis.</div>
        )}
      </div>
    </div>
  );
};
