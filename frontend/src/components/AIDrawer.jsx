import React from 'react';
import { X, Sparkles, AlertOctagon, CheckCircle2, Copy, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export default function AIDrawer({ selectedLog, explanation, loading, onClose }) {
  if (!selectedLog) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700/80 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 rounded-lg text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Incident Root Cause Analysis
                <span className="text-xs font-mono px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60 rounded font-semibold">
                  Score: {selectedLog.anomaly_score ?? '0.94'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Log ID #{selectedLog.id} • Timestamp: {selectedLog.timestamp}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-sm text-cyan-600 dark:text-cyan-300 font-mono animate-pulse">
              Consulting Gemini AI SRE Engine...
            </p>
          </div>
        ) : (
          <>
            {/* Raw Log Telemetry */}
            <div className="cyber-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Log Telemetry
                </span>
                <span className="text-xs font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/40 font-bold">
                  {selectedLog.request_type} {selectedLog.status_code}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950/80 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <div><span className="text-slate-400 dark:text-slate-500">Source IP:</span> <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedLog.ip_address}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500">Location:</span> <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedLog.location}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500">Session ID:</span> <span className="text-slate-800 dark:text-slate-200 font-semibold">#{selectedLog.session_id}</span></div>
                <div><span className="text-slate-400 dark:text-slate-500">User Agent:</span> <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedLog.user_agent}</span></div>
              </div>
              {selectedLog.flag_reason && (
                <div className="text-xs font-mono text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Algorithmic Reason: </span>
                  {selectedLog.flag_reason}
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="cyber-card p-4 border-l-4 border-cyan-500 flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 font-mono uppercase">
                <Cpu className="w-4 h-4" />
                What Happened (Plain-English)
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {explanation?.summary || selectedLog.ai_summary || "Automated anomaly signature detected by Isolation Forest."}
              </p>
            </div>

            {/* AI Root Cause */}
            <div className="cyber-card p-4 border-l-4 border-amber-500 flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 font-mono uppercase">
                <AlertOctagon className="w-4 h-4" />
                Likely Root Cause
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {explanation?.root_cause || selectedLog.ai_root_cause || "Behavioral deviation from established normal baseline."}
              </p>
            </div>

            {/* Remediation Playbook */}
            <div className="cyber-card p-4 border-l-4 border-emerald-500 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-mono uppercase">
                <ShieldCheck className="w-4 h-4" />
                Recommended Remediation Playbook
              </h3>
              <div className="flex flex-col gap-2.5">
                {(explanation?.remediation_steps || (selectedLog.ai_remediation ? selectedLog.ai_remediation.split('\n• ') : [
                  "Verify source IP against threat intelligence feeds.",
                  "Apply rate-limiting or challenge suspect requests.",
                  "Audit session validity and rotate credentials if hijacked."
                ])).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded border border-slate-200 dark:border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step.replace(/^•\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export & Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => copyToClipboard(JSON.stringify({ log: selectedLog, analysis: explanation }, null, 2))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors border border-slate-300 dark:border-transparent font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Full Incident JSON
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
