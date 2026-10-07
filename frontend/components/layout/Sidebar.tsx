'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Zap,
  AlertOctagon,
  DollarSign,
  Terminal,
  Activity,
  History,
  Shield,
  Layers,
} from 'lucide-react';

export type ActiveTab = 'overview' | 'ai-query' | 'incidents' | 'cost' | 'traces';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenChaos: () => void;
  onOpenAiDiagnosis: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenChaos,
  onOpenAiDiagnosis,
}) => {
  const menuItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Architecture Map', icon: <Layers className="w-4 h-4" /> },
    { id: 'ai-query', label: 'NL Telemetry AI', icon: <Terminal className="w-4 h-4" />, badge: 'AI' },
    { id: 'incidents', label: 'Incidents & Runbooks', icon: <AlertOctagon className="w-4 h-4" /> },
    { id: 'cost', label: 'Cost Attribution', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'traces', label: 'Live Trace Stream', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-64 bg-surface-100/90 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-white/10 p-3 lg:p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-3 lg:space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Observability Modules
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`shrink-0 lg:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium font-mono transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-cyan/20 to-cyber-blue/20 text-cyber-cyan border border-cyber-cyan/40 glow-cyan font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-surface-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-purple/30 text-cyber-purple border border-cyber-purple/40 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Trigger Actions */}
        <div className="hidden lg:block pt-4 border-t border-white/10 space-y-2">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Execution Engines
          </div>

          <button
            onClick={onOpenAiDiagnosis}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-50 hover:bg-surface-200 border border-white/10 text-gray-200 hover:text-cyber-purple transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyber-purple" />
            <span>AI Incident Diagnosis</span>
          </button>

          <button
            onClick={onOpenChaos}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-50 hover:bg-surface-200 border border-white/10 text-gray-200 hover:text-cyber-red transition-all"
          >
            <Zap className="w-4 h-4 text-cyber-red" />
            <span>Inject Chaos Fault</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="hidden lg:block p-3 rounded-xl bg-surface-50/80 border border-white/5 text-[11px] font-mono text-gray-400 space-y-1">
        <div className="text-white font-semibold flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-cyber-green" />
          <span>Multi-Tier Active</span>
        </div>
        <div>Postgres • Mongo • Redis</div>
        <div className="text-[10px] text-cyber-cyan font-bold">OTel Collector Ready</div>
      </div>
    </aside>
  );
};
