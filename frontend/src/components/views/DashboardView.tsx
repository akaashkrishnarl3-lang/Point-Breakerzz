import React, { useState } from 'react';
import { 
  Meeting, 
  ActionItem, 
  UnresolvedIssue, 
  SystemStats, 
  ActionItemStatus 
} from '../../types';
import { StatusBadge } from '../StatusBadge';
import { 
  CheckCircle2, 
  ArrowRightLeft, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { NavView } from '../Sidebar';

interface DashboardViewProps {
  stats: SystemStats;
  meetings: Meeting[];
  actions: ActionItem[];
  unresolved: UnresolvedIssue[];
  onNavigate: (view: NavView) => void;
  onSelectMeeting: (meetingId: string) => void;
  onInspectItem: (item: ActionItem | UnresolvedIssue) => void;
  onLoadDemo?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  meetings,
  actions,
  unresolved,
  onNavigate,
  onSelectMeeting,
  onInspectItem,
  onLoadDemo
}) => {
  const [statusFilter, setStatusFilter] = useState<ActionItemStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter actions for the dashboard preview table
  const filteredActions = actions.filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = 
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.meetingTitle && item.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const overdueActions = actions.filter(a => a.status === 'OVERDUE');
  const openUnresolved = unresolved.filter(u => u.status === 'UNRESOLVED');

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Sample Demo Data Banner when empty */}
      {stats.totalMeetings === 0 && onLoadDemo && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Explore with Sample Meeting Data</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Load 3 realistic meetings to test cross-meeting accountability tracking, decisions, and unresolved blocker extraction.
              </p>
            </div>
          </div>
          <button
            onClick={onLoadDemo}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-md shadow-indigo-600/25 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Load Demo Data</span>
          </button>
        </div>
      )}
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Meetings */}
        <div 
          onClick={() => onNavigate('meetings')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Meetings</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.totalMeetings}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Historical logs</span>
          </div>
        </div>

        {/* Total Actions */}
        <div 
          onClick={() => onNavigate('tracker')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Action Items</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-2">{stats.totalActionItems}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% Grounded</div>
        </div>

        {/* Carried Over */}
        <div 
          onClick={() => {
            setStatusFilter('CARRIED_OVER');
          }}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Carried Over</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.carriedOverItems}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Cross-meeting</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => {
            setStatusFilter('COMPLETED');
          }}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{stats.completedItems}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified with quotes</div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => {
            setStatusFilter('OVERDUE');
          }}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{stats.overdueItems}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">Requires triage</div>
        </div>

        {/* Unresolved */}
        <div 
          onClick={() => onNavigate('unresolved')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Unresolved</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-2">{stats.unresolvedIssues}</div>
          <div className="text-[11px] text-amber-200/80 mt-1">Decisions pending</div>
        </div>
      </div>

      {/* Overdue Urgent Alert Banner */}
      {overdueActions.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{overdueActions.length} Action Item has Exceeded its Deadline</span>
                <span className="text-[10px] uppercase font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  Critical
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                "{overdueActions[0].task}" was scheduled for {overdueActions[0].deadline}, but no completion evidence has been presented in subsequent meetings.
              </p>
            </div>
          </div>
          <button
            onClick={() => onInspectItem(overdueActions[0])}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition-colors flex items-center justify-center gap-2"
          >
            <span>Audit Overdue Item</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Split: Action Items Table & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Action Items Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Active Accountability Items</h2>
              <p className="text-xs text-slate-400">Click any row to audit exact transcript quote and history</p>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'NEW', 'CARRIED_OVER', 'COMPLETED', 'OVERDUE'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, owners, or meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredActions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No action items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredActions.slice(0, 7).map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => onInspectItem(item)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-medium text-slate-200">
                          <div className="line-clamp-1 group-hover:text-indigo-300 transition-colors">
                            {item.task}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{item.meetingTitle}</span>
                            {item.history && item.history.length > 1 && (
                              <span className="text-amber-400 font-medium">
                                • {item.history.length} events
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {item.owner ? (
                            <span className="font-medium text-slate-200">{item.owner}</span>
                          ) : (
                            <span className="text-amber-400 italic">Not specified</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {item.deadline || <span className="italic">None</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium">
                            <span>Audit quote</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredActions.length > 7 && (
              <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center">
                <button
                  onClick={() => onNavigate('tracker')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>View all {filteredActions.length} action items in Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Meetings & Unresolved Issues (1 col) */}
        <div className="space-y-6">
          {/* Recent Meetings Card */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Recent Meetings</span>
              </h3>
              <button
                onClick={() => onNavigate('meetings')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {meetings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-800/20 border border-dashed border-slate-800 space-y-2">
                  <p>No meetings ingested yet.</p>
                  <button
                    onClick={() => onNavigate('new-meeting')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <span>Ingest your first meeting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                meetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting.id)}
                    className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 group-hover:text-indigo-300 line-clamp-1">
                        {meeting.title}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">{meeting.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {meeting.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                      <span>{meeting.participants.length} attendees</span>
                      <span>•</span>
                      <span className="text-indigo-400">Verifiable transcript</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Persistent Unresolved Issues Card */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Open Blockers & Issues</span>
              </h3>
              <button
                onClick={() => onNavigate('unresolved')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {openUnresolved.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  No active unresolved issues!
                </div>
              ) : (
                openUnresolved.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onInspectItem(issue)}
                    className="p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-amber-200 line-clamp-2">
                      {issue.issue}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-300/80">
                      <span>Owner: {issue.owner || 'Unassigned'}</span>
                      {issue.appearances && issue.appearances.length > 1 && (
                        <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {issue.appearances.length} meetings
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
