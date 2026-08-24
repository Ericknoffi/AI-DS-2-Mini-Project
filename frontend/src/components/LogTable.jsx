import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export default function LogTable({ 
  logs, 
  onSelectLog, 
  filterAnomalyOnly, 
  setFilterAnomalyOnly, 
  searchIP, 
  setSearchIP,
  sensitivity,
  setSensitivity
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAnomalyOnly, searchIP, sensitivity, pageSize]);

  const getStatusColor = (code) => {
    if (code < 300) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/40';
    if (code < 400) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/40';
    if (code < 500) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/40';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/40';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800/40';
      case 'POST': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/40';
      case 'DELETE': return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/40';
      case 'PUT': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/40';
      default: return 'text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    }
  };

  const getSensitivityLabel = (val) => {
    if (val < 0.65) return { text: "Permissive (High Recall)", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800/40" };
    if (val <= 0.85) return { text: "Balanced (Recommended)", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/40" };
    return { text: "Strict (Critical Only)", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/40" };
  };

  const sensBadge = getSensitivityLabel(sensitivity);

  // Apply real-time sensitivity filtering
  const displayedLogs = logs.filter(log => {
    if (filterAnomalyOnly) {
      return log.predicted_anomaly === 1 && (log.anomaly_score ?? 0) >= sensitivity;
    }
    return true;
  });

  // Calculate pagination
  const totalRecords = displayedLogs.length;
  const effectivePageSize = pageSize === -1 ? totalRecords : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalRecords / (effectivePageSize || 1)));
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedLogs = displayedLogs.slice(startIndex, startIndex + effectivePageSize);

  return (
    <div className="cyber-card flex flex-col overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP, Session, or Location..."
            value={searchIP}
            onChange={(e) => setSearchIP(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Dynamic Sensitivity Controller Slider */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">
              Sensitivity Threshold: <span className="text-cyan-600 dark:text-cyan-400">≥ {sensitivity.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-32 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${sensBadge.color}`}>
            {sensBadge.text}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterAnomalyOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              !filterAnomalyOnly 
                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40 font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setFilterAnomalyOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              filterAnomalyOnly 
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-400 dark:border-rose-500/40 font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            Anomalies Only ({logs.filter(l => l.predicted_anomaly === 1 && (l.anomaly_score ?? 0) >= sensitivity).length})
          </button>
        </div>
      </div>

      {/* Table Stream */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Client IP & Location</th>
              <th className="py-3 px-4">Request</th>
              <th className="py-3 px-4">Session / UA</th>
              <th className="py-3 px-4">Anomaly Score</th>
              <th className="py-3 px-4">Algorithmic Reason</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400 dark:text-slate-500">
                  No logs found matching the filter criteria or sensitivity threshold.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isAnomaly = log.predicted_anomaly === 1;
                const score = log.anomaly_score ?? 0;

                return (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isAnomaly ? 'bg-rose-50/60 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Status Icon */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isAnomaly ? (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                          FLAG
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          NORM
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {log.timestamp}
                    </td>

                    {/* Client IP & Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-200">{log.ip_address}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-500">{log.location}</div>
                    </td>

                    {/* Request Method & Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getMethodColor(log.request_type)}`}>
                          {log.request_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusColor(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      </div>
                    </td>

                    {/* Session / UA */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-300 font-medium">#{log.session_id}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-500 truncate max-w-[120px]">{log.user_agent}</div>
                    </td>

                    {/* Anomaly Score Bar */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              score > 0.8 ? 'bg-rose-500' : score > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, score * 100))}%` }}
                          />
                        </div>
                        <span className={`font-bold ${score > 0.8 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {score.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Algorithmic Reason */}
                    <td className="py-3 px-4 max-w-[220px] truncate text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.flag_reason || "Normal behavioral baseline"}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectLog(log)}
                        className="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-950 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/60 rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-all font-semibold"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        AI Diagnose
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Record count info */}
        <div>
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords > 0 ? startIndex + 1 : 0}</span> to{" "}
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords)}
          </span>{" "}
          of <span className="font-bold text-cyan-600 dark:text-cyan-400">{totalRecords.toLocaleString()}</span> entries
        </div>

        {/* Page size dropdown & pagination controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={-1}>All ({totalRecords})</option>
            </select>
          </div>

          {/* Page nav buttons */}
          {pageSize !== -1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
