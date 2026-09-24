import React from 'react';
import { NavView } from './Sidebar';
import { PlusCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SystemStats } from '../types';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onLoadDemo: () => void;
  stats: SystemStats;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onLoadDemo,
  stats
}) => {
  const titles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Accountability Dashboard',
      subtitle: 'Real-time overview of extracted commitments, cross-meeting status, and audit citations'
    },
    meetings: {
      title: 'Meeting Sessions',
      subtitle: 'Historical meeting repository with verifiable transcripts and extracted facts'
    },
    'meeting-detail': {
      title: 'Meeting Evidence Inspector',
      subtitle: 'Verifiable audit trail linking decisions, tasks, and issues directly to transcript lines'
    },
    tracker: {
      title: 'Accountability & Carry-Over Tracker',
      subtitle: 'Comprehensive matrix of tasks across all meetings with carry-over and completion history'
    },
    decisions: {
      title: 'Decision Register',
      subtitle: 'Formal architectural, technical, and process decisions with quoted evidence'
    },
    unresolved: {
      title: 'Unresolved Issues & Blockers',
      subtitle: 'Tracking persistent open questions and undecided topics across sprints'
    },
    'new-meeting': {
      title: 'Ingest New Meeting',
      subtitle: 'Upload or paste meeting transcripts for grounded zero-hallucination extraction'
    },
    settings: {
      title: 'System Settings & Engine Config',
      subtitle: 'Configure Gemini API keys, export audit records, and manage test data'
    }
  };

  const current = titles[currentView] || titles.dashboard;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B101B]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {stats.overdueItems > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats.overdueItems} Overdue Item{stats.overdueItems > 1 ? 's' : ''}</span>
          </div>
        )}

        <button
          onClick={onLoadDemo}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm"
          title="Reload the 4 synthetic demo meetings"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Load Demo Data</span>
        </button>

        {currentView !== 'new-meeting' && (
          <button
            onClick={() => onNavigate('new-meeting')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Meeting</span>
          </button>
        )}
      </div>
    </header>
  );
};
