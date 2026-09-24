import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, ExtractionResult } from '../types';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED } from '../data/demoData';
import { reconcileCrossMeetingItems, reconcileUnresolvedIssues } from './crossMeetingTracker';

const STORAGE_KEYS = {
  MEETINGS: 'pb_meetings_v1',
  ACTIONS: 'pb_actions_v1',
  DECISIONS: 'pb_decisions_v1',
  UNRESOLVED: 'pb_unresolved_v1',
  SETTINGS: 'pb_settings_v1',
  SEEDED: 'pb_has_seeded_v1'
};

export class StorageService {
  static getMeetings(): Meeting[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    if (!raw) {
      this.seedInitialDemoData();
      return DEMO_MEETINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_MEETINGS;
    }
  }

  static getActionItems(): ActionItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIONS);
    if (!raw) {
      this.seedInitialDemoData();
      return DEMO_ACTION_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_ACTION_ITEMS;
    }
  }

  static getDecisions(): Decision[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DECISIONS);
    if (!raw) {
      this.seedInitialDemoData();
      return DEMO_DECISIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_DECISIONS;
    }
  }

  static getUnresolvedIssues(): UnresolvedIssue[] {
    const raw = localStorage.getItem(STORAGE_KEYS.UNRESOLVED);
    if (!raw) {
      this.seedInitialDemoData();
      return DEMO_UNRESOLVED;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_UNRESOLVED;
    }
  }

  static seedInitialDemoData(force = false): void {
    if (!force && localStorage.getItem(STORAGE_KEYS.SEEDED)) {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(DEMO_MEETINGS));
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(DEMO_ACTION_ITEMS));
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(DEMO_DECISIONS));
    localStorage.setItem(STORAGE_KEYS.UNRESOLVED, JSON.stringify(DEMO_UNRESOLVED));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }

  static resetToDemo(): void {
    this.seedInitialDemoData(true);
  }

  static clearAll(): void {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.UNRESOLVED, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.SEEDED);
  }

  static getSystemStats(): SystemStats {
    const meetings = this.getMeetings();
    const actions = this.getActionItems();
    const unresolved = this.getUnresolvedIssues();

    return {
      totalMeetings: meetings.length,
      totalActionItems: actions.length,
      openItems: actions.filter(a => a.status === 'NEW').length,
      carriedOverItems: actions.filter(a => a.status === 'CARRIED_OVER').length,
      completedItems: actions.filter(a => a.status === 'COMPLETED').length,
      overdueItems: actions.filter(a => a.status === 'OVERDUE').length,
      ambiguousItems: actions.filter(a => a.status === 'AMBIGUOUS' || a.isAmbiguous).length,
      unresolvedIssues: unresolved.filter(u => u.status === 'UNRESOLVED').length
    };
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
    const meetings = this.getMeetings();
    const existingActions = this.getActionItems();
    const existingDecisions = this.getDecisions();
    const existingUnresolved = this.getUnresolvedIssues();

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

    // Persist all updates
    const allMeetings = [newMeeting, ...meetings];
    const allActions = [...reconciledNewItems, ...updatedHistoricalItems];
    const allDecisions = [...newDecisions, ...existingDecisions];
    const allUnresolved = [...reconciledNewIssues, ...updatedHistoricalIssues];

    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(allMeetings));
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(allActions));
    localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(allDecisions));
    localStorage.setItem(STORAGE_KEYS.UNRESOLVED, JSON.stringify(allUnresolved));

    return {
      meeting: newMeeting,
      newActions: reconciledNewItems,
      newDecisions,
      newUnresolved: reconciledNewIssues
    };
  }

  static getMeetingById(id: string): {
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  } {
    const meeting = this.getMeetings().find(m => m.id === id);
    const actions = this.getActionItems().filter(a => a.meetingId === id);
    const decisions = this.getDecisions().filter(d => d.meetingId === id);
    const unresolved = this.getUnresolvedIssues().filter(u => u.meetingId === id);

    return { meeting, actions, decisions, unresolved };
  }

  static exportBackup(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      meetings: this.getMeetings(),
      actions: this.getActionItems(),
      decisions: this.getDecisions(),
      unresolved: this.getUnresolvedIssues()
    }, null, 2);
  }

  static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.meetings) && Array.isArray(data.actions)) {
        localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(data.meetings));
        localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(data.actions));
        if (data.decisions) localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(data.decisions));
        if (data.unresolved) localStorage.setItem(STORAGE_KEYS.UNRESOLVED, JSON.stringify(data.unresolved));
        return true;
      }
    } catch (e) {
      console.error('Failed to import backup:', e);
    }
    return false;
  }
}
