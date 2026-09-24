import React from 'react';
import type { NavView } from './Sidebar';
import { PlusCircle, RotateCcw, AlertTriangle, LogOut, Sparkles } from 'lucide-react';
import type { SystemStats, User } from '../types';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onLoadDemo: () => void;
  stats: SystemStats;
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onLoadDemo,
  stats,
  user,
  onLogout
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
      subtitle: 'Configure backend engines, export audit records, and manage test data'
    }
  };

  const current = titles[currentView] || titles.dashboard;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B101B]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {(user?.is_demo || user?.isDemo) && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DEMO MODE</span>
          </div>
        )}

        {stats.overdueItems > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats.overdueItems} Overdue Item{stats.overdueItems > 1 ? 's' : ''}</span>
          </div>
        )}

        <button
          onClick={onLoadDemo}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm"
          title="Reload synthetic demo meetings"
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

        {/* User Profile & Logout Header Component */}
        {user && onLogout && (
          <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600/40 text-indigo-300 ring-1 ring-indigo-500/50 flex items-center justify-center font-bold text-xs">
                {userInitial}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-amber-400 font-medium leading-tight">
                {(user.is_demo || user.isDemo) ? 'Demo Mode' : user.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
