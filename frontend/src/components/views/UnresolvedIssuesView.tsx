import React, { useState } from 'react';
import { UnresolvedIssue } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { AlertCircle, Clock, CheckCircle2, GitBranch, Calendar, Search, Quote } from 'lucide-react';

interface UnresolvedIssuesViewProps {
  unresolved: UnresolvedIssue[];
  onInspectItem: (item: UnresolvedIssue) => void;
  onViewMeeting?: (meetingId: string, evidenceHighlight?: string) => void;
}

export const UnresolvedIssuesView: React.FC<UnresolvedIssuesViewProps> = ({
  unresolved,
  onInspectItem,
  onViewMeeting
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = unresolved.filter(u => {
    const matchesFilter = filterMode === 'ALL' || u.status === filterMode;
    const matchesSearch =
      u.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.owner && u.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.meetingTitle && u.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.evidenceText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Unresolved Issues & Blockers</h2>
          <p className="text-xs text-slate-400">
            Cross-meeting persistence tracker for open debates, unanswered questions, and pending approvals
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {(['ALL', 'UNRESOLVED', 'RESOLVED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === mode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'ALL' ? 'All Issues' : mode === 'UNRESOLVED' ? 'Active Open' : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search unresolved debates, owners, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            No unresolved issues match the filter criteria.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onInspectItem(issue)}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all duration-200 group space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={issue.status} size="sm" />
                    {issue.appearances && issue.appearances.length > 1 && (
                      <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>Persists across {issue.appearances.length} meetings</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                    {issue.issue}
                  </h3>
                </div>

                <div className="text-xs text-slate-400 shrink-0">
                  <span>Assigned: </span>
                  <strong className="text-slate-200">{issue.owner || 'Unassigned'}</strong>
                </div>
              </div>

              {/* Latest Quote */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 italic">
                <span className="text-amber-400 font-bold mr-1">“</span>
                {issue.evidenceText}
                <span className="text-amber-400 font-bold ml-1">”</span>
              </div>

              {/* Multi-meeting Appearances Strip */}
              {issue.appearances && issue.appearances.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Meeting Appearance Timeline:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {issue.appearances.map((app, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="truncate">{app.meetingTitle}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{app.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic line-clamp-1">
                          "{app.evidenceText}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
