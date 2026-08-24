import React from 'react';
import { 
  Activity, ShieldAlert, BarChart3, PieChart, Globe, Zap, 
  AlertTriangle, Server, ArrowUpRight, TrendingUp, Layers, CheckCircle2,
  Bot, Smartphone, Monitor, Terminal, Lock, Flame, Plane, RefreshCw
} from 'lucide-react';

export default function VisualDashboard({ analytics, activeBatchName }) {
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
        <p className="text-sm font-mono">Aggregating telemetry visualization...</p>
      </div>
    );
  }

  const {
    total_logs = 0,
    anomaly_count = 0,
    anomaly_rate = 0,
    top_threat_ips = [],
    location_distribution = [],
    score_brackets = { low: 0, moderate: 0, high: 0, critical: 0 },
    timeline = [],
    client_distribution = {},
    threat_categories = {}
  } = analytics;

  const normal_count = Math.max(0, total_logs - anomaly_count);
  const normal_rate = total_logs > 0 ? ((normal_count / total_logs) * 100).toFixed(1) : 100;

  // Max value in timeline for scaling
  const maxTimelineVal = Math.max(...timeline.map(t => t.total || 0), 10);

  const getPercent = (count) => total_logs > 0 ? ((count / total_logs) * 100).toFixed(1) : 0;

  // Pie chart calculation (Circumference = 2 * PI * r = 2 * 3.14159 * 42 ~= 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const normalStroke = (normal_count / (total_logs || 1)) * circumference;
  const anomalyStroke = (anomaly_count / (total_logs || 1)) * circumference;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-300">
      
      {/* Visual Header Banner (Dual Light/Dark Mode) */}
      <div className="bg-gradient-to-r from-cyan-50 via-sky-50 to-slate-100 dark:from-slate-900 dark:via-cyan-950 dark:to-slate-900 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-200">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40 rounded-full text-[11px] font-mono font-semibold">
                Visual Threat Intelligence
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Scope: {activeBatchName}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Behavioral Anomaly & Ingestion Telemetry Hub
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-1">
              Multi-dimensional visual analysis of system telemetry, attack signatures, and algorithmic outliers.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-950/60 border border-cyan-200 dark:border-cyan-500/20 p-3 rounded-xl backdrop-blur-md shadow-sm">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Fleet Anomaly Index</span>
              <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400">
                {anomaly_rate}%
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Total Analyzed</span>
              <span className="text-2xl font-mono font-bold text-cyan-700 dark:text-cyan-300">
                {total_logs.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: TWO NON-HTTP VISUALIZATION GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 1: ANOMALY PROPORTION PIE / DONUT CHART */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Anomaly vs Baseline Traffic Share
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-semibold">
                Isolation Ratio
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mb-4">
              Proportional share of verified normal baseline traffic vs algorithmic anomaly detections
            </p>
          </div>

          {/* Donut Chart SVG Container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Normal Segment (Cyan) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-cyan-500 transition-all duration-700"
                  strokeWidth="12"
                  strokeDasharray={`${normalStroke} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="transparent"
                />
                {/* Anomalous Segment (Rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-rose-500 transition-all duration-700"
                  strokeWidth="13"
                  strokeDasharray={`${anomalyStroke} ${circumference}`}
                  strokeDashoffset={`-${normalStroke}`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Inner Center Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                  {anomaly_rate}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-semibold">
                  Threat Index
                </span>
              </div>
            </div>

            {/* Legend & Breakdown Stats */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-mono">Normal Requests</span>
                    <span className="text-[10px] font-mono text-slate-500">{normal_rate}% baseline operations</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                  {normal_count.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-mono">Flagged Anomalies</span>
                    <span className="text-[10px] font-mono text-slate-500">{anomaly_rate}% security/SRE risks</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {anomaly_count.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] font-mono text-slate-500">
            Computed by Unsupervised Isolation Forest (300 Estimators)
          </div>
        </div>

        {/* GRAPH 2: DETECTED THREAT VECTOR CATEGORY BREAKDOWN */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Detected Threat Vector Breakdown
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full font-semibold border border-rose-300 dark:border-rose-800/40">
                Threat Classification
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mb-4">
              Distribution of flagged incidents by underlying attack & operational failure signature
            </p>
          </div>

          {/* Category Bars Visualizer */}
          <div className="space-y-3 py-1">
            {Object.entries(threat_categories).map(([cat, count], idx) => {
              const maxAnomCount = Math.max(...Object.values(threat_categories), 1);
              const barWidth = Math.max(6, (count / maxAnomCount) * 100);
              const colors = [
                "bg-rose-500 text-rose-600 dark:text-rose-400",
                "bg-amber-500 text-amber-600 dark:text-amber-400",
                "bg-sky-500 text-sky-600 dark:text-sky-400",
                "bg-purple-500 text-purple-600 dark:text-purple-400",
                "bg-emerald-500 text-emerald-600 dark:text-emerald-400"
              ];
              const [bgClass, textClass] = colors[idx % colors.length].split(' ');

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {cat}
                    </span>
                    <span className={`font-bold shrink-0 ${textClass}`}>
                      {count} incidents
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${count > 0 ? barWidth : 0}%` }} 
                      className={`h-full ${bgClass} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] font-mono text-slate-500">
            Real-time multi-dimensional behavioral signature mapping
          </div>
        </div>

      </div>

      {/* ROW 2: TIMELINE SPARKLINE & INCIDENT BURST GRAPH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Traffic Volume & Incident Spike Timeline
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Temporal distribution of normal requests vs isolated algorithmic anomalies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded bg-cyan-500" /> Normal Requests
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
              <span className="w-3 h-3 rounded bg-rose-500" /> Anomalies Flagged
            </span>
          </div>
        </div>

        {/* Timeline Bar Visualizer */}
        {timeline.length > 0 ? (
          <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
            {timeline.map((bucket, idx) => {
              const normalH = Math.max(4, (bucket.normal / maxTimelineVal) * 100);
              const anomH = Math.max(bucket.anomalies > 0 ? 6 : 0, (bucket.anomalies / maxTimelineVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-950 text-white text-[11px] font-mono p-2 rounded-lg shadow-xl z-20 whitespace-nowrap border border-slate-700 pointer-events-none">
                    <span className="font-bold text-cyan-400">{bucket.time}</span>
                    <span>Total: {bucket.total} logs</span>
                    <span className="text-rose-400">Anomalies: {bucket.anomalies}</span>
                  </div>

                  {/* Stacked Bars */}
                  <div className="w-full flex flex-col justify-end items-center h-full gap-0.5">
                    {bucket.anomalies > 0 && (
                      <div 
                        style={{ height: `${anomH}%` }} 
                        className="w-full bg-rose-500 rounded-t transition-all hover:bg-rose-400 shadow-sm shadow-rose-500/20"
                      />
                    )}
                    <div 
                      style={{ height: `${normalH}%` }} 
                      className={`w-full bg-cyan-500/70 dark:bg-cyan-500/40 hover:bg-cyan-500 transition-all ${bucket.anomalies === 0 ? 'rounded-t' : ''}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-2 rotate-45 sm:rotate-0 origin-left">
                    {bucket.time.split(' ')[1] || bucket.time}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-xs font-mono text-slate-400">
            No temporal timeline records available for current batch.
          </div>
        )}
      </div>

      {/* ROW 3: CLIENT AUTOMATION SIGNATURES & RISK BRACKETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Client Environment & Bot Automation Classifier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Client Environment & Bot Automation Signatures
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Classification of connecting user agents and automated tools
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(client_distribution).map(([client, count]) => {
              const percent = getPercent(count);
              const isBot = client.includes("Bots") || client.includes("Scanners");

              return (
                <div key={client} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {isBot ? <Bot className="w-3.5 h-3.5 text-rose-500" /> : <Monitor className="w-3.5 h-3.5 text-cyan-500" />}
                      {client}
                    </span>
                    <span className={`font-bold ${isBot && count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {count.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBot ? 'bg-rose-500' : 'bg-cyan-500'
                      }`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anomaly Risk Score Density */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Isolation Forest Risk Score Density
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Model confidence brackets across telemetry
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 block font-semibold">
                Normal (0.00 - 0.35)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {score_brackets.low?.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Baseline requests</span>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 rounded-xl">
              <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400 block font-semibold">
                Moderate (0.35 - 0.70)
              </span>
              <span className="text-xl font-bold font-mono text-sky-900 dark:text-sky-200">
                {score_brackets.moderate?.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Occasional noise</span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 block font-semibold">
                High Threat (0.70 - 0.85)
              </span>
              <span className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200">
                {score_brackets.high?.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Suspicious bursts</span>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
              <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 block font-semibold">
                Critical (0.85 - 1.00)
              </span>
              <span className="text-xl font-bold font-mono text-rose-900 dark:text-rose-200">
                {score_brackets.critical?.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Confirmed attack vectors</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 4: TOP MALICIOUS THREAT IPS & GEOGRAPHIC HEATMAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Malicious Threat IPs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Top Identified Malicious Threat IPs
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Highest frequency anomaly originators
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {top_threat_ips.length > 0 ? (
              top_threat_ips.map((item, idx) => {
                const maxAnom = Math.max(...top_threat_ips.map(t => t.anomalies), 1);
                const barWidth = (item.anomalies / maxAnom) * 100;

                return (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="text-rose-500 font-bold">#{idx + 1}</span>
                        {item.ip}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {item.anomalies} flagged incidents
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${barWidth}%` }} className="h-full bg-rose-500 rounded-full" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs font-mono text-slate-400">
                No high-risk threat IPs detected in this dataset.
              </div>
            )}
          </div>
        </div>

        {/* Geographic Origin Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-cyan-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Geographical Origin Heatmap
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Distribution of requests by source country
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {location_distribution.map((loc, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-mono">
                    {loc.location}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {getPercent(loc.count)}% of total volume
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {loc.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROW 5: ATTACK VECTOR SCENARIO REFERENCE CARDS */}
      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-500" />
          Detected Threat Vector Classifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Credential Stuffing
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Rapid 401/403 POST login bursts rotating counterfeit session tokens.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5" /> DDoS & Scraper Floods
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Sub-second request velocity exceeding 2.0 req/sec violating rate limits with 429 & 503 codes.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-1">
              <Globe className="w-3.5 h-3.5" /> Impossible Travel
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Single active session token switching locations across continents within sub-minute intervals.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
