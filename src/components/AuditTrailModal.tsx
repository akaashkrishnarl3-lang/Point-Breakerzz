import React from 'react';
import { ActionItem, Decision, UnresolvedIssue } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, ExternalLink, ShieldCheck, Clock, Quote, AlertOctagon, GitBranch } from 'lucide-react';

interface AuditTrailModalProps {
  item: ActionItem | Decision | UnresolvedIssue | null;
  onClose: () => void;
  onViewMeeting?: (meetingId: string, evidenceHighlight?: string) => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  item,
  onClose,
  onViewMeeting
}) => {
  if (!item) return null;

  const isActionItem = 'task' in item;
  const isDecision = 'decision' in item;
  const isUnresolved = 'issue' in item;

  const title = isActionItem ? item.task : isDecision ? item.decision : item.issue;
  const itemType = isActionItem ? 'Action Item' : isDecision ? 'Decision' : 'Unresolved Issue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0F172A] border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {itemType} Audit Trail
                </span>
                {isActionItem && <StatusBadge status={item.status} size="sm" />}
                {isUnresolved && <StatusBadge status={item.status} size="sm" />}
              </div>
              <h3 className="text-lg font-bold text-white line-clamp-1">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="text-xs text-slate-400 font-medium">Source Meeting</div>
              <div className="text-sm font-semibold text-slate-200 truncate mt-0.5">
                {item.meetingTitle || 'Sprint Meeting'}
              </div>
            </div>

            {isActionItem && (
              <>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="text-xs text-slate-400 font-medium">Owner</div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    {item.owner || (
                      <span className="text-amber-400 italic font-normal">Not specified (Ambiguous)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="text-xs text-slate-400 font-medium">Deadline</div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    {item.deadline || (
                      <span className="text-slate-400 italic font-normal">None specified</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {isActionItem && (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 col-span-2 md:col-span-1">
                <div className="text-xs text-slate-400 font-medium">Grounding Confidence</div>
                <div className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {Math.round(item.confidence * 100)}% Grounded
                </div>
              </div>
            )}
          </div>

          {/* Ambiguity Alert if applicable */}
          {isActionItem && item.isAmbiguous && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-purple-300">Ambiguous Accountability Flagged</div>
                <div className="text-xs text-purple-200/80 mt-1">
                  {item.ambiguityReason || 'Owner or deadline is unverified. Under AntiGravity rules, missing fields are preserved as null.'}
                </div>
              </div>
            </div>
          )}

          {/* Verbatim Supporting Evidence (The Core Spec Grounding requirement) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-indigo-400" />
                Supporting Transcript Evidence (Verbatim)
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Audited & Grounded
              </span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 relative text-slate-200 italic font-serif leading-relaxed text-sm">
              <span className="text-indigo-400 font-sans font-bold text-lg leading-none mr-1">“</span>
              {item.evidenceText}
              <span className="text-indigo-400 font-sans font-bold text-lg leading-none ml-1">”</span>
            </div>
          </div>

          {/* Cross-Meeting Timeline History */}
          {isActionItem && item.history && item.history.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Cross-Meeting Status Progression ({item.history.length} events)
              </span>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                {item.history.map((h, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-400 group-hover:scale-125 transition-transform" />
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-semibold text-slate-300">
                          {h.meetingTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{h.date}</span>
                          <StatusBadge status={h.status} size="sm" />
                        </div>
                      </div>
                      <div className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                        "{h.evidenceText}"
                      </div>
                      {h.note && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {h.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unresolved Issue Appearances */}
          {isUnresolved && item.appearances && item.appearances.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                Multi-Meeting Persistence ({item.appearances.length} meetings)
              </span>
              <div className="space-y-2">
                {item.appearances.map((app, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-300">
                      <span>{app.meetingTitle}</span>
                      <span className="text-slate-400 font-normal">{app.date}</span>
                    </div>
                    <div className="text-slate-300 italic bg-slate-900/50 p-2 rounded">
                      "{app.evidenceText}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {onViewMeeting && item.meetingId && (
            <button
              onClick={() => {
                onClose();
                onViewMeeting(item.meetingId, item.evidenceText);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>View in Source Transcript</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
