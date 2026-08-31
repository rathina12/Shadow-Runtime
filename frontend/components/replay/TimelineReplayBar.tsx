'use client';

import React, { useState } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';
import { History, Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';

export const TimelineReplayBar: React.FC = () => {
  const { replayMode, replayTimeOffsetMinutes, setReplayMode } = useTelemetryStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const presets = [
    { label: 'LIVE', minutes: 0 },
    { label: '-1m ago', minutes: 1 },
    { label: '-5m ago', minutes: 5 },
    { label: '-15m ago', minutes: 15 },
    { label: '-1h ago', minutes: 60 },
  ];

  return (
    <div className="w-full rounded-2xl bg-surface-100/90 border border-white/10 p-4 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Status Label */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${replayMode ? 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/40 glow-amber' : 'bg-surface-50 text-gray-400 border-white/5'}`}>
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                System State Playback & Replay
              </span>
              {replayMode ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber font-bold animate-pulse">
                  REPLAYING: -{replayTimeOffsetMinutes}M AGO
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green font-bold">
                  REAL-TIME LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Scrub the timeline to inspect previous cascading failures and snapshot states.</p>
          </div>
        </div>

        {/* Center Preset Buttons */}
        <div className="flex items-center gap-1.5 bg-surface-50 p-1.5 rounded-xl border border-white/5">
          {presets.map((p) => {
            const isSelected = (p.minutes === 0 && !replayMode) || (replayMode && replayTimeOffsetMinutes === p.minutes);
            return (
              <button
                key={p.label}
                onClick={() => {
                  if (p.minutes === 0) {
                    setReplayMode(false, 0);
                  } else {
                    setReplayMode(true, p.minutes);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? 'bg-cyber-cyan text-surface-50 font-bold glow-cyan shadow'
                    : 'text-gray-400 hover:text-white hover:bg-surface-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Right Slider */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <span className="text-xs font-mono text-gray-400">Scrub:</span>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={replayTimeOffsetMinutes}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val === 0) {
                setReplayMode(false, 0);
              } else {
                setReplayMode(true, val);
              }
            }}
            className="w-full accent-cyber-cyan cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
