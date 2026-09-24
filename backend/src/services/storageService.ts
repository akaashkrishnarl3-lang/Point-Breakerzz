import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, ExtractionResult } from '../types/index.js';
import { dataStore } from '../models/dataStore.js';
import { reconcileCrossMeetingItems, reconcileUnresolvedIssues } from './crossMeetingTracker.js';

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
