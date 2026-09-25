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
  LogOut,
  BarChart3,
  Quote,
  MessageSquare,
  FileAudio
} from 'lucide-react';
import { SystemStats, User } from '../types';
import type { NavView } from '../utils/router';

export type { NavView };

interface SidebarProps {
  currentView: NavView;
  currentPath?: string;
  onNavigate: (pathOrView: string) => void;
  stats: SystemStats;
  onLoadDemo: () => void;
  user: User | null;
  onLogout: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: NavView;
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
    badgeColor?: string;
    isCta?: boolean;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentPath,
  onNavigate,
  stats,
  onLoadDemo,
  user,
  onLogout
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Core Operations',
      items: [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'meetings', path: '/meetings', label: 'Meeting History', icon: Calendar, badge: stats.totalMeetings },
        { id: 'tracker', path: '/accountability', label: 'Accountability Tracker', icon: CheckSquare, badge: stats.totalActionItems },
        { id: 'analytics', path: '/analytics', label: 'Meeting Analytics', icon: BarChart3, badge: null }
      ]
    },
    {
      title: 'AI Intelligence & Evidence',
      items: [
        { id: 'evidence', path: '/evidence', label: 'Evidence Explorer', icon: Quote, badge: null },
        { id: 'ask-meeting', path: '/ask-meeting', label: 'Ask About Meeting', icon: MessageSquare, badge: null },
        { id: 'decisions', path: '/decisions', label: 'Decisions Register', icon: Sparkles, badge: null },
        { 
          id: 'unresolved', 
          path: '/unresolved', 
          label: 'Unresolved Issues', 
          icon: AlertCircle, 
          badge: stats.unresolvedIssues > 0 ? stats.unresolvedIssues : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }
      ]
    },
    {
      title: 'Ingestion & Tools',
      items: [
        { id: 'new-meeting', path: '/meetings/new', label: 'New Meeting', icon: PlusCircle, isCta: true },
        { id: 'audio-transcript', path: '/audio-transcript', label: 'Audio → Transcript', icon: FileAudio, badge: null },
        { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, badge: null }
      ]
    }
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  const isItemActive = (item: { id: NavView; path: string }) => {
    if (currentPath) {
      if (item.path === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) return true;
      if (item.path === '/meetings/new' && currentPath === '/meetings/new') return true;
      if (item.path === '/audio-transcript' && currentPath === '/audio-transcript') return true;
      if (item.path === '/evidence' && (currentPath === '/evidence' || currentPath.includes('tab=evidence'))) return true;
      if (item.path === '/ask-meeting' && (currentPath === '/ask-meeting' || currentPath.includes('tab=ask'))) return true;
      if (item.path === '/accountability' && (currentPath === '/accountability' || currentPath === '/action-items')) return true;
      if (item.path === '/analytics' && currentPath === '/analytics') return true;
      if (item.path === '/decisions' && currentPath === '/decisions') return true;
      if (item.path === '/unresolved' && currentPath === '/unresolved') return true;
      if (item.path === '/settings' && currentPath === '/settings') return true;
      if (item.path === '/meetings' && currentPath.startsWith('/meetings') && !currentPath.includes('/new') && !currentPath.includes('tab=evidence') && !currentPath.includes('tab=ask')) return true;
    }
    return currentView === item.id;
  };

  return (
    <aside className="w-64 bg-[#0B101B] border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div 
        onClick={() => onNavigate('/dashboard')} 
        className="p-5 border-b border-slate-800/80 cursor-pointer group transition-colors hover:bg-slate-900/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight leading-tight">
              MeetFlow AI
            </div>
            <div className="text-[10px] text-indigo-400 font-semibold tracking-wide">
              HTH-GA-03 Audit Engine
            </div>
          </div>
        </div>
      </div>

      {/* Nav List with Sections */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">
              {section.title}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              if (item.isCta) {
                return (
                  <div key={item.id} className="pt-1 pb-1">
                    <button
                      onClick={() => onNavigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
                        active
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
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${item.badgeColor || 'bg-slate-800/80 text-slate-300 border-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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
                      DEMO
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={(user.is_demo || user.isDemo) ? 'Demo User • Demo Mode' : user.email}>
                  {(user.is_demo || user.isDemo) ? 'Demo Mode' : user.email}
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

export default Sidebar;
