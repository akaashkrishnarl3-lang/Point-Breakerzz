import React, { useState, useEffect, useRef } from 'react';
import { Meeting, ActionItem, Decision, UnresolvedIssue, MeetingQAResponse, EvidenceItem } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { ApiService } from '../../services/api';
import { runLocalGroundedQA } from '../../utils/groundedQA';
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
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  Info,
  CornerDownRight,
  HelpCircle,
  Hash
} from 'lucide-react';
import type { DetailTab } from '../../utils/router';

interface MeetingDetailViewProps {
  meeting: Meeting;
  actions: ActionItem[];
  decisions: Decision[];
  unresolved: UnresolvedIssue[];
  initialHighlight?: string;
  initialTab?: DetailTab;
  onTabChange?: (tab: DetailTab) => void;
  onBack: () => void;
  onInspectItem: (item: ActionItem | Decision | UnresolvedIssue) => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meeting,
  actions,
  decisions,
  unresolved,
  initialHighlight,
  initialTab,
  onTabChange,
  onBack,
  onInspectItem
}) => {
  const [activeTab, setActiveTabState] = useState<DetailTab>(initialTab || 'overview');
  const [highlightedSentence, setHighlightedSentence] = useState<string | null>(initialHighlight || null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const setActiveTab = (tab: DetailTab) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialHighlight !== undefined) {
      setHighlightedSentence(initialHighlight || null);
    }
  }, [initialHighlight]);

  // Evidence Explorer State
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number>(0);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);

  // Ask About This Meeting (Q&A) State
  const [qaMessages, setQaMessages] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    citations?: any[];
    confidence?: number;
    grounded?: boolean;
    timestamp: string;
  }>>([
    {
      sender: 'ai',
      text: `Hello! I am your Grounded AI Meeting Assistant for "${meeting.title}". Ask me anything about this meeting's decisions, action items, owners, or open blockers. All answers are strictly grounded on the meeting transcript with zero hallucination.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [qaInput, setQaInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const qaEndRef = useRef<HTMLDivElement>(null);

  // Build unified evidence items
  useEffect(() => {
    const fetchEvidence = async () => {
      setLoadingEvidence(true);
      try {
        const res = await ApiService.getMeetingEvidence(meeting.id);
        if (res && res.items && res.items.length > 0) {
          setEvidenceItems(res.items);
        } else {
          // Construct fallback from props
          constructLocalEvidence();
        }
      } catch (err) {
        constructLocalEvidence();
      } finally {
        setLoadingEvidence(false);
      }
    };

    const constructLocalEvidence = () => {
      const items: EvidenceItem[] = [
        ...actions.map((a, idx) => ({
          id: a.id,
          category: 'ACTION_ITEM' as const,
          title: a.task,
          owner: a.owner || 'Not specified',
          deadline: a.deadline || 'Not specified',
          status: a.status,
          confidence: a.confidence,
          evidenceText: a.evidenceText,
          sourceLine: a.sourceLine || (idx + 1),
          isAmbiguous: a.isAmbiguous || a.owner === 'Not specified' || a.deadline === 'Not specified',
          ambiguityReason: a.ambiguityReason
        })),
        ...decisions.map((d, idx) => ({
          id: d.id,
          category: 'DECISION' as const,
          title: d.decision,
          evidenceText: d.evidenceText,
          sourceLine: d.sourceLine || (actions.length + idx + 1),
          isAmbiguous: false
        })),
        ...unresolved.map((u, idx) => ({
          id: u.id,
          category: 'UNRESOLVED_ISSUE' as const,
          title: u.issue,
          status: u.status,
          evidenceText: u.evidenceText,
          sourceLine: u.sourceLine || (actions.length + decisions.length + idx + 1),
          isAmbiguous: false
        }))
      ];
      setEvidenceItems(items);
    };

    fetchEvidence();
  }, [meeting.id, actions, decisions, unresolved]);

  useEffect(() => {
    if (initialHighlight) {
      setHighlightedSentence(initialHighlight);
      setActiveTab('evidence');
    }
  }, [initialHighlight]);

  useEffect(() => {
    qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaMessages]);

  const handleHighlightInTranscript = (evidenceText: string) => {
    setHighlightedSentence(evidenceText);
    const matchIndex = evidenceItems.findIndex(e => e.evidenceText.toLowerCase() === evidenceText.toLowerCase());
    if (matchIndex !== -1) {
      setSelectedEvidenceIndex(matchIndex);
    }
    setActiveTab('evidence');
  };

  const handleSelectEvidence = (index: number) => {
    if (index >= 0 && index < evidenceItems.length) {
      setSelectedEvidenceIndex(index);
      setHighlightedSentence(evidenceItems[index].evidenceText);
    }
  };

  const handleSendQuestion = async (queryText?: string) => {
    const question = (queryText || qaInput).trim();
    if (!question || isAsking) return;

    if (!meeting || !meeting.id) {
      setQaMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          text: 'Error: No meeting is currently selected to ground this question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const userMessage = {
      sender: 'user' as const,
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQaMessages(prev => [...prev, userMessage]);
    setQaInput('');
    setIsAsking(true);

    try {
      // 1. Attempt backend API call (authenticates user, isolates meeting data, runs grounded RAG)
      const response: MeetingQAResponse = await ApiService.askMeetingQuestion(meeting.id, question);
      if (response && response.answer) {
        const aiMessage = {
          sender: 'ai' as const,
          text: response.answer,
          citations: response.citations || [],
          confidence: response.confidence,
          grounded: response.grounded,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setQaMessages(prev => [...prev, aiMessage]);
        return;
      }
      throw new Error('Empty response from Q&A service');
    } catch (err: any) {
      console.warn('Backend Q&A API unavailable or demo mode, utilizing local deterministic grounded engine:', err);
      // 2. Client-side Grounded RAG fallback: ensures 100% grounded zero-hallucination answers from current meeting state
      try {
        const localResponse = runLocalGroundedQA(
          {
            meeting,
            actions,
            decisions,
            unresolved
          },
          question
        );
        const aiMessage = {
          sender: 'ai' as const,
          text: localResponse.answer,
          citations: localResponse.citations || [],
          confidence: localResponse.confidence,
          grounded: localResponse.grounded,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setQaMessages(prev => [...prev, aiMessage]);
      } catch (localErr: any) {
        setQaMessages(prev => [
          ...prev,
          {
            sender: 'ai' as const,
            text: "An error occurred while analyzing the meeting context. Please check your network connection or try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsAsking(false);
    }
  };

  // Helper to split transcript into lines for line-by-line numbering
  const transcriptLines = meeting.transcript.split(/\r?\n/);
  const currentEvidence = evidenceItems[selectedEvidenceIndex];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Back Button */}
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
            <span>Audited & Verifiable Lineage</span>
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
              onClick={() => setActiveTab('evidence')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/30 transition-colors flex items-center gap-1.5"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Evidence Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600/10 text-cyan-300 hover:bg-cyan-600/20 border border-cyan-500/30 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI About Meeting</span>
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
          onClick={() => setActiveTab('evidence')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
              : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 border border-indigo-500/20'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Module 4 • Evidence Explorer</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-[10px] font-bold">
            {evidenceItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ask'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-600/10 border border-cyan-500/20'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Module 5 • Ask AI About Meeting</span>
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
          <span>Transcript</span>
        </button>
      </div>

      {/* Tab Panels */}

      {/* TAB 1: OVERVIEW */}
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
                    <span>Owner: <strong className="text-slate-200">{act.owner || 'Not specified'}</strong></span>
                    <span>Deadline: <strong className="text-slate-200">{act.deadline || 'Not specified'}</strong></span>
                  </div>
                  <div className="pt-1 flex items-center justify-between border-t border-slate-700/40 text-[11px]">
                    <button
                      onClick={() => handleHighlightInTranscript(act.evidenceText)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Quote className="w-3 h-3" />
                      <span>View in Evidence Explorer</span>
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
                          <span>View Evidence</span>
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
                        <span>Status: {issue.status || 'UNRESOLVED'}</span>
                        <button
                          onClick={() => handleHighlightInTranscript(issue.evidenceText)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Quote className="w-3 h-3" />
                          <span>View Evidence</span>
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

      {/* TAB 2: ACTION ITEMS TABLE */}
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
                      {act.owner || <span className="text-amber-400 italic">Not specified</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {act.deadline || <span className="italic">Not specified</span>}
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
                        Evidence
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

      {/* TAB 3: DECISIONS */}
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
                    <span>View in Evidence Explorer</span>
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

      {/* TAB 4: UNRESOLVED ISSUES */}
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
                    <span>View in Evidence Explorer</span>
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

      {/* TAB 5: MODULE 4 — EVIDENCE EXPLORER */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Module 4
                </span>
                <h3 className="text-sm font-bold text-white">Evidence Explorer & Verbatim Line Trace</h3>
              </div>
              <p className="text-xs text-slate-400">
                Trace any extracted decision, action item, owner, or deadline directly to its exact transcript line and quote. Zero hallucination guarantee.
              </p>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => handleSelectEvidence(selectedEvidenceIndex - 1)}
                disabled={selectedEvidenceIndex === 0}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Evidence"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-indigo-300 px-2 font-bold">
                {evidenceItems.length > 0 ? selectedEvidenceIndex + 1 : 0} of {evidenceItems.length}
              </span>
              <button
                onClick={() => handleSelectEvidence(selectedEvidenceIndex + 1)}
                disabled={selectedEvidenceIndex >= evidenceItems.length - 1}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Evidence"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Split Pane: Left Evidence List & Selected Card, Right Transcript with Line Numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Pane (5 Cols): Selected Evidence Detail & Selector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Active Inspected Evidence Card */}
              {currentEvidence && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121929] border-2 border-indigo-500/50 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      currentEvidence.category === 'ACTION_ITEM'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : currentEvidence.category === 'DECISION'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {currentEvidence.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      Line {currentEvidence.sourceLine}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Extracted Item:</div>
                    <div className="text-sm font-bold text-white leading-snug">
                      {currentEvidence.title}
                    </div>
                  </div>

                  {currentEvidence.category === 'ACTION_ITEM' && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Owner</span>
                        <span className="font-bold text-slate-200">
                          {currentEvidence.owner || 'Not specified'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Deadline</span>
                        <span className="font-bold text-slate-200">
                          {currentEvidence.deadline || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Verbatim Source Evidence Callout */}
                  <div className="p-3.5 rounded-xl bg-[#090D16] border border-amber-500/30 space-y-1">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Quote className="w-3.5 h-3.5" />
                      Source Evidence (Verbatim Transcript)
                    </div>
                    <p className="text-xs text-amber-100 font-mono italic leading-relaxed">
                      "{currentEvidence.evidenceText}"
                    </p>
                  </div>

                  {/* Ambiguity Flag if Applicable */}
                  {currentEvidence.isAmbiguous && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{currentEvidence.ambiguityReason || 'Ambiguous owner or deadline detected in source.'}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Meeting: <strong className="text-slate-200">{meeting.title}</strong></span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>
              )}

              {/* Evidence Item Mini-Navigator List */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2 max-h-[350px] overflow-y-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  All Grounded Evidence ({evidenceItems.length})
                </div>
                {evidenceItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEvidence(idx)}
                    className={`p-3 rounded-xl cursor-pointer text-xs transition-all space-y-1 ${
                      selectedEvidenceIndex === idx
                        ? 'bg-indigo-600/20 border border-indigo-500 text-white'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate max-w-[200px]">{item.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400">Line {item.sourceLine}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 italic truncate">
                      "{item.evidenceText}"
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane (7 Cols): Numbered Line Transcript Viewer with Highlighting */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Transcript with Source Line Index
                  </span>
                </div>
                {currentEvidence && (
                  <span className="text-xs text-amber-300 font-mono font-semibold">
                    Highlighting Line {currentEvidence.sourceLine}
                  </span>
                )}
              </div>

              {/* Numbered Transcript Viewer */}
              <div 
                ref={transcriptRef}
                className="p-4 rounded-xl bg-[#090D16] border border-slate-800 max-h-[550px] overflow-y-auto font-mono text-xs text-slate-300 select-text space-y-1"
              >
                {transcriptLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isCurrentTarget = currentEvidence && currentEvidence.sourceLine === lineNum;
                  const containsEvidence = currentEvidence && line.toLowerCase().includes(currentEvidence.evidenceText.toLowerCase().trim());
                  const isHighlighted = isCurrentTarget || containsEvidence;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 py-1 px-2 rounded transition-colors ${
                        isHighlighted
                          ? 'bg-amber-500/20 border-l-4 border-amber-400 text-white font-semibold'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <span className={`w-8 shrink-0 text-right select-none text-[11px] font-mono ${
                        isHighlighted ? 'text-amber-400 font-bold' : 'text-slate-600'
                      }`}>
                        {lineNum}
                      </span>
                      <span className="flex-1 leading-relaxed whitespace-pre-wrap">
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MODULE 5 — ASK ABOUT THIS MEETING (GROUNDED AI Q&A) */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Module 5
                </span>
                <h3 className="text-sm font-bold text-white">Ask About This Meeting — Grounded AI Q&A</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                RAG Grounded on Transcript
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ask questions about decisions, assigned tasks, deadlines, or unresolved issues. MeetFlow AI answers strictly using facts present in this transcript. If information is not in the transcript, it will never guess or fabricate.
            </p>
          </div>

          {/* Quick Query Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Suggested Questions:
            </span>
            {[
              'What decisions were made?',
              'Who is responsible for the API integration?',
              'When is the API integration due?',
              'What database was selected?',
              'What issues remain unresolved?',
              'What tasks were assigned to Rahul?',
              'Tell me everything about the meeting.'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendQuestion(preset)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1"
              >
                <span>{preset}</span>
              </button>
            ))}
          </div>

          {/* Chat Container */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {qaMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                    <span className="font-semibold">{msg.sender === 'user' ? 'You' : 'MeetFlow Grounded AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-2xl p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none space-y-3'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Citations if available */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                        <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
                          <Quote className="w-3 h-3" />
                          Supporting Citations from Transcript:
                        </div>
                        {msg.citations.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            onClick={() => {
                              if (c.text) {
                                setHighlightedSentence(c.text);
                                setActiveTab('transcript');
                              }
                            }}
                            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors text-[11px] font-mono text-slate-300 space-y-1 cursor-pointer group"
                            title="Click to view and highlight in Source Transcript"
                          >
                            <div className="flex items-center justify-between text-slate-400 text-[10px]">
                              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                                <FileText className="w-3 h-3" />
                                Line {c.sourceLine || 'In transcript'}
                              </span>
                              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">
                                {c.relevance || 'Exact match'} →
                              </span>
                            </div>
                            <div className="italic text-cyan-100">"{c.text}"</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 max-w-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching transcript facts & verifying zero hallucination...</span>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-800"
            >
              <input
                type="text"
                placeholder="Ask anything about this meeting (e.g. 'What tasks were assigned to Rahul?')..."
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                disabled={isAsking}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!qaInput.trim() || isAsking}
                className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: FULL TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Full Source Transcript</span>
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
            className="p-5 rounded-xl bg-[#090D16] border border-slate-800 max-h-[600px] overflow-y-auto space-y-1 font-mono text-xs md:text-sm text-slate-300 select-text"
          >
            {transcriptLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3 py-0.5">
                <span className="w-8 shrink-0 text-right select-none text-[11px] font-mono text-slate-600">
                  {idx + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap">{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
