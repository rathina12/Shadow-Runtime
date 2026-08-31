'use client';

import React from 'react';
import { Activity, ShieldCheck, Zap, Sparkles, User, Radio, RefreshCw } from 'lucide-react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC<{ onOpenAiDiagnosis: () => void; onOpenChaos: () => void }> = ({
  onOpenAiDiagnosis,
  onOpenChaos,
}) => {
  const { isLiveConnected, services, recentTraces } = useTelemetryStore();
  const { user, switchRole } = useAuthStore();

  const activeServicesList = Object.values(services);
  const criticalCount = activeServicesList.filter(s => s.status === 'CRITICAL').length;
  const degradedCount = activeServicesList.filter(s => s.status === 'DEGRADED').length;

  let overallHealth = 'OPTIMAL';
  if (criticalCount > 0) overallHealth = 'CRITICAL ALERT';
  else if (degradedCount > 0) overallHealth = 'DEGRADED';

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-surface-100/80 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-cyan via-cyber-blue to-cyber-purple p-0.5 shadow-lg glow-cyan">
          <div className="w-full h-full bg-surface-50 rounded-[10px] flex items-center justify-center font-bold text-cyber-cyan text-base">
            SR
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white">SHADOW RUNTIME</h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">AI Execution Observability Platform</p>
        </div>
      </div>

      {/* Middle Health Indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        {/* Live Socket Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 border border-white/5">
          <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
          <span className="text-gray-300">{isLiveConnected ? 'STREAM ACTIVE' : 'RECONNECTING'}</span>
        </div>

        {/* Global System Health Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
            overallHealth === 'OPTIMAL'
              ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30'
              : 'bg-cyber-red/15 text-cyber-red border-cyber-red/30 glow-red animate-pulse'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{overallHealth}</span>
        </div>

        {/* Total Sampled Traces */}
        <div className="text-gray-400">
          Traces Ingested: <span className="text-white font-bold">{recentTraces.length || 24}</span>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {/* AI Diagnose Button */}
        <button
          onClick={onOpenAiDiagnosis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyber-purple to-cyber-blue text-white shadow-lg glow-purple hover:opacity-90 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Diagnose</span>
        </button>

        {/* Chaos Engineering Button */}
        <button
          onClick={onOpenChaos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyber-red/20 text-cyber-red border border-cyber-red/40 hover:bg-cyber-red/30 transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Chaos Test</span>
        </button>

        {/* RBAC Role Switcher */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10 font-mono text-xs">
          <div className="text-right hidden sm:block">
            <div className="text-white font-bold text-[11px]">{user.username}</div>
            <div className="text-[10px] text-cyber-cyan">{user.role.replace('ROLE_', '')}</div>
          </div>
          <select
            value={user.role}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-surface-50 border border-white/10 text-[11px] text-gray-300 rounded px-2 py-1 focus:outline-none"
            title="Switch RBAC Role"
          >
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_ENGINEER">Engineer</option>
            <option value="ROLE_VIEWER">Viewer</option>
          </select>
        </div>
      </div>
    </header>
  );
};
