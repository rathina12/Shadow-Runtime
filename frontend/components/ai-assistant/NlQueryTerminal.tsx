'use client';

import React, { useState } from 'react';
import { gatewayApi } from '../../lib/api';
import { Terminal, Sparkles, Search, Code, ArrowRight, CornerDownLeft, Clock, CheckCircle2 } from 'lucide-react';

export const NlQueryTerminal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const sampleQueries = [
    'Show all 5xx errors from payment-gateway in last 15 minutes',
    'Find slowest traces with latency > 300ms',
    'Traces traversing order-service with errors',
    'List all database-cluster calls under checkout flow',
  ];

  const handleExecute = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await gatewayApi.post('/api/ai/nl-query', { query: queryText });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-surface-100/90 border border-white/10 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 glow-cyan">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Natural Language Telemetry Query
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                AI Pipeline Compiler
              </span>
            </h3>
            <p className="text-xs text-gray-400">Ask any question in plain English. Gemini compiles it into a validated MongoDB aggregation pipeline.</p>
          </div>
        </div>
      </div>

      {/* Query Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 border border-white/15 px-4 py-3 focus-within:border-cyber-cyan/60 transition-all">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute(query)}
            placeholder="e.g. 'Show me all 5xx errors from payment-gateway with latency > 400ms'..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
          />
          <button
            onClick={() => handleExecute(query)}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-blue hover:bg-cyber-blue/80 disabled:opacity-50 text-white text-xs font-semibold font-mono transition-all glow-cyan"
          >
            {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <CornerDownLeft className="w-3.5 h-3.5" />}
            <span>Execute</span>
          </button>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[11px] font-mono text-gray-500">Quick prompts:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleExecute(q);
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-surface-200 hover:bg-surface-300 text-gray-300 hover:text-cyber-cyan border border-white/5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in">
          {/* Query Translation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Interpreted Intent */}
            <div className="p-4 rounded-xl bg-surface-50 border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono text-cyber-cyan mb-2">
                <span className="font-bold uppercase">Interpreted Intent:</span>
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {result.executionTimeMs}ms
                </span>
              </div>
              <p className="text-xs text-gray-200">{result.interpretedIntent}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-mono">{result.aiExplanation}</p>
            </div>

            {/* Generated MongoDB Aggregation Pipeline */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs overflow-x-auto">
              <div className="text-[10px] text-cyber-purple font-bold uppercase mb-1 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> MongoDB Aggregation Pipeline:
              </div>
              <pre className="text-[11px] text-cyber-green/90 leading-tight">
                {JSON.stringify(result.mongoAggregationPipeline, null, 2)}
              </pre>
            </div>
          </div>

          {/* Matched Data Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono text-gray-400 uppercase font-semibold">
                Matched Traces ({result.totalMatches}):
              </div>
            </div>

            {result.data?.length > 0 ? (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface-50 text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="p-3">TRACE ID</th>
                      <th className="p-3">ROOT SERVICE</th>
                      <th className="p-3">OPERATION</th>
                      <th className="p-3">DURATION</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">SPANS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-surface-100">
                    {result.data.map((trace: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-200/50 transition-colors">
                        <td className="p-3 text-cyber-cyan font-bold">{trace.traceId || `trace_${idx}`}</td>
                        <td className="p-3 text-white">{trace.rootServiceName || 'api-gateway'}</td>
                        <td className="p-3 text-gray-300">{trace.name || 'Distributed Operation'}</td>
                        <td className="p-3 font-semibold text-white">{trace.durationMs || 120}ms</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              trace.hasErrors || trace.statusCode === 'ERROR'
                                ? 'bg-cyber-red/20 text-cyber-red'
                                : 'bg-cyber-green/20 text-cyber-green'
                            }`}
                          >
                            {trace.statusCode || 'OK'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">{trace.spansCount || trace.spans?.length || 4}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs font-mono bg-surface-50 rounded-xl">
                No matching telemetry records found for this query filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
