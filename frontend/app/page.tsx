'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar, ActiveTab } from '../components/layout/Sidebar';
import { ArchitectureMap } from '../components/live-map/ArchitectureMap';
import { TimelineReplayBar } from '../components/replay/TimelineReplayBar';
import { NlQueryTerminal } from '../components/ai-assistant/NlQueryTerminal';
import { IncidentsView } from '../components/incidents/IncidentsView';
import { CostAttributionView } from '../components/cost/CostAttributionView';
import { TraceStreamView } from '../components/traces/TraceStreamView';
import { AiDiagnosisModal } from '../components/ai-assistant/AiDiagnosisModal';
import { ChaosControlModal } from '../components/chaos/ChaosControlModal';
import { TraceInspectorModal } from '../components/traces/TraceInspectorModal';
import { useTelemetryStore } from '../store/telemetryStore';
import { Sparkles, Zap, Activity, Layers, Terminal, AlertOctagon, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetService, setAiTargetService] = useState<string | null>(null);

  const [chaosModalOpen, setChaosModalOpen] = useState(false);
  const [chaosTargetService, setChaosTargetService] = useState<string | null>(null);

  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [selectedTraceData, setSelectedTraceData] = useState<any | null>(null);

  const { fetchTopology, fetchTraces, initSocketListeners } = useTelemetryStore();

  useEffect(() => {
    fetchTopology();
    fetchTraces();
    initSocketListeners();
  }, [fetchTopology, fetchTraces, initSocketListeners]);

  const handleOpenAiDiagnosis = (serviceId?: string) => {
    setAiTargetService(serviceId || 'payment-gateway');
    setAiModalOpen(true);
  };

  const handleOpenChaos = (serviceId?: string) => {
    setChaosTargetService(serviceId || 'payment-gateway');
    setChaosModalOpen(true);
  };

  const handleInspectTrace = (trace: any) => {
    setSelectedTraceData(trace);
    setTraceModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenAiDiagnosis={() => handleOpenAiDiagnosis()}
        onOpenChaos={() => handleOpenChaos()}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenChaos={() => handleOpenChaos()}
          onOpenAiDiagnosis={() => handleOpenAiDiagnosis()}
        />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Architecture Topology Canvas */}
              <ArchitectureMap
                onOpenAiDiagnosis={handleOpenAiDiagnosis}
                onOpenChaos={handleOpenChaos}
              />

              {/* Bottom Replay Scrubber */}
              <TimelineReplayBar />

              {/* Live Trace Stream Preview */}
              <TraceStreamView onInspectTrace={handleInspectTrace} />
            </div>
          )}

          {activeTab === 'ai-query' && (
            <div className="animate-in fade-in">
              <NlQueryTerminal />
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="animate-in fade-in">
              <IncidentsView onOpenAiDiagnosis={handleOpenAiDiagnosis} />
            </div>
          )}

          {activeTab === 'cost' && (
            <div className="animate-in fade-in">
              <CostAttributionView />
            </div>
          )}

          {activeTab === 'traces' && (
            <div className="animate-in fade-in">
              <TraceStreamView onInspectTrace={handleInspectTrace} />
            </div>
          )}
        </main>
      </div>

      {/* AI Diagnosis Modal */}
      <AiDiagnosisModal
        serviceId={aiTargetService}
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      {/* Chaos Control Modal */}
      <ChaosControlModal
        initialServiceId={chaosTargetService}
        isOpen={chaosModalOpen}
        onClose={() => setChaosModalOpen(false)}
      />

      {/* Trace Waterfall Modal */}
      <TraceInspectorModal
        trace={selectedTraceData}
        isOpen={traceModalOpen}
        onClose={() => setTraceModalOpen(false)}
      />
    </div>
  );
}
