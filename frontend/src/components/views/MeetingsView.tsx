import React, { useState } from 'react';
import { Meeting } from '../../types';
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Sparkles, 
  AlertCircle, 
  Search, 
  ArrowRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import { NavView } from '../Sidebar';

interface MeetingsViewProps {
  meetings: Meeting[];
  onSelectMeeting: (meetingId: string) => void;
  onNavigate: (viewOrPath: string) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  onSelectMeeting,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Meeting Repository</h2>
          <p className="text-xs text-slate-400">
            {meetings.length} ingested meeting transcripts available for verification and cross-meeting accountability tracking
          </p>
        </div>

        <button
          onClick={() => onNavigate('/meetings/new')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/25"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingest New Meeting</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by meeting title, summary keyword, or participant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            No meetings found matching "{searchQuery}".
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => onSelectMeeting(meeting.id)}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {meeting.date}
                  </span>
                  <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    {meeting.participants.length} attendees
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {meeting.title}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {meeting.summary}
                </p>
              </div>

              {/* Footer Meta & Stats */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{meeting.actionItemsCount || 0} Actions</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{meeting.decisionsCount || 0} Decisions</span>
                  </span>
                  {(meeting.unresolvedCount || 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{meeting.unresolvedCount} Open</span>
                    </span>
                  )}
                </div>

                <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold inline-flex items-center gap-1 text-xs">
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
