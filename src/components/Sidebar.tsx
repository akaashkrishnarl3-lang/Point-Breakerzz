import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  AlertCircle, 
  PlusCircle, 
  Settings, 
  ShieldCheck, 
  Database,
  RotateCcw
} from 'lucide-react';
import { SystemStats } from '../types';

export type NavView = 'dashboard' | 'meetings' | 'meeting-detail' | 'tracker' | 'decisions' | 'unresolved' | 'new-meeting' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  stats: SystemStats;
  onLoadDemo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  stats,
  onLoadDemo
}) => {
  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'meetings' as NavView, label: 'Meetings', icon: Calendar, badge: stats.totalMeetings },
    { id: 'tracker' as NavView, label: 'Action Tracker', icon: CheckSquare, badge: stats.totalActionItems },
    { id: 'decisions' as NavView, label: 'Decisions', icon: Sparkles, badge: null },
    { 
      id: 'unresolved' as NavView, 
      label: 'Unresolved Issues', 
      icon: AlertCircle, 
      badge: stats.unresolvedIssues > 0 ? stats.unresolvedIssues : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    { id: 'new-meeting' as NavView, label: 'New Meeting', icon: PlusCircle, isCta: true },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <aside className="w-64 bg-[#0B101B] border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="text-base font-bold text-white tracking-tight">
            MeetFlow AI
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'meetings' && currentView === 'meeting-detail');

          if (item.isCta) {
            return (
              <div key={item.id} className="pt-2 pb-1">
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                      : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Demo Quick Trigger for Hackathon Presentation */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Judge Quick Demo
            </span>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
              Spec 8
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Instantly populate the 4 synthetic meetings demonstrating cross-meeting carry-overs and completion.
          </p>
          <button
            onClick={onLoadDemo}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Demo Data</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Grounded Engine Active
          </span>
          <span>v1.0-prod</span>
        </div>
      </div>
    </aside>
  );
};
