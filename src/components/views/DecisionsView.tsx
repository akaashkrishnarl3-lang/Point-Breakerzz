import React, { useState } from 'react';
import { Decision } from '../../types';
import { Sparkles, Calendar, Quote, Search, ShieldCheck } from 'lucide-react';

interface DecisionsViewProps {
  decisions: Decision[];
  onInspectItem: (item: Decision) => void;
  onViewMeeting?: (meetingId: string, evidenceHighlight?: string) => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  decisions,
  onInspectItem,
  onViewMeeting
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDecisions = decisions.filter(d =>
    d.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.meetingTitle && d.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    d.evidenceText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Decisions Register</h2>
          <p className="text-xs text-slate-400">
            Binding architectural, technical, and process commitments extracted from meeting transcripts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{decisions.length} Formal Decisions Logged</span>
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search formal decisions by keyword, engine, or meeting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Decisions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDecisions.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            No decisions match "{searchQuery}".
          </div>
        ) : (
          filteredDecisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => onInspectItem(dec)}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Decision</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{dec.meetingDate || 'Date'}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {dec.decision}
                </h3>

                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 italic font-serif leading-relaxed">
                  <span className="text-indigo-400 font-sans font-bold text-sm mr-1">“</span>
                  {dec.evidenceText}
                  <span className="text-indigo-400 font-sans font-bold text-sm ml-1">”</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[200px] text-slate-400">
                  {dec.meetingTitle}
                </span>

                <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold text-[11px]">
                  Inspect Audit Record →
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
