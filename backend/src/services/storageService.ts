import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, ExtractionResult } from '../types/index.js';
import { dataStore } from '../models/dataStore.js';
import { reconcileCrossMeetingItems, reconcileUnresolvedIssues } from './crossMeetingTracker.js';

export class StorageService {
  static getMeetings(): Meeting[] {
    return dataStore.getMeetings();
  }

  static getMeetingById(id: string) {
    return dataStore.getMeetingById(id);
  }

  static getActionItems(filters?: { meetingId?: string; status?: string; owner?: string; search?: string }): ActionItem[] {
    return dataStore.getActions(filters);
  }

  static updateActionStatus(id: string, status: ActionItem['status']): ActionItem | null {
    return dataStore.updateActionStatus(id, status);
  }

  static getDecisions(): Decision[] {
    return dataStore.getDecisions();
  }

  static getUnresolvedIssues(): UnresolvedIssue[] {
    return dataStore.getUnresolved();
  }

  static getSystemStats(): SystemStats {
    return dataStore.getSystemStats();
  }

  static resetToDemo(): void {
    dataStore.seedDemoData(true);
  }

  static clearAll(): void {
    dataStore.clearAll();
  }

  static exportBackup(): string {
    return dataStore.exportBackup();
  }

  static importBackup(data: any): boolean {
    return dataStore.importBackup(data);
  }

  static saveNewMeeting(
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
    const existingActions = dataStore.getActions();
    const existingUnresolved = dataStore.getUnresolved();

    const meetingId = `meet-${Date.now()}`;
    const newMeeting: Meeting = {
      id: meetingId,
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

    // Reconcile cross-meeting action items
    const { reconciledNewItems, updatedHistoricalItems } = reconcileCrossMeetingItems(
      newMeeting,
      extraction.action_items,
      existingActions
    );

    // Save Decisions
    const newDecisions: Decision[] = extraction.decisions.map((d, idx) => ({
      id: `dec-${Date.now()}-${idx}`,
      meetingId: newMeeting.id,
      meetingTitle: newMeeting.title,
      meetingDate: newMeeting.date,
      decision: d.decision,
      evidenceText: d.evidence_text,
      createdAt: new Date().toISOString()
    }));

    // Reconcile Unresolved issues
    const { reconciledNewIssues, updatedHistoricalIssues } = reconcileUnresolvedIssues(
      newMeeting,
      extraction.unresolved_issues,
      existingUnresolved
    );

    // Persist to store
    dataStore.addMeeting(
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
