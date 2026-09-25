import {
  Meeting,
  ActionItem,
  Decision,
  UnresolvedIssue,
  SystemStats,
  ExtractionResult,
  MeetingAnalytics,
  FilterOptions,
  MeetingQAResponse
} from '../types/index.js';
import { dataStore } from '../models/dataStore.js';
import { reconcileCrossMeetingItems, reconcileUnresolvedIssues, findSourceLineNumber } from './crossMeetingTracker.js';
import { askMeetingQuestion as askGroundedQA } from './meetingQAService.js';
import { transcribeAudioFile as transcribeAudio, TranscribeAudioInput, TranscribeAudioResult } from './transcriptionService.js';

export class StorageService {
  static getMeetings(userId: string): Meeting[] {
    return dataStore.getMeetings(userId);
  }

  static getMeetingById(userId: string, id: string) {
    return dataStore.getMeetingById(userId, id);
  }

  static getActionItems(userId: string, filters?: { meetingId?: string; status?: string; owner?: string; search?: string }): ActionItem[] {
    return dataStore.getActions(userId, filters);
  }

  static getActionById(userId: string, id: string): ActionItem | undefined {
    return dataStore.getActionById(userId, id);
  }

  static getActionHistory(userId: string, id: string) {
    return dataStore.getActionHistory(userId, id);
  }

  static updateActionStatus(userId: string, id: string, status: ActionItem['status']): ActionItem | null {
    return dataStore.updateActionStatus(userId, id, status);
  }

  static getDecisions(userId: string): Decision[] {
    return dataStore.getDecisions(userId);
  }

  static getUnresolvedIssues(userId: string): UnresolvedIssue[] {
    return dataStore.getUnresolved(userId);
  }

  static getSystemStats(userId: string): SystemStats {
    return dataStore.getSystemStats(userId);
  }

  static getMeetingAnalytics(userId: string, filters?: FilterOptions): MeetingAnalytics {
    return dataStore.getMeetingAnalytics(userId, filters);
  }

  static getMeetingEvidence(userId: string, meetingId: string) {
    const meetingData = dataStore.getMeetingById(userId, meetingId);
    if (!meetingData.meeting) return null;
    const meeting = meetingData.meeting;
    const actions = meetingData.actions;
    const decisions = meetingData.decisions;
    const unresolved = meetingData.unresolved;

    const items = [
      ...actions.map((a: ActionItem) => ({
        id: a.id,
        category: 'ACTION_ITEM' as const,
        title: a.task,
        owner: a.owner || 'Not specified',
        deadline: a.deadline || 'Not specified',
        status: a.status,
        confidence: a.confidence,
        evidenceText: a.evidenceText,
        sourceLine: a.sourceLine || findSourceLineNumber(meeting.transcript, a.evidenceText),
        isAmbiguous: a.isAmbiguous || a.owner === 'Not specified' || a.deadline === 'Not specified',
        ambiguityReason: a.ambiguityReason
      })),
      ...decisions.map((d: Decision) => ({
        id: d.id,
        category: 'DECISION' as const,
        title: d.decision,
        evidenceText: d.evidenceText,
        sourceLine: d.sourceLine || findSourceLineNumber(meeting.transcript, d.evidenceText),
        isAmbiguous: false
      })),
      ...unresolved.map((u: UnresolvedIssue) => ({
        id: u.id,
        category: 'UNRESOLVED_ISSUE' as const,
        title: u.issue,
        status: u.status,
        evidenceText: u.evidenceText,
        sourceLine: u.sourceLine || findSourceLineNumber(meeting.transcript, u.evidenceText),
        isAmbiguous: false
      }))
    ];

    return {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDate: meeting.date,
      transcript: meeting.transcript,
      totalEvidenceItems: items.length,
      items
    };
  }

  static async askMeetingQuestion(userId: string, meetingId: string, question: string): Promise<MeetingQAResponse | null> {
    const meetingData = dataStore.getMeetingById(userId, meetingId);
    if (!meetingData.meeting) return null;
    return askGroundedQA(
      {
        meeting: meetingData.meeting,
        actions: meetingData.actions,
        decisions: meetingData.decisions,
        unresolved: meetingData.unresolved
      },
      question
    );
  }

  static async transcribeAudioFile(input: TranscribeAudioInput): Promise<TranscribeAudioResult> {
    return transcribeAudio(input);
  }

  static loadDemoData(userId: string) {
    return dataStore.loadDemoData(userId);
  }

  static resetToDemo(userId: string): void {
    dataStore.resetDemoData(userId);
  }

  static clearAll(userId: string): void {
    dataStore.clearUserData(userId);
  }

  static exportBackup(userId: string): string {
    return dataStore.exportBackup(userId);
  }

  static importBackup(userId: string, data: any): boolean {
    return dataStore.importBackup(userId, data);
  }

  static saveNewMeeting(
    userId: string,
    meetingData: {
      title: string;
      date: string;
      participants: string[];
      transcript: string;
    },
    extraction: ExtractionResult
  ): {
    meeting: Meeting;
    newActions: ActionItem[];
    newDecisions: Decision[];
    newUnresolved: UnresolvedIssue[];
  } {
    const existingActions = dataStore.getActions(userId);
    const existingUnresolved = dataStore.getUnresolved(userId);

    const meetingId = `meet-${Date.now()}`;
    const newMeeting: Meeting = {
      id: meetingId,
      userId,
      title: meetingData.title,
      date: meetingData.date,
      participants: meetingData.participants,
      transcript: meetingData.transcript,
      summary: extraction.summary,
      actionItemsCount: extraction.action_items.length,
      decisionsCount: extraction.decisions.length,
      unresolvedCount: extraction.unresolved_issues.length,
      createdAt: new Date().toISOString()
    };

    // Reconcile cross-meeting action items against user's historical actions
    const { reconciledNewItems, updatedHistoricalItems } = reconcileCrossMeetingItems(
      newMeeting,
      extraction.action_items,
      existingActions
    );

    // Save Decisions
    const newDecisions: Decision[] = extraction.decisions.map((d, idx) => ({
      id: `dec-${Date.now()}-${idx}`,
      userId,
      meetingId: newMeeting.id,
      meetingTitle: newMeeting.title,
      meetingDate: newMeeting.date,
      decision: d.decision,
      evidenceText: d.evidence_text,
      createdAt: new Date().toISOString()
    }));

    // Reconcile Unresolved issues against user's historical issues
    const { reconciledNewIssues, updatedHistoricalIssues } = reconcileUnresolvedIssues(
      newMeeting,
      extraction.unresolved_issues,
      existingUnresolved
    );

    // Tag reconciled items with userId
    for (const a of reconciledNewItems) a.userId = userId;
    for (const u of reconciledNewIssues) u.userId = userId;

    // Persist to store
    dataStore.addMeeting(
      userId,
      newMeeting,
      reconciledNewItems,
      updatedHistoricalItems,
      newDecisions,
      reconciledNewIssues,
      updatedHistoricalIssues
    );

    return {
      meeting: newMeeting,
      newActions: reconciledNewItems,
      newDecisions,
      newUnresolved: reconciledNewIssues
    };
  }
}
