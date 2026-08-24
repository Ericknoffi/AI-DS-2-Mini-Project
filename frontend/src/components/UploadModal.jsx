import React, { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError(null);
    } else {
      setError('Please select a valid .csv file.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadCSV(file);
      setSuccess(`Successfully ingested ${res.total_records} logs (${res.anomalies_detected} anomalies flagged).`);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        setSuccess(null);
        setFile(null);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Upload & Ingest Log Dataset</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Area */}
        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-950/40 transition-colors">
          <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {file ? file.name : "Click to browse or drop CSV file"}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Accepts .csv log files with Timestamp, IP, Request_Type, Status_Code
            </p>
          </div>
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </label>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono transition-colors font-medium border border-slate-300 dark:border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-950/20"
          >
            {uploading ? "Ingesting & Analyzing..." : "Run Detection"}
          </button>
        </div>
      </div>
    </div>
  );
}
