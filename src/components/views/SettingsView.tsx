import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { 
  Key, 
  Database, 
  RotateCcw, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setSaveStatus('Gemini API key saved! Live cloud extraction enabled.');
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
      setSaveStatus('API key removed. Grounded Local Extractor will handle all meetings.');
    }
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleResetDemo = () => {
    StorageService.resetToDemo();
    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch {}
    onDataReset();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all meeting records?')) {
      StorageService.clearAll();
      onDataReset();
    }
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meetflow_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = StorageService.importBackup(text);
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
          Configure AI extraction engines, manage demo datasets, and audit system rules
        </p>
      </div>

      {/* 1. AI Engine Config */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Google Gemini API Configuration</h3>
            <p className="text-xs text-slate-400">
              Optional: Connect your Google Gemini API key for cloud extraction. If blank, the intelligent local engine runs offline.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
          {saveStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Engine: {apiKey ? 'Dual-Hybrid (Gemini Cloud + Local Fallback)' : 'Local Grounded NLP Extractor (Offline Active)'}</span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* 2. Demo Data & Persistence Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Management & Hackathon Presets</h3>
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
              Download complete local database with meetings, action items, decisions, and history links.
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
              Wipe all meetings, extracted items, and history points from local storage.
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
