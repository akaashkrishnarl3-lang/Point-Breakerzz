import React, { useState } from 'react';
import { ActionItem, ActionItemStatus, Meeting } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Download, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  ArrowRightLeft, 
  AlertTriangle, 
  Quote, 
  ExternalLink,
  GitBranch
} from 'lucide-react';

interface ActionTrackerViewProps {
  actions: ActionItem[];
  meetings: Meeting[];
  onInspectItem: (item: ActionItem) => void;
  onViewMeeting?: (meetingId: string, evidenceHighlight?: string) => void;
}

export const ActionTrackerView: React.FC<ActionTrackerViewProps> = ({
  actions,
  meetings,
  onInspectItem,
  onViewMeeting
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ActionItemStatus | 'ALL'>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [meetingFilter, setMeetingFilter] = useState<string>('ALL');

  // Derive distinct owners
  const uniqueOwners = Array.from(
    new Set(actions.map(a => a.owner).filter((o): o is string => Boolean(o)))
  ).sort();

  // Filter actions
  const filteredActions = actions.filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesOwner = ownerFilter === 'ALL' || item.owner === ownerFilter;
    const matchesMeeting = meetingFilter === 'ALL' || item.meetingId === meetingFilter;
    const matchesSearch =
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.meetingTitle && item.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.evidenceText.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesOwner && matchesMeeting && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Task', 'Owner', 'Deadline', 'Status', 'Meeting', 'Evidence Text', 'History Points'];
    const rows = filteredActions.map(a => [
      `"${a.task.replace(/"/g, '""')}"`,
      `"${(a.owner || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(a.deadline || 'None').replace(/"/g, '""')}"`,
      a.status,
      `"${(a.meetingTitle || '').replace(/"/g, '""')}"`,
      `"${a.evidenceText.replace(/"/g, '""')}"`,
      a.history?.length || 1
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `accountability_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kanban groups
  const kanbanColumns: { status: ActionItemStatus; title: string; count: number; border: string; bg: string }[] = [
    { 
      status: 'NEW', 
      title: 'New Commitments', 
      count: filteredActions.filter(a => a.status === 'NEW').length,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5'
    },
    { 
      status: 'CARRIED_OVER', 
      title: 'Carried Over', 
      count: filteredActions.filter(a => a.status === 'CARRIED_OVER').length,
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5'
    },
    { 
      status: 'COMPLETED', 
      title: 'Completed', 
      count: filteredActions.filter(a => a.status === 'COMPLETED').length,
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/5'
    },
    { 
      status: 'OVERDUE', 
      title: 'Overdue Items', 
      count: filteredActions.filter(a => a.status === 'OVERDUE').length,
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/5'
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Accountability Tracker</h2>
          <p className="text-xs text-slate-400">
            Cross-meeting progress matrix with historical carry-over reconciliation and verbatim transcript citations
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task, owner, quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses ({actions.length})</option>
            <option value="NEW">New Commitments</option>
            <option value="CARRIED_OVER">Carried-Over</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="AMBIGUOUS">Ambiguous</option>
          </select>
        </div>

        {/* Owner Filter */}
        <div className="space-y-1">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Owners ({uniqueOwners.length})</option>
            {uniqueOwners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>

        {/* Meeting Filter */}
        <div className="space-y-1">
          <select
            value={meetingFilter}
            onChange={(e) => setMeetingFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 truncate"
          >
            <option value="ALL">All Ingested Meetings ({meetings.length})</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW: TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Task Description</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Origin Meeting</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">History</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No accountability items match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onInspectItem(item)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs">
                        <div className="group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {item.task}
                        </div>
                        {item.isAmbiguous && (
                          <div className="text-[10px] text-purple-400 italic mt-0.5">
                            Ambiguous: {item.ambiguityReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {item.owner ? (
                          <span className="font-semibold text-white">{item.owner}</span>
                        ) : (
                          <span className="text-amber-400 italic">null (Unassigned)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {item.deadline || <span className="italic">null</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap max-w-[160px] truncate">
                        {item.meetingTitle || 'Meeting'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.history && item.history.length > 1 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                            <GitBranch className="w-3 h-3" />
                            <span>{item.history.length} events</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">1 event</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectItem(item);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold transition-colors"
                        >
                          Audit Trail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const itemsInCol = filteredActions.filter(a => a.status === col.status);
            return (
              <div
                key={col.status}
                className={`p-4 rounded-2xl bg-slate-900/60 border ${col.border} flex flex-col space-y-3 min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {itemsInCol.length}
                  </span>
                </div>

                {/* Items Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {itemsInCol.length === 0 ? (
                    <div className="text-xs text-slate-500 italic text-center py-8">
                      No items in this status
                    </div>
                  ) : (
                    itemsInCol.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onInspectItem(item)}
                        className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer transition-all space-y-2 shadow-sm group"
                      >
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {item.task}
                        </div>

                        <div className="text-[11px] text-slate-400 italic bg-slate-900/70 p-2 rounded border border-slate-800/80 line-clamp-2">
                          "{item.evidenceText}"
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                          <span className="font-medium text-slate-300">
                            {item.owner || 'Unassigned'}
                          </span>
                          <span>{item.deadline || 'No deadline'}</span>
                        </div>

                        {item.history && item.history.length > 1 && (
                          <div className="text-[10px] text-amber-300 flex items-center gap-1 font-semibold">
                            <GitBranch className="w-3 h-3" />
                            <span>Progression: {item.history.map(h => h.status).join(' → ')}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
