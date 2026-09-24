import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats } from '../types/index.js';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED } from '../data/demoData.js';

class DataStore {
  private meetings: Meeting[] = [];
  private actions: ActionItem[] = [];
  private decisions: Decision[] = [];
  private unresolved: UnresolvedIssue[] = [];
  private isSeeded: boolean = false;

  constructor() {
    this.seedDemoData();
  }

  public seedDemoData(force = false): void {
    if (this.isSeeded && !force) return;
    this.meetings = JSON.parse(JSON.stringify(DEMO_MEETINGS));
    this.actions = JSON.parse(JSON.stringify(DEMO_ACTION_ITEMS));
    this.decisions = JSON.parse(JSON.stringify(DEMO_DECISIONS));
    this.unresolved = JSON.parse(JSON.stringify(DEMO_UNRESOLVED));
    this.isSeeded = true;
  }

  public clearAll(): void {
    this.meetings = [];
    this.actions = [];
    this.decisions = [];
    this.unresolved = [];
    this.isSeeded = false;
  }

  public getMeetings(): Meeting[] {
    return this.meetings;
  }

  public getMeetingById(id: string): {
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  } {
    const meeting = this.meetings.find(m => m.id === id);
    const actions = this.actions.filter(a => a.meetingId === id);
    const decisions = this.decisions.filter(d => d.meetingId === id);
    const unresolved = this.unresolved.filter(u => u.meetingId === id);
    return { meeting, actions, decisions, unresolved };
  }

  public addMeeting(
    meeting: Meeting,
    newActions: ActionItem[],
    updatedHistoricalActions: ActionItem[],
    newDecisions: Decision[],
    newUnresolved: UnresolvedIssue[],
    updatedHistoricalIssues: UnresolvedIssue[]
  ): void {
    this.meetings = [meeting, ...this.meetings];
    this.actions = [...newActions, ...updatedHistoricalActions];
    this.decisions = [...newDecisions, ...this.decisions];
    this.unresolved = [...newUnresolved, ...updatedHistoricalIssues];
  }

  public getActions(filters?: { meetingId?: string; status?: string; owner?: string; search?: string }): ActionItem[] {
    let result = this.actions;
    if (filters?.meetingId) {
      result = result.filter(a => a.meetingId === filters.meetingId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(a => a.status === filters.status);
    }
    if (filters?.owner) {
      const ownerLower = filters.owner.toLowerCase();
      result = result.filter(a => a.owner && a.owner.toLowerCase().includes(ownerLower));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(a =>
        a.task.toLowerCase().includes(q) ||
        (a.owner && a.owner.toLowerCase().includes(q)) ||
        a.evidenceText.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public updateActionStatus(id: string, status: ActionItem['status']): ActionItem | null {
    const idx = this.actions.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const action = this.actions[idx];
    const updated: ActionItem = {
      ...action,
      status,
      updatedAt: new Date().toISOString(),
      history: [
        ...action.history,
        {
          meetingId: action.meetingId,
          meetingTitle: action.meetingTitle || 'Manual Status Update',
          date: new Date().toISOString().split('T')[0],
          status,
          evidenceText: 'Status updated manually via dashboard.',
          note: `Status updated to ${status}`
        }
      ]
    };
    this.actions[idx] = updated;
    return updated;
  }

  public getDecisions(): Decision[] {
    return this.decisions;
  }

  public getUnresolved(): UnresolvedIssue[] {
    return this.unresolved;
  }

  public getSystemStats(): SystemStats {
    return {
      totalMeetings: this.meetings.length,
      totalActionItems: this.actions.length,
      openItems: this.actions.filter(a => a.status === 'NEW').length,
      carriedOverItems: this.actions.filter(a => a.status === 'CARRIED_OVER').length,
      completedItems: this.actions.filter(a => a.status === 'COMPLETED').length,
      overdueItems: this.actions.filter(a => a.status === 'OVERDUE').length,
      ambiguousItems: this.actions.filter(a => a.status === 'AMBIGUOUS' || a.isAmbiguous).length,
      unresolvedIssues: this.unresolved.filter(u => u.status === 'UNRESOLVED').length
    };
  }

  public exportBackup(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      meetings: this.meetings,
      actions: this.actions,
      decisions: this.decisions,
      unresolved: this.unresolved
    }, null, 2);
  }

  public importBackup(data: any): boolean {
    if (data && Array.isArray(data.meetings) && Array.isArray(data.actions)) {
      this.meetings = data.meetings;
      this.actions = data.actions;
      if (Array.isArray(data.decisions)) this.decisions = data.decisions;
      if (Array.isArray(data.unresolved)) this.unresolved = data.unresolved;
      return true;
    }
    return false;
  }
}

export const dataStore = new DataStore();
