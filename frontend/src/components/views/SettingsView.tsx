import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { 
  Key, 
  Database, 
  RotateCcw, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  Server,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [backendStatus, setBackendStatus] = useState<{
    status: string;
    geminiConfigured: boolean;
    service?: string;
  } | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const checkBackend = async () => {
    setIsCheckingBackend(true);
    try {
      const health = await ApiService.checkHealth();
      setBackendStatus(health);
    } catch {
      setBackendStatus({ status: 'offline', geminiConfigured: false });
    } finally {
      setIsCheckingBackend(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const handleResetDemo = async () => {
    try {
      await ApiService.resetToDemo();
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch {}
      onDataReset();
    } catch (err) {
      console.error('Failed to reset demo:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all meeting records?')) {
      try {
        await ApiService.clearAll();
        onDataReset();
      } catch (err) {
        console.error('Failed to clear records:', err);
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await ApiService.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meetflow_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (err) {
      console.error('Failed to export backup:', err);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const success = await ApiService.importBackup(text);
      if (success) {
        setImportStatus('Backup successfully imported!');
        onDataReset();
      } else {
        setImportStatus('Failed to import backup. Invalid JSON file format.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Settings & Engine Configuration</h2>
        <p className="text-xs text-slate-400">
          Configure backend API endpoints, monitor AI extraction engines, and audit system rules
        </p>
      </div>

      {/* 1. Backend API & AI Engine Status */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Backend API & Engine Status</h3>
              <p className="text-xs text-slate-400">
                Connected Backend: <code className="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded font-mono text-[11px]">{ApiService.getBaseUrl()}</code>
              </p>
            </div>
          </div>

          <button
            onClick={checkBackend}
            disabled={isCheckingBackend}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Refresh backend status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backend Service</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                backendStatus?.status === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {backendStatus?.status === 'ok' ? 'ONLINE (0.0.0.0)' : 'STANDBY / OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {backendStatus?.status === 'ok'
                ? 'HTTP API connected and serving requests'
                : 'Local fallback active until backend server is started'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active AI Extractor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {backendStatus?.geminiConfigured ? 'GEMINI 1.5 FLASH' : 'GROUNDED LOCAL NLP'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {backendStatus?.geminiConfigured
                ? 'Google Gemini API key verified in backend environment.'
                : 'Running Intelligent Grounded Local Extractor (100% deterministic, zero hallucination).'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Security Architecture Note</span>
          </div>
          <p>
            Per production security standards, secret API keys such as <code className="text-indigo-300 font-mono text-[11px]">GEMINI_API_KEY</code> are managed exclusively on the backend server via environment variables (<code className="text-slate-300 font-mono text-[11px]">backend/.env</code>) and are never exposed to client-side code.
          </p>
        </div>
      </div>

      {/* 2. Demo Data & Persistence Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Management & Presets</h3>
            <p className="text-xs text-slate-400">
              Manage database records, reload test suites, or export audit files
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Reload Demo Data */}
          <button
            onClick={handleResetDemo}
            className="p-4 rounded-xl bg-slate-800/40 hover:bg-indigo-600/10 border border-slate-700/60 hover:border-indigo-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-indigo-300">
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>Reload Demo Data</span>
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                4 Meetings
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Restores the complete 4-meeting synthetic story with carry-overs, completions, and resolved issues.
            </p>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportBackup}
            className="p-4 rounded-xl bg-slate-800/40 hover:bg-cyan-600/10 border border-slate-700/60 hover:border-cyan-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-cyan-300">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export System Data</span>
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                JSON
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Download complete database with meetings, action items, decisions, and history links.
            </p>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-left cursor-pointer transition-all group">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import Backup File</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Restore a previously exported database backup from disk.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Clear Storage */}
          <button
            onClick={handleClearAll}
            className="p-4 rounded-xl bg-rose-950/10 hover:bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Clear All Records</span>
              </span>
            </div>
            <p className="text-[11px] text-rose-300/70 mt-1 leading-relaxed">
              Wipe all meetings, extracted items, and history points from storage.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Build Spec Compliance Reference */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>MeetFlow AI Build Specification Rules</span>
        </h3>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">•</span>
            <span><strong>Anti-Hallucination:</strong> If an owner or deadline is not explicitly supported by the transcript, it is set to null and flagged as ambiguous.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">•</span>
            <span><strong>Evidence Audit Trail:</strong> Every extracted item preserves its exact verbatim transcript sentence quote for instant audit verification.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">•</span>
            <span><strong>Cross-Meeting Carry-Over:</strong> Tasks and unresolved issues are reconciled across meetings to show status progressions from NEW → CARRIED-OVER → COMPLETED.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
