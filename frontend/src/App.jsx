import React, { useState, useEffect } from 'react';
import { Shield, Upload, RefreshCw, Activity, Terminal, Sparkles, Sun, Moon, FileText, Cpu, Folder, Layers } from 'lucide-react';
import MetricCards from './components/MetricCards';
import LogTable from './components/LogTable';
import AIDrawer from './components/AIDrawer';
import UploadModal from './components/UploadModal';
import ReportModal from './components/ReportModal';
import BatchHistoryModal from './components/BatchHistoryModal';
import { api } from './services/api';

export default function App() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filterAnomalyOnly, setFilterAnomalyOnly] = useState(false);
  const [searchIP, setSearchIP] = useState('');
  const [sensitivity, setSensitivity] = useState(0.70);
  
  // Dataset Batch History state
  const [batches, setBatches] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState('all');
  const [isBatchHistoryOpen, setIsBatchHistoryOpen] = useState(false);

  // Model selector state
  const [availableModels, setAvailableModels] = useState([
    { id: 'isolation_forest.joblib', name: 'Isolation Forest (300 Trees)', algorithm: 'isolation_forest' }
  ]);
  const [activeModel, setActiveModel] = useState('isolation_forest.joblib');
  const [switchingModel, setSwitchingModel] = useState(false);

  const [selectedLog, setSelectedLog] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Theme state persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sentinel_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sentinel_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sentinel_theme', 'light');
    }
  }, [darkMode]);

  // Load Models from backend
  const loadModels = async () => {
    try {
      const res = await api.getModels();
      if (res?.models && res.models.length > 0) {
        setAvailableModels(res.models);
      }
    } catch (err) {
      console.warn("Failed to load models list:", err);
    }
  };

  // Load Batches from backend
  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      if (res?.batches) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.warn("Failed to load batches list:", err);
    }
  };

  // Load Data from Backend (Filtered by activeBatchId)
  const loadData = async (batchId = activeBatchId) => {
    setRefreshing(true);
    try {
      const stats = await api.getAnalytics(batchId);
      setAnalytics(stats);

      const logsData = await api.getLogs({
        batch_id: batchId,
        anomaly_only: filterAnomalyOnly,
        ip_search: searchIP || undefined,
        limit: 5000
      });
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadModels();
    loadBatches();
  }, []);

  useEffect(() => {
    loadData(activeBatchId);
  }, [activeBatchId, filterAnomalyOnly, searchIP]);

  // Switch Model Handler
  const handleModelChange = async (newModelId) => {
    setActiveModel(newModelId);
    setSwitchingModel(true);
    try {
      await api.switchModel(newModelId);
      await loadData(activeBatchId);
      await loadBatches();
    } catch (err) {
      console.error("Failed to switch model:", err);
    } finally {
      setSwitchingModel(false);
    }
  };

  // Switch Active Dataset Batch
  const handleSelectBatch = (batchId) => {
    setActiveBatchId(batchId);
  };

  // Handle Log Click & AI Explain
  const handleSelectLog = async (log) => {
    setSelectedLog(log);
    setLoadingAI(true);
    setExplanation(null);
    try {
      if (log.ai_summary && log.ai_root_cause) {
        setExplanation({
          summary: log.ai_summary,
          root_cause: log.ai_root_cause,
          remediation_steps: log.ai_remediation ? log.ai_remediation.split('\n• ') : []
        });
      } else {
        const res = await api.explainLog(log.id);
        setExplanation(res.explanation);
      }
    } catch (err) {
      console.error("Failed to explain log:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Find active batch name
  const activeBatchObj = batches.find(b => b.id === activeBatchId);
  const activeBatchName = activeBatchId === 'all' 
    ? 'All Datasets (Combined)' 
    : (activeBatchObj ? activeBatchObj.filename : 'Active Dataset');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b1326] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0b1326]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-16 flex items-center justify-between shadow-sm dark:shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/30 rounded-xl text-cyan-600 dark:text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              SentinelLog AI
              <span className="text-[11px] font-mono px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40 rounded-full">
                SRE Command Center
              </span>
            </h1>
          </div>

          {/* Active Dataset Selector Dropdown */}
          <div className="ml-2 hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm">
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">Dataset:</span>
            <select
              value={activeBatchId}
              onChange={(e) => setActiveBatchId(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none cursor-pointer py-0.5 max-w-[200px] truncate"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                All Datasets (Combined)
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                  {b.filename} ({b.total_logs} logs)
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsBatchHistoryOpen(true)}
              className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold transition-colors"
              title="Manage Uploaded Datasets History"
            >
              History
            </button>
          </div>

          {/* Manual ML Model Selector */}
          <div className="ml-2 hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">Model:</span>
            <select
              value={activeModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={switchingModel}
              className="bg-transparent text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer py-0.5"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                  {m.name}
                </option>
              ))}
            </select>
            {switchingModel && <RefreshCw className="w-3 h-3 text-cyan-500 animate-spin" />}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Executive Report Button */}
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            title="Export Executive SRE Report"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Export SRE Report</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => loadData(activeBatchId)}
            disabled={refreshing}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
          
          {/* Upload Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-950/20"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV Logs
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Active Dataset Banner */}
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-300 font-medium">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Analyzing Dataset: <span className="font-bold underline">{activeBatchName}</span>
          </div>
          <button
            onClick={() => setIsBatchHistoryOpen(true)}
            className="text-xs font-mono text-amber-700 dark:text-amber-400 hover:underline font-semibold"
          >
            View All Uploaded Datasets ({batches.length}) →
          </button>
        </div>

        {/* KPI Metrics */}
        <MetricCards analytics={analytics} />

        {/* Log Stream Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Ingested Log Stream & Behavioral Signals
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Showing {logs.length} entries for current dataset
            </span>
          </div>

          <LogTable
            logs={logs}
            onSelectLog={handleSelectLog}
            filterAnomalyOnly={filterAnomalyOnly}
            setFilterAnomalyOnly={setFilterAnomalyOnly}
            searchIP={searchIP}
            setSearchIP={setSearchIP}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
          />
        </div>
      </main>

      {/* Slide-Over AI Diagnostic Drawer */}
      <AIDrawer
        selectedLog={selectedLog}
        explanation={explanation}
        loading={loadingAI}
        onClose={() => setSelectedLog(null)}
      />

      {/* CSV Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async (newBatchId) => {
          await loadBatches();
          if (newBatchId) {
            setActiveBatchId(newBatchId);
          } else {
            await loadData('all');
          }
        }}
      />

      {/* Dataset History Modal */}
      <BatchHistoryModal
        isOpen={isBatchHistoryOpen}
        onClose={() => setIsBatchHistoryOpen(false)}
        batches={batches}
        activeBatchId={activeBatchId}
        onSelectBatch={handleSelectBatch}
        onBatchDeleted={async (deletedId) => {
          if (activeBatchId === deletedId) {
            setActiveBatchId('all');
          }
          await loadBatches();
          await loadData('all');
        }}
      />

      {/* Executive SRE Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        minScore={sensitivity}
      />
    </div>
  );
}
