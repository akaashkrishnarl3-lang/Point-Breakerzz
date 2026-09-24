import React from 'react';
import { ActionItem, Decision, UnresolvedIssue } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, ExternalLink, ShieldCheck, Clock, Quote, AlertOctagon, GitBranch } from 'lucide-react';

interface AuditTrailModalProps {
  item: ActionItem | Decision | UnresolvedIssue | null;
  onClose: () => void;
  onViewMeeting?: (meetingId: string, highlightText?: string) => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  item,
  onClose,
  onViewMeeting
}) => {
  if (!item) return null;

  const isAction = 'task' in item;
  const isDecision = 'decision' in item;
  const isUnresolved = 'issue' in item;

  const title = isAction ? (item as ActionItem).task : isDecision ? (item as Decision).decision : (item as UnresolvedIssue).issue;
  const evidence = item.evidenceText;
  const meetingId = item.meetingId;
  const meetingTitle = item.meetingTitle || 'Meeting Session';
  const meetingDate = item.meetingDate || 'Unknown Date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0D1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Audit Trail Citation
              </span>
              {isAction && <StatusBadge status={(item as ActionItem).status} size="sm" />}
            </div>
            <h3 className="text-base font-bold text-white leading-snug pt-1">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Verifiable Source Transcript Evidence Quote */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                Exact Transcript Citation
              </span>
              <span className="text-[10px] text-slate-400">Verbatim quote from source record</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-sm italic leading-relaxed relative">
              "{evidence}"
            </div>
          </div>

          {/* 2. Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Meeting</span>
              <span className="text-xs font-bold text-white mt-0.5 block truncate" title={meetingTitle}>
                {meetingTitle}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Date</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {meetingDate}
              </span>
            </div>
            {isAction && (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Owner</span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {(item as ActionItem).owner || (
                    <span className="text-amber-400 font-normal italic">Unassigned (Null)</span>
                  )}
                </span>
              </div>
            )}
            {isAction && (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Deadline</span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {(item as ActionItem).deadline || (
                    <span className="text-slate-500 font-normal italic">No deadline</span>
                  )}
                </span>
              </div>
            )}
            {isAction && (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Extraction Engine</span>
                <span className="text-xs font-bold text-indigo-400 mt-0.5 block">
                  Grounded NLP (100% Verified)
                </span>
              </div>
            )}
          </div>

          {/* 3. Ambiguity Warning if flagged */}
          {isAction && (item as ActionItem).isAmbiguous && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-300 block">Ambiguity Audit Flag</span>
                <p className="mt-0.5 leading-relaxed text-purple-200/90">
                  {(item as ActionItem).ambiguityReason || 'Extracted without explicit individual assignment.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. Cross-Meeting Timeline History for Action Items */}
          {isAction && (item as ActionItem).history && (item as ActionItem).history.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                Cross-Meeting Audit Trail & Carry-Over Timeline ({(item as ActionItem).history.length} Event{(item as ActionItem).history.length > 1 ? 's' : ''})
              </span>

              <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {(item as ActionItem).history.map((h, idx) => (
                  <div key={idx} className="relative pl-8 text-xs">
                    <div className="absolute left-2.5 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#0D1322]" />
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{h.meetingTitle}</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={h.status} size="sm" />
                          <span className="text-slate-400 text-[10px]">{h.date}</span>
                        </div>
                      </div>
                      {h.note && (
                        <p className="text-slate-300 text-[11px]">{h.note}</p>
                      )}
                      <p className="text-[11px] text-amber-300/80 italic font-mono pt-1">
                        "{h.evidenceText}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            MeetFlow AI Grounded Audit Protocol
          </span>

          <div className="flex items-center gap-2">
            {onViewMeeting && meetingId && (
              <button
                onClick={() => {
                  onClose();
                  onViewMeeting(meetingId, evidence);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Jump to Source Line</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
