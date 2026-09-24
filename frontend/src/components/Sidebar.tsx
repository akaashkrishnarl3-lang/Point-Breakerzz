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
  RotateCcw,
  LogOut
} from 'lucide-react';
import { SystemStats, User } from '../types';

export type NavView = 'dashboard' | 'meetings' | 'meeting-detail' | 'tracker' | 'decisions' | 'unresolved' | 'new-meeting' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  stats: SystemStats;
  onLoadDemo: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  stats,
  onLoadDemo,
  user,
  onLogout
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

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

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
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${item.badgeColor || 'bg-slate-800/80 text-slate-300 border-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Session & Footer Info Box */}
      <div className="p-3 border-t border-slate-800/80 space-y-3">
        {/* User Account Card */}
        {user && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50 flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-semibold text-white truncate" title={user.name}>
                    {user.name}
                  </div>
                  {(user.is_demo || user.isDemo) && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      DEMO MODE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={(user.is_demo || user.isDemo) ? 'Demo User • Demo Mode' : user.email}>
                  {(user.is_demo || user.isDemo) ? 'Demo User • Demo Mode' : user.email}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Demo Helper Box */}
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-indigo-400" />
              Demo Data
            </span>
          </div>
          <button
            onClick={onLoadDemo}
            className="w-full py-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Demo Data</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
