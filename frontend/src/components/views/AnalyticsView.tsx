import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/api';
import { MeetingAnalytics, FilterOptions, Meeting, ActionItemStatus } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Users, 
  Filter, 
  PieChart, 
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  Activity
} from 'lucide-react';

interface AnalyticsViewProps {
  meetings: Meeting[];
  onSelectMeeting?: (meetingId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ meetings, onSelectMeeting }) => {
  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Extract unique owners from meeting data for filter dropdown
  const uniqueOwners = useMemo(() => {
    if (!analytics?.ownersBreakdown) return [];
    return analytics.ownersBreakdown.map(o => o.owner).filter(Boolean);
  }, [analytics]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalStart = startDate;
      let finalEnd = endDate;

      if (dateRangePreset === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        finalStart = d.toISOString().split('T')[0];
        finalEnd = new Date().toISOString().split('T')[0];
      } else if (dateRangePreset === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        finalStart = d.toISOString().split('T')[0];
        finalEnd = new Date().toISOString().split('T')[0];
      }

      const filters: FilterOptions = {
        meetingId: selectedMeetingId || undefined,
        owner: selectedOwner || undefined,
        status: (selectedStatus !== 'ALL' ? (selectedStatus as ActionItemStatus) : undefined),
        startDate: finalStart || undefined,
        endDate: finalEnd || undefined
      };

      const data = await ApiService.getMeetingAnalytics(filters);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load meeting analytics:', err);
      setError(err?.message || 'Failed to fetch analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMeetingId, selectedOwner, selectedStatus, dateRangePreset, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedMeetingId('');
    setSelectedOwner('');
    setSelectedStatus('ALL');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Module 3 • Real Analytics
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              100% Database Grounded
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Meeting Health & Accountability Analytics
          </h2>
          <p className="text-sm text-slate-400">
            Real-time commitment health, cross-meeting carry-over trends, and accountability metrics computed directly from database records.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Dynamic Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            Dynamic Analytics Filters
          </span>
          {(selectedMeetingId || selectedOwner || selectedStatus !== 'ALL' || dateRangePreset !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter 1: Meeting */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Meeting</label>
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">All Meetings ({meetings.length})</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.date})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Owner */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Assignee / Owner</label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">All Owners</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CARRIED_OVER">Carried-Over</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="AMBIGUOUS">Ambiguous</option>
            </select>
          </div>

          {/* Filter 4: Date Range Preset */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Date Range</label>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Recorded Dates</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRangePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && analytics && analytics.totalMeetings === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Meeting Data Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No meetings match the selected filter criteria. Try clearing your filters or ingest a new meeting transcript.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* 10 Core Metrics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* 1. Total Meetings */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              1. Total Meetings
            </span>
            <div className="text-2xl font-bold text-white">{analytics.totalMeetings}</div>
            <div className="text-[10px] text-slate-500">In database scope</div>
          </div>

          {/* 2. Total Action Items */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              2. Total Action Items
            </span>
            <div className="text-2xl font-bold text-white">{analytics.totalActionItems}</div>
            <div className="text-[10px] text-indigo-400">Extracted & tracked</div>
          </div>

          {/* 3. Completed Items */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 hover:border-emerald-500/40 transition-all">
            <span className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              3. Completed
            </span>
            <div className="text-2xl font-bold text-emerald-300">{analytics.completedItems}</div>
            <div className="text-[10px] text-emerald-400/70">Verified in transcript</div>
          </div>

          {/* 4. In Progress Items */}
          <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/20 space-y-1.5 hover:border-sky-500/40 transition-all">
            <span className="text-[11px] font-semibold uppercase text-sky-400 tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3" />
              4. In Progress
            </span>
            <div className="text-2xl font-bold text-sky-300">{analytics.inProgressItems}</div>
            <div className="text-[10px] text-sky-400/70">Actively being worked</div>
          </div>

          {/* 5. Carried-over Items */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1.5 hover:border-amber-500/40 transition-all">
            <span className="text-[11px] font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" />
              5. Carried-Over
            </span>
            <div className="text-2xl font-bold text-amber-300">{analytics.carriedOverItems}</div>
            <div className="text-[10px] text-amber-400/70">Pushed across meetings</div>
          </div>

          {/* 6. Overdue Items */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1.5 hover:border-rose-500/40 transition-all">
            <span className="text-[11px] font-semibold uppercase text-rose-400 tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              6. Overdue
            </span>
            <div className="text-2xl font-bold text-rose-300">{analytics.overdueItems}</div>
            <div className="text-[10px] text-rose-400/70">Missed deadlines</div>
          </div>

          {/* 7. Unresolved Issues */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1.5 hover:border-purple-500/40 transition-all">
            <span className="text-[11px] font-semibold uppercase text-purple-400 tracking-wider">
              7. Unresolved Issues
            </span>
            <div className="text-2xl font-bold text-purple-300">{analytics.unresolvedIssues}</div>
            <div className="text-[10px] text-purple-400/70">Unresolved blockers</div>
          </div>

          {/* 8. Completion Rate */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/30 space-y-1.5 hover:border-indigo-500/50 transition-all">
            <span className="text-[11px] font-semibold uppercase text-indigo-300 tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              8. Completion Rate
            </span>
            <div className="text-2xl font-bold text-indigo-200">{analytics.completionRate}%</div>
            <div className="text-[10px] text-indigo-400">Of non-open items</div>
          </div>

          {/* 9. Avg Actions per Meeting */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              9. Actions / Meeting
            </span>
            <div className="text-2xl font-bold text-white">{analytics.averageActionItemsPerMeeting}</div>
            <div className="text-[10px] text-slate-500">Average density</div>
          </div>

          {/* 10. Meetings with Unresolved Commitments */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-all">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              10. Unresolved Commitments
            </span>
            <div className="text-2xl font-bold text-amber-300">
              {analytics.meetingsWithUnresolvedCommitments.length}
            </div>
            <div className="text-[10px] text-amber-400/70">Meetings needing follow-up</div>
          </div>
        </div>
      )}

      {/* Visualizations Section */}
      {analytics && analytics.totalMeetings > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Status Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span>Action Item Status Distribution</span>
              </h3>
              <span className="text-xs text-slate-400">{analytics.totalActionItems} total items</span>
            </div>

            {/* Distribution Multi-Bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-800">
              {analytics.statusDistribution.map((item, idx) => {
                if (item.count === 0) return null;
                return (
                  <div
                    key={idx}
                    title={`${item.label}: ${item.count} (${item.percentage}%)`}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                    className="h-full transition-all duration-500"
                  />
                );
              })}
            </div>

            {/* Distribution Legend List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {analytics.statusDistribution.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white">
                    {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Completed vs Pending vs Overdue */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Completed vs Pending vs Overdue</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-400">
                {analytics.completionRate}% Completion Rate
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Completed Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400 font-medium">Completed ({analytics.completedVsPending.completed})</span>
                  <span className="text-slate-400">
                    {analytics.totalActionItems > 0 ? Math.round((analytics.completedVsPending.completed / analytics.totalActionItems) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${analytics.totalActionItems > 0 ? (analytics.completedVsPending.completed / analytics.totalActionItems) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Pending / Active Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-medium">Pending / Carried-Over ({analytics.completedVsPending.pending})</span>
                  <span className="text-slate-400">
                    {analytics.totalActionItems > 0 ? Math.round((analytics.completedVsPending.pending / analytics.totalActionItems) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${analytics.totalActionItems > 0 ? (analytics.completedVsPending.pending / analytics.totalActionItems) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Overdue Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-rose-400 font-medium">Overdue Deadlines ({analytics.completedVsPending.overdue})</span>
                  <span className="text-slate-400">
                    {analytics.totalActionItems > 0 ? Math.round((analytics.completedVsPending.overdue / analytics.totalActionItems) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${analytics.totalActionItems > 0 ? (analytics.completedVsPending.overdue / analytics.totalActionItems) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 flex items-center justify-between">
              <span>Accountability Index</span>
              <span className="font-bold text-white">
                {analytics.completedItems} / {analytics.totalActionItems} tasks fulfilled
              </span>
            </div>
          </div>

          {/* Chart 3: Action Items per Meeting Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Action Items by Meeting</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.actionItemsByMeeting.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectMeeting?.(item.meetingId)}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold">
                      {item.total} total
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-medium">
                      {item.completed} completed
                    </span>
                    {item.carriedOver > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-medium">
                        {item.carriedOver} carried-over
                      </span>
                    )}
                    {item.overdue > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-medium">
                        {item.overdue} overdue
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 4: Owners Accountability & Fulfillment Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Owner Commitment & Fulfillment Breakdown</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.ownersBreakdown.map((ownerData, idx) => {
                const ownerCompletionPct = ownerData.total > 0 ? Math.round((ownerData.completed / ownerData.total) * 100) : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        {ownerData.owner}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {ownerCompletionPct}% completed
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                        style={{ width: `${ownerCompletionPct}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Total: <strong className="text-white">{ownerData.total}</strong></span>
                      <span>Done: <strong className="text-emerald-400">{ownerData.completed}</strong></span>
                      <span>In Progress: <strong className="text-sky-400">{ownerData.inProgress}</strong></span>
                      {ownerData.overdue > 0 && (
                        <span>Overdue: <strong className="text-rose-400">{ownerData.overdue}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Meetings with Unresolved Commitments Section */}
      {analytics && analytics.meetingsWithUnresolvedCommitments.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Meetings with Unresolved Commitments ({analytics.meetingsWithUnresolvedCommitments.length})</span>
            </h3>
            <span className="text-xs text-amber-400/80">Requires leadership review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.meetingsWithUnresolvedCommitments.map((m, idx) => (
              <div
                key={idx}
                onClick={() => onSelectMeeting?.(m.meetingId)}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/50 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">{m.title}</span>
                  <span className="text-[10px] text-slate-400">{m.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {m.unresolvedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {m.unresolvedCount} unresolved blockers
                    </span>
                  )}
                  {m.overdueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {m.overdueCount} overdue actions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
