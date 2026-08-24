import React from 'react';
import { Folder, Trash2, CheckCircle, Clock, AlertTriangle, X, Database } from 'lucide-react';
import { api } from '../services/api';

export default function BatchHistoryModal({ isOpen, onClose, batches, activeBatchId, onSelectBatch, onBatchDeleted }) {
  if (!isOpen) return null;

  const handleDelete = async (batchId, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this dataset from history?")) {
      try {
        await api.deleteBatch(batchId);
        onBatchDeleted(batchId);
      } catch (err) {
        alert("Failed to delete dataset: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 rounded-lg border border-cyan-300 dark:border-cyan-800/40">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Uploaded Dataset History & Batch Isolation
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Switch between uploaded log files to analyze each dataset separately
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Batches */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {/* Option: View All Combined */}
          <div
            onClick={() => { onSelectBatch('all'); onClose(); }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              activeBatchId === 'all'
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/10'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  All Uploaded Log Files (Combined Fleet View)
                  {activeBatchId === 'all' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-xs font-mono text-slate-500">Aggregates all logs ingested across all sessions.</p>
              </div>
            </div>
          </div>

          {/* Individual Uploaded Batches */}
          {batches.map((b) => {
            const isActive = activeBatchId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => { onSelectBatch(b.id); onClose(); }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/10'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {b.filename}
                      </h3>
                      {isActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full font-bold">
                          Active Dataset
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {b.uploaded_at}
                      </span>
                      <span>
                        <strong>{b.total_logs?.toLocaleString()}</strong> logs
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {b.anomalies_detected} anomalies ({b.anomaly_rate}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete Batch Button (Enabled for all datasets) */}
                <button
                  onClick={(e) => handleDelete(b.id, e)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  title="Delete this uploaded dataset and its logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
