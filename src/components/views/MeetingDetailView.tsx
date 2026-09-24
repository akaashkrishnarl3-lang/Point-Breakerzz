import React, { useState, useEffect, useRef } from 'react';
import { Meeting, ActionItem, Decision, UnresolvedIssue } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Quote, 
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface MeetingDetailViewProps {
  meeting: Meeting;
  actions: ActionItem[];
  decisions: Decision[];
  unresolved: UnresolvedIssue[];
  initialHighlight?: string;
  onBack: () => void;
  onInspectItem: (item: ActionItem | Decision | UnresolvedIssue) => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meeting,
  actions,
  decisions,
  unresolved,
  initialHighlight,
  onBack,
  onInspectItem
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'decisions' | 'unresolved' | 'transcript'>('overview');
  const [highlightedSentence, setHighlightedSentence] = useState<string | null>(initialHighlight || null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialHighlight) {
      setHighlightedSentence(initialHighlight);
      setActiveTab('transcript');
    }
  }, [initialHighlight]);

  const handleHighlightInTranscript = (evidenceText: string) => {
    setHighlightedSentence(evidenceText);
    setActiveTab('transcript');
  };

  // Helper to render transcript with highlighted evidence
  const renderHighlightedTranscript = () => {
    if (!highlightedSentence) {
      return (
        <div className="text-xs md:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
          {meeting.transcript}
        </div>
      );
    }

    const cleanQuote = highlightedSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    const parts = meeting.transcript.split(new RegExp(`(${cleanQuote})`, 'gi'));

    return (
      <div className="text-xs md:text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.toLowerCase() === highlightedSentence.toLowerCase()) {
            return (
              <mark
                key={i}
                className="evidence-highlight-active inline-block font-semibold px-1 rounded transition-all duration-300"
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Meetings</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audited & Verifiable</span>
          </span>
        </div>
      </div>

      {/* Meeting Header Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#131B2E] border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">{meeting.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {meeting.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                {meeting.participants.join(', ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('transcript');
                setHighlightedSentence(null);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Transcript</span>
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Executive Summary
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{meeting.summary}</p>
        </div>

        {/* Quick Stats Pill Strip */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div 
            onClick={() => setActiveTab('actions')}
            className="p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-slate-300">Action Items</span>
            </div>
            <span className="text-sm font-bold text-white">{actions.length}</span>
          </div>

          <div 
            onClick={() => setActiveTab('decisions')}
            className="p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-slate-300">Decisions</span>
            </div>
            <span className="text-sm font-bold text-white">{decisions.length}</span>
          </div>

          <div 
            onClick={() => setActiveTab('unresolved')}
            className="p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Unresolved</span>
            </div>
            <span className="text-sm font-bold text-white">{unresolved.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'actions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>Action Items</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold">
            {actions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'decisions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>Decisions</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold">
            {decisions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('unresolved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'unresolved'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span>Unresolved Issues</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold">
            {unresolved.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'transcript'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Full Transcript</span>
          {highlightedSentence && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Items List */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Extracted Action Items ({actions.length})</span>
              </h3>
              <button
                onClick={() => setActiveTab('actions')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Expand
              </button>
            </div>

            <div className="space-y-3">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-white">{act.task}</div>
                    <StatusBadge status={act.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Owner: <strong className="text-slate-200">{act.owner || 'Ambiguous (Unassigned)'}</strong></span>
                    <span>Deadline: <strong className="text-slate-200">{act.deadline || 'None'}</strong></span>
                  </div>
                  <div className="pt-1 flex items-center justify-between border-t border-slate-700/40 text-[11px]">
                    <button
                      onClick={() => handleHighlightInTranscript(act.evidenceText)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Quote className="w-3 h-3" />
                      <span>Highlight transcript quote</span>
                    </button>
                    <button
                      onClick={() => onInspectItem(act)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>Full audit trail</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decisions & Unresolved Split */}
          <div className="space-y-6">
            {/* Decisions */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Decisions Made ({decisions.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('decisions')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Expand
                </button>
              </div>

              <div className="space-y-2.5">
                {decisions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No formal decisions recorded in this meeting.</p>
                ) : (
                  decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1.5"
                    >
                      <div className="font-semibold text-slate-200">{dec.decision}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-indigo-500/10">
                        <button
                          onClick={() => handleHighlightInTranscript(dec.evidenceText)}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Quote className="w-3 h-3" />
                          <span>View Quote</span>
                        </button>
                        <button
                          onClick={() => onInspectItem(dec)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          Audit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unresolved Issues */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Unresolved Issues ({unresolved.length})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('unresolved')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  Expand
                </button>
              </div>

              <div className="space-y-2.5">
                {unresolved.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No unresolved issues reported.</p>
                ) : (
                  unresolved.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1.5"
                    >
                      <div className="font-semibold text-amber-200">{issue.issue}</div>
                      <div className="flex items-center justify-between text-[11px] text-amber-300/80 pt-1 border-t border-amber-500/10">
                        <span>Owner: {issue.owner || 'Unassigned'}</span>
                        <button
                          onClick={() => handleHighlightInTranscript(issue.evidenceText)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Quote className="w-3 h-3" />
                          <span>View Quote</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTION ITEMS TAB */}
      {activeTab === 'actions' && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Action Items Grounded in Transcript</h3>
            <span className="text-xs text-slate-400">{actions.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence Quote</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <div>{act.task}</div>
                      {act.isAmbiguous && (
                        <span className="text-[10px] text-purple-400 italic">Ambiguity flagged: {act.ambiguityReason}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {act.owner || <span className="text-amber-400 italic">null (Unassigned)</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {act.deadline || <span className="italic">null (None)</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={act.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic text-[11px] max-w-sm truncate">
                      "{act.evidenceText}"
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleHighlightInTranscript(act.evidenceText)}
                        className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 text-[11px] font-semibold"
                      >
                        Highlight
                      </button>
                      <button
                        onClick={() => onInspectItem(act)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] font-semibold"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DECISIONS TAB */}
      {activeTab === 'decisions' && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Decisions Record</h3>
          <div className="space-y-3">
            {decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-bold text-white">{dec.decision}</span>
                  <button
                    onClick={() => handleHighlightInTranscript(dec.evidenceText)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Quote className="w-3 h-3" />
                    <span>View in Transcript</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  "{dec.evidenceText}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. UNRESOLVED ISSUES TAB */}
      {activeTab === 'unresolved' && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Unresolved Issues & Blockers</h3>
          <div className="space-y-3">
            {unresolved.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-bold text-amber-200">{issue.issue}</span>
                  <button
                    onClick={() => handleHighlightInTranscript(issue.evidenceText)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Quote className="w-3 h-3" />
                    <span>View in Transcript</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  "{issue.evidenceText}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FULL TRANSCRIPT WITH HIGHLIGHTING TAB */}
      {activeTab === 'transcript' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Source Transcript Audit Viewer</span>
              </h3>
              <p className="text-xs text-slate-400">
                Grounding contract: Every extracted accountability point corresponds directly to verbatim transcript lines.
              </p>
            </div>

            {highlightedSentence && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs text-amber-300">
                <Quote className="w-3 h-3" />
                <span>Active Evidence Highlight</span>
                <button
                  onClick={() => setHighlightedSentence(null)}
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div
            ref={transcriptRef}
            className="p-5 rounded-xl bg-[#090D16] border border-slate-800 max-h-[600px] overflow-y-auto space-y-2 select-text"
          >
            {renderHighlightedTranscript()}
          </div>
        </div>
      )}
    </div>
  );
};
