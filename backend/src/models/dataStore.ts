import fs from 'fs';
import path from 'path';
import { User, Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats } from '../types/index.js';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED } from '../data/demoData.js';
import { logger } from '../utils/logger.js';

interface DatabaseSchema {
  users: User[];
  meetings: Meeting[];
  actions: ActionItem[];
  decisions: Decision[];
  unresolved: UnresolvedIssue[];
}

class DataStore {
  private users: User[] = [];
  private meetings: Meeting[] = [];
  private actions: ActionItem[] = [];
  private decisions: Decision[] = [];
  private unresolved: UnresolvedIssue[] = [];
  private dbFilePath: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.error('Failed to create data directory:', err);
      }
    }
    this.dbFilePath = path.join(dataDir, 'database.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        this.users = Array.isArray(parsed.users) ? parsed.users : [];
        this.meetings = Array.isArray(parsed.meetings) ? parsed.meetings : [];
        this.actions = Array.isArray(parsed.actions) ? parsed.actions : [];
        this.decisions = Array.isArray(parsed.decisions) ? parsed.decisions : [];
        this.unresolved = Array.isArray(parsed.unresolved) ? parsed.unresolved : [];
        logger.info(`Loaded database from ${this.dbFilePath} (${this.users.length} users, ${this.meetings.length} meetings)`);
      } else {
        logger.info('No existing database.json found. Initializing empty database.');
        this.saveToDisk();
      }
      this.ensureDemoUser();
    } catch (err) {
      logger.error('Error reading database file, starting in-memory:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const data: DatabaseSchema = {
        users: this.users,
        meetings: this.meetings,
        actions: this.actions,
        decisions: this.decisions,
        unresolved: this.unresolved
      };
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Error writing to database.json:', err);
    }
  }

  // ================= USERS =================

  public findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public findUserByGoogleSub(googleSub: string): User | undefined {
    return this.users.find(u => u.google_sub === googleSub);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: {
    google_sub?: string;
    password?: string;
    name: string;
    email: string;
    profile_picture?: string;
    provider?: 'google' | 'email';
  }): User {
    if (userData.google_sub) {
      const existing = this.findUserByGoogleSub(userData.google_sub);
      if (existing) {
        return existing;
      }
    }

    const existingByEmail = this.findUserByEmail(userData.email);
    if (existingByEmail) {
      return existingByEmail;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      google_sub: userData.google_sub || '',
      password: userData.password,
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      profile_picture: userData.profile_picture || '',
      provider: userData.provider || (userData.google_sub ? 'google' : 'email'),
      created_at: now,
      updated_at: now,
      last_login_at: now
    };

    this.users.push(newUser);
    this.saveToDisk();
    logger.info(`Created new user: ${newUser.id} (${newUser.email}, provider: ${newUser.provider})`);
    return newUser;
  }

  public updateUserLogin(id: string, updates?: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;

    const now = new Date().toISOString();
    this.users[idx] = {
      ...this.users[idx],
      ...(updates || {}),
      last_login_at: now,
      updated_at: now
    };
    this.saveToDisk();
    return this.users[idx];
  }

  // ================= MEETINGS =================

  public getMeetings(userId: string): Meeting[] {
    return this.meetings.filter(m => m.userId === userId);
  }

  public getMeetingById(userId: string, id: string): {
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  } {
    const meeting = this.meetings.find(m => m.id === id && m.userId === userId);
    const actions = this.actions.filter(a => a.meetingId === id && a.userId === userId);
    const decisions = this.decisions.filter(d => d.meetingId === id && d.userId === userId);
    const unresolved = this.unresolved.filter(u => u.meetingId === id && u.userId === userId);
    return { meeting, actions, decisions, unresolved };
  }

  public addMeeting(
    userId: string,
    meeting: Meeting,
    newActions: ActionItem[],
    updatedHistoricalActions: ActionItem[],
    newDecisions: Decision[],
    newUnresolved: UnresolvedIssue[],
    updatedHistoricalIssues: UnresolvedIssue[]
  ): void {
    // Ensure all items are attached to this user
    meeting.userId = userId;
    for (const a of newActions) a.userId = userId;
    for (const d of newDecisions) d.userId = userId;
    for (const u of newUnresolved) u.userId = userId;

    // Remove old versions of historical items for this user and replace with updated
    const updatedActionIds = new Set(updatedHistoricalActions.map(a => a.id));
    this.actions = this.actions.filter(a => !(a.userId === userId && updatedActionIds.has(a.id)));
    this.actions.push(...updatedHistoricalActions);
    this.actions.push(...newActions);

    const updatedIssueIds = new Set(updatedHistoricalIssues.map(i => i.id));
    this.unresolved = this.unresolved.filter(u => !(u.userId === userId && updatedIssueIds.has(u.id)));
    this.unresolved.push(...updatedHistoricalIssues);
    this.unresolved.push(...newUnresolved);

    this.decisions.push(...newDecisions);
    this.meetings.unshift(meeting);

    this.saveToDisk();
  }

  private isItemOverdue(item: ActionItem, referenceDate: Date = new Date()): boolean {
    if (item.status === 'COMPLETED') return false;
    if (item.status === 'OVERDUE') return true;
    if (!item.deadline) return false;

    const match = item.deadline.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const deadlineDate = new Date(match[1]);
      deadlineDate.setHours(23, 59, 59, 999);
      return deadlineDate < referenceDate;
    }
    return false;
  }

  // ================= ACTION ITEMS =================

  public getActions(userId: string, filters?: { meetingId?: string; status?: string; owner?: string; search?: string }): ActionItem[] {
    const now = new Date();
    let result = this.actions.filter(a => a.userId === userId).map(a => {
      if (a.status !== 'COMPLETED' && this.isItemOverdue(a, now)) {
        return { ...a, status: 'OVERDUE' as const };
      }
      return a;
    });

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
        (a.meetingTitle && a.meetingTitle.toLowerCase().includes(q)) ||
        a.evidenceText.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public updateActionStatus(userId: string, id: string, status: ActionItem['status']): ActionItem | null {
    const idx = this.actions.findIndex(a => a.id === id && a.userId === userId);
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
    this.saveToDisk();
    return updated;
  }

  // ================= DECISIONS & UNRESOLVED =================

  public getDecisions(userId: string): Decision[] {
    return this.decisions.filter(d => d.userId === userId);
  }

  public getUnresolved(userId: string): UnresolvedIssue[] {
    return this.unresolved.filter(u => u.userId === userId);
  }

  // ================= STATS =================

  public getSystemStats(userId: string): SystemStats {
    const userMeetings = this.meetings.filter(m => m.userId === userId);
    const userActions = this.getActions(userId);
    const userUnresolved = this.unresolved.filter(u => u.userId === userId);

    return {
      totalMeetings: userMeetings.length,
      totalActionItems: userActions.length,
      openItems: userActions.filter(a => a.status === 'NEW').length,
      carriedOverItems: userActions.filter(a => a.status === 'CARRIED_OVER').length,
      completedItems: userActions.filter(a => a.status === 'COMPLETED').length,
      overdueItems: userActions.filter(a => a.status === 'OVERDUE').length,
      ambiguousItems: userActions.filter(a => a.status === 'AMBIGUOUS' || a.isAmbiguous).length,
      unresolvedIssues: userUnresolved.filter(u => u.status === 'UNRESOLVED').length
    };
  }

  // ================= DEMO SEEDING (Per User) =================

  public ensureDemoUser(): User {
    let demoUser = this.findUserByEmail('demo@meetflow.ai');
    if (!demoUser) {
      demoUser = {
        id: 'usr-demo-meetflow',
        google_sub: 'demo-google-sub',
        password: '',
        name: 'MeetFlow Demo',
        email: 'demo@meetflow.ai',
        profile_picture: '',
        provider: 'email',
        is_demo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      this.users.unshift(demoUser);
      this.loadDemoData(demoUser.id);
      this.saveToDisk();
      logger.info('Initialized default Demo User with pre-loaded demo meetings.');
    } else {
      if (!demoUser.is_demo) {
        demoUser.is_demo = true;
      }
      this.loadDemoData(demoUser.id);
    }
    return demoUser;
  }

  public loadDemoData(userId: string): {
    alreadyLoaded: boolean;
    insertedCount: { meetings: number; actions: number; decisions: number; unresolved: number };
    stats: SystemStats;
  } {
    let meetingsInserted = 0;
    let actionsInserted = 0;
    let decisionsInserted = 0;
    let unresolvedInserted = 0;

    // 1. Meetings
    for (const demoMeeting of DEMO_MEETINGS) {
      const exists = this.meetings.some(
        m => m.userId === userId && (m.demo_key === demoMeeting.demo_key || m.id === demoMeeting.id)
      );
      if (!exists) {
        this.meetings.unshift({
          ...demoMeeting,
          userId
        });
        meetingsInserted++;
      }
    }

    // 2. Action Items
    for (const demoAction of DEMO_ACTION_ITEMS) {
      const exists = this.actions.some(
        a => a.userId === userId && (a.demo_key === demoAction.demo_key || a.id === demoAction.id)
      );
      if (!exists) {
        this.actions.push({
          ...demoAction,
          userId
        });
        actionsInserted++;
      }
    }

    // 3. Decisions
    for (const demoDecision of DEMO_DECISIONS) {
      const exists = this.decisions.some(
        d => d.userId === userId && (d.demo_key === demoDecision.demo_key || d.id === demoDecision.id)
      );
      if (!exists) {
        this.decisions.push({
          ...demoDecision,
          userId
        });
        decisionsInserted++;
      }
    }

    // 4. Unresolved Issues
    for (const demoIssue of DEMO_UNRESOLVED) {
      const exists = this.unresolved.some(
        u => u.userId === userId && (u.demo_key === demoIssue.demo_key || u.id === demoIssue.id)
      );
      if (!exists) {
        this.unresolved.push({
          ...demoIssue,
          userId
        });
        unresolvedInserted++;
      }
    }

    if (meetingsInserted > 0 || actionsInserted > 0 || decisionsInserted > 0 || unresolvedInserted > 0) {
      this.saveToDisk();
      logger.info(`Loaded demo data for user ${userId}: +${meetingsInserted} meetings, +${actionsInserted} actions`);
    }

    const alreadyLoaded = meetingsInserted === 0 && actionsInserted === 0;
    const stats = this.getSystemStats(userId);

    return {
      alreadyLoaded,
      insertedCount: {
        meetings: meetingsInserted,
        actions: actionsInserted,
        decisions: decisionsInserted,
        unresolved: unresolvedInserted
      },
      stats
    };
  }

  public resetDemoData(userId: string): void {
    this.meetings = this.meetings.filter(m => !(m.userId === userId && (m.demo_key || m.id.startsWith('meet-demo-'))));
    this.actions = this.actions.filter(a => !(a.userId === userId && (a.demo_key || a.id.startsWith('act-demo-'))));
    this.decisions = this.decisions.filter(d => !(d.userId === userId && (d.demo_key || d.id.startsWith('dec-demo-'))));
    this.unresolved = this.unresolved.filter(u => !(u.userId === userId && (u.demo_key || u.id.startsWith('unres-demo-'))));
    this.saveToDisk();
    logger.info(`Reset demo data for user ${userId}`);
  }

  public clearUserData(userId: string): void {
    this.meetings = this.meetings.filter(m => m.userId !== userId);
    this.actions = this.actions.filter(a => a.userId !== userId);
    this.decisions = this.decisions.filter(d => d.userId !== userId);
    this.unresolved = this.unresolved.filter(u => u.userId !== userId);
    this.saveToDisk();
    logger.info(`Cleared data for user ${userId}`);
  }

  // ================= BACKUP & RESTORE =================

  public exportBackup(userId: string): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId,
      meetings: this.getMeetings(userId),
      actions: this.getActions(userId),
      decisions: this.getDecisions(userId),
      unresolved: this.getUnresolved(userId)
    }, null, 2);
  }

  public importBackup(userId: string, data: any): boolean {
    if (data && Array.isArray(data.meetings) && Array.isArray(data.actions)) {
      this.clearUserData(userId);

      const meetingsWithUser = data.meetings.map((m: Meeting) => ({ ...m, userId }));
      const actionsWithUser = data.actions.map((a: ActionItem) => ({ ...a, userId }));
      const decisionsWithUser = Array.isArray(data.decisions)
        ? data.decisions.map((d: Decision) => ({ ...d, userId }))
        : [];
      const unresolvedWithUser = Array.isArray(data.unresolved)
        ? data.unresolved.map((u: UnresolvedIssue) => ({ ...u, userId }))
        : [];

      this.meetings.push(...meetingsWithUser);
      this.actions.push(...actionsWithUser);
      this.decisions.push(...decisionsWithUser);
      this.unresolved.push(...unresolvedWithUser);

      this.saveToDisk();
      return true;
    }
    return false;
  }
}

export const dataStore = new DataStore();
