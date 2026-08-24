import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, X, Printer, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function ReportModal({ isOpen, onClose, minScore = 0.70 }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.exportReport(minScore)
        .then(data => setReportData(data))
        .catch(err => console.error("Report load error:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, minScore]);

  if (!isOpen) return null;

  // 1. Download as Markdown (.md)
  const handleDownloadMarkdown = () => {
    if (!reportData?.report_markdown) return;
    const blob = new Blob([reportData.report_markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SentinelLog_SRE_Incident_Audit_Report_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 2. Export as PDF (Generates high-res printable executive document)
  const handleExportPDF = () => {
    if (!reportData?.report_markdown) return;
    
    // Create an isolated printable window with professional report styling
    const printWindow = window.open('', '_blank');
    const contentHtml = reportData.report_markdown
      .replace(/^# (.*$)/gim, '<h1 class="title">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="section">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="subsection">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n\n/gim, '<br/>')
      .replace(/---/gim, '<hr/>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SentinelLog AI - Executive SRE Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              padding: 40px;
              line-height: 1.6;
              max-width: 850px;
              margin: 0 auto;
            }
            .header-banner {
              border-bottom: 2px solid #06b6d4;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              color: #0f172a;
              margin: 0 0 10px 0;
            }
            .section {
              font-size: 16px;
              color: #0369a1;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 25px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .subsection {
              font-size: 14px;
              color: #0f172a;
              background-color: #f8fafc;
              padding: 8px 12px;
              border-left: 4px solid #ef4444;
              margin-top: 15px;
            }
            code {
              font-family: "JetBrains Mono", monospace;
              background-color: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              color: #0284c7;
            }
            li {
              margin-bottom: 6px;
            }
            hr {
              border: 0;
              border-top: 1px solid #e2e8f0;
              margin: 20px 0;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <strong>SentinelLog AI</strong> • Security & Reliability Telemetry
            </div>
            <div style="font-size: 12px; color: #64748b;">
              CONFIDENTIAL • SRE AUDIT
            </div>
          </div>
          <div>${contentHtml}</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    if (!reportData?.report_markdown) return;
    navigator.clipboard.writeText(reportData.report_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 rounded-lg border border-cyan-300 dark:border-cyan-800/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Executive SRE Incident Audit Report
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Isolation Forest Telemetry + AI Remediation Playbook (Score ≥ {minScore.toFixed(2)})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Report Preview */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 animate-pulse">Compiling SRE Fleet Incident Telemetry...</p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
              {reportData?.report_markdown}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <span className="text-[11px] font-mono text-slate-500">
            Export format: PDF Document or Markdown
          </span>
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-slate-300 dark:border-transparent"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>

            {/* Markdown Download */}
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-slate-300 dark:border-transparent"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Markdown (.md)
            </button>

            {/* PDF Export Button */}
            <button
              onClick={handleExportPDF}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Export as PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
