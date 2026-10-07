'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Clock3, GitBranch, Radar, Search, ShieldAlert, Sparkles, Zap } from 'lucide-react';
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
import { useTelemetryStore, TraceSummary } from '../store/telemetryStore';

const NAV: Record<ActiveTab, { title: string; description: string }> = {
  overview: { title: 'System overview', description: 'Live topology, service health and the latest executions.' },
  'ai-query': { title: 'Ask your telemetry', description: 'Explore execution data using natural language.' },
  incidents: { title: 'Incidents & runbooks', description: 'Investigate failures and coordinate remediation.' },
  cost: { title: 'Cost intelligence', description: 'Understand the cost of your backend execution.' },
  traces: { title: 'Distributed traces', description: 'Inspect recent requests across your services.' },
};

function MetricCard({ label, value, detail, icon: Icon, tone = 'default' }: {
  label: string; value: string; detail: string;
  icon: React.ComponentType<{ className?: string }>; tone?: 'default' | 'danger' | 'success';
}) {
  return (
    <div className="sr-metric group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-400">{label}</span>
        <span className="rounded-lg bg-white/[0.05] p-2 text-slate-400 group-hover:text-white transition-colors"><Icon className="h-4 w-4" /></span>
      </div>
      <div className={`mt-3 text-[29px] leading-none font-semibold tracking-tight tabular-nums ${tone === 'danger' ? 'text-rose-300' : tone === 'success' ? 'text-emerald-300' : 'text-slate-50'}`}>{value}</div>
      <p className="mt-3 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetService, setAiTargetService] = useState<string | null>(null);
  const [chaosModalOpen, setChaosModalOpen] = useState(false);
  const [chaosTargetService, setChaosTargetService] = useState<string | null>(null);
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [selectedTraceData, setSelectedTraceData] = useState<TraceSummary | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');

  const { services, recentTraces, isLiveConnected, fetchTopology, fetchTraces, initSocketListeners, setSelectedService } = useTelemetryStore();
  const serviceList = useMemo(() => Object.values(services), [services]);
  const critical = serviceList.filter(s => s.status === 'CRITICAL' || s.status === 'OFFLINE').length;
  const degraded = serviceList.filter(s => s.status === 'DEGRADED').length;
  const healthy = serviceList.filter(s => s.status === 'HEALTHY').length;
  const avgP95 = serviceList.length ? Math.round(serviceList.reduce((sum, s) => sum + (Number(s.p95LatencyMs) || 0), 0) / serviceList.length) : 0;
  const serviceMatches = useMemo(() => serviceList.filter(s => `${s.name} ${s.id} ${s.ownerTeam}`.toLowerCase().includes(serviceSearch.toLowerCase())).slice(0, 8), [serviceList, serviceSearch]);

  useEffect(() => {
    void fetchTopology();
    void fetchTraces();
    initSocketListeners();
    // The store action is stable; the socket layer owns the connection lifecycle.
  }, [fetchTopology, fetchTraces, initSocketListeners]);

  const openAi = (id?: string) => { setAiTargetService(id ?? null); setAiModalOpen(true); };
  const openChaos = (id?: string) => { setChaosTargetService(id ?? null); setChaosModalOpen(true); };

  return (
    <div className="sr-workspace min-h-screen text-slate-100">
      <Navbar onOpenAiDiagnosis={() => openAi()} onOpenChaos={() => openChaos()} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenChaos={() => openChaos()} onOpenAiDiagnosis={() => openAi()} />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-7 sm:px-7 xl:px-10">
          <div className="mx-auto max-w-[1600px] space-y-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-sky-400"><Radar className="h-3.5 w-3.5" /> Operations / {activeTab.replace('-', ' ')}</div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">{NAV[activeTab].title}</h1>
                <p className="mt-2 text-sm text-slate-400">{NAV[activeTab].description}</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${isLiveConnected ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300' : 'border-amber-400/20 bg-amber-400/[0.08] text-amber-200'}`}>
                <span className={`h-2 w-2 rounded-full ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isLiveConnected ? 'Realtime connected' : 'Realtime disconnected · showing cached/demo state'}
              </div>
            </div>

            {activeTab === 'overview' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Monitored services" value={String(serviceList.length)} detail={`${healthy} healthy · ${degraded} degraded`} icon={GitBranch} />
                  <MetricCard label="Services requiring attention" value={String(critical + degraded)} detail={`${critical} critical or offline`} icon={ShieldAlert} tone={critical ? 'danger' : 'success'} />
                  <MetricCard label="Average service P95" value={`${avgP95} ms`} detail="Mean of per-service P95 values" icon={Clock3} />
                  <MetricCard label="Recent traces loaded" value={String(recentTraces.length)} detail="Local recent-trace window, not lifetime count" icon={Activity} />
                </div>

                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
                  <section className="min-w-0 space-y-3" aria-label="Service architecture">
                    <div className="flex items-center justify-between gap-3">
                      <div><h2 className="text-base font-semibold text-white">Service topology</h2><p className="mt-1 text-xs text-slate-500">Select a node to inspect latency, dependencies or blast radius.</p></div>
                      <button onClick={() => openAi()} className="sr-button-primary"><Sparkles className="h-4 w-4" /> Diagnose</button>
                    </div>
                    <ArchitectureMap onOpenAiDiagnosis={openAi} onOpenChaos={openChaos} />
                    <TimelineReplayBar />
                  </section>

                  <aside className="sr-panel self-start p-4" aria-label="Service directory">
                    <div className="flex items-center justify-between"><h2 className="font-semibold text-sm">Service directory</h2><span className="text-xs text-slate-500">{serviceList.length} total</span></div>
                    <label className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-slate-500 focus-within:border-sky-400/40">
                      <Search className="h-4 w-4 shrink-0" /><span className="sr-sr-only">Search services</span>
                      <input className="w-full bg-transparent py-2.5 text-xs text-white outline-none placeholder:text-slate-500" placeholder="Search services or teams" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} />
                    </label>
                    <div className="mt-3 space-y-1.5">
                      {serviceMatches.map(service => (
                        <button key={service.id} onClick={() => { setSelectedService(service.id); }} className="w-full rounded-lg border border-transparent p-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
                          <div className="flex items-start justify-between gap-2"><span className="text-xs font-medium leading-5 text-slate-200">{service.name}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-500" /></div>
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500"><span className="truncate">{service.ownerTeam}</span><span className={service.status === 'HEALTHY' ? 'text-emerald-400' : service.status === 'DEGRADED' ? 'text-amber-300' : 'text-rose-300'}>{service.status}</span></div>
                        </button>
                      ))}
                      {serviceMatches.length === 0 && <p className="py-5 text-center text-xs text-slate-500">No services match your search.</p>}
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-4">
                      <button onClick={() => setActiveTab('incidents')} className="flex w-full items-center justify-between text-xs font-medium text-sky-300 hover:text-white">Investigate incidents <ArrowUpRight className="h-4 w-4" /></button>
                    </div>
                  </aside>
                </div>
                <section className="space-y-3" aria-label="Recent execution traces">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-semibold">Recent executions</h2><p className="text-xs text-slate-500">Requests sampled from your telemetry stream</p></div><button className="text-xs text-sky-300 hover:text-white" onClick={() => setActiveTab('traces')}>Explore all traces →</button></div>
                  <TraceStreamView onInspectTrace={trace => { setSelectedTraceData(trace); setTraceModalOpen(true); }} />
                </section>
              </>
            )}
            {activeTab === 'ai-query' && <NlQueryTerminal />}
            {activeTab === 'incidents' && <IncidentsView onOpenAiDiagnosis={openAi} />}
            {activeTab === 'cost' && <CostAttributionView />}
            {activeTab === 'traces' && <TraceStreamView onInspectTrace={trace => { setSelectedTraceData(trace); setTraceModalOpen(true); }} />}
          </div>
        </main>
      </div>
      <AiDiagnosisModal serviceId={aiTargetService} isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <ChaosControlModal initialServiceId={chaosTargetService} isOpen={chaosModalOpen} onClose={() => setChaosModalOpen(false)} />
      <TraceInspectorModal trace={selectedTraceData} isOpen={traceModalOpen} onClose={() => setTraceModalOpen(false)} />
    </div>
  );
}
