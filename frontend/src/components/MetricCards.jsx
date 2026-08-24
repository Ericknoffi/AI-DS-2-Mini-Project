import React from 'react';
import { Database, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';

export default function MetricCards({ analytics }) {
  const total = analytics?.total_logs ?? 0;
  const anomalies = analytics?.anomaly_count ?? 0;
  const rate = analytics?.anomaly_rate ?? 0.0;
  const maxScore = analytics?.max_threat_score ?? 0.0;
  const activePatterns = analytics?.active_threat_categories ?? 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Ingested Logs */}
      <div className="cyber-card p-5 flex flex-col gap-2 hover:border-cyan-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Total Ingested Logs
          </span>
          <span className="text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40 rounded-full font-mono font-medium">
            Active Dataset
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          {total.toLocaleString()}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">records</span>
        </div>
      </div>

      {/* Flagged Anomalies */}
      <div className="cyber-card p-5 flex flex-col gap-2 hover:border-rose-500/50 transition-colors relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Flagged Anomalies
          </span>
          <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40 rounded-full font-mono font-medium flex items-center gap-1">
            {rate}% rate
          </span>
        </div>
        <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight mt-1">
          {anomalies.toLocaleString()}
        </div>
      </div>

      {/* Isolation Forest Confidence */}
      <div className="cyber-card p-5 flex flex-col gap-2 hover:border-purple-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Max Anomaly Score
          </span>
          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-800/40 rounded-full font-mono font-medium">
            {maxScore >= 0.85 ? "Critical" : maxScore >= 0.70 ? "High" : "Moderate"}
          </span>
        </div>
        <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 tracking-tight mt-1">
          {maxScore.toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ 1.0</span>
        </div>
      </div>

      {/* Active Threat Categories */}
      <div className="cyber-card p-5 flex flex-col gap-2 hover:border-emerald-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Attack Signatures
          </span>
          <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 rounded-full font-mono font-medium">
            Isolation Forest
          </span>
        </div>
        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight mt-1">
          {activePatterns} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">active vectors</span>
        </div>
      </div>
    </section>
  );
}
