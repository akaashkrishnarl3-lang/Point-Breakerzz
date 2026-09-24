import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, ExtractionResult, ActionItemStatus } from '../types';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED } from '../data/demoData';

const getApiBaseUrl = (): string => {
  const envUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined) ||
    'http://localhost:10000';
  return envUrl.replace(/\/+$/, '');
};

const API_BASE = getApiBaseUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export class ApiService {
  public static getBaseUrl(): string {
    return API_BASE;
  }

  // Health and System Status
  static async checkHealth(): Promise<{
    status: string;
    service: string;
    geminiConfigured: boolean;
    timestamp: string;
  }> {
    try {
      return await request('/api/health');
    } catch (err) {
      console.warn('Backend /api/health check failed, server might be offline:', err);
      return {
        status: 'offline',
        service: 'MeetFlow AI Backend API (Local Fallback)',
        geminiConfigured: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Meeting Ingestion & Extraction
  static async extractMeetingData(transcript: string, title: string): Promise<ExtractionResult> {
    const res = await request<{ success: boolean; data: ExtractionResult }>('/api/meetings/extract', {
      method: 'POST',
      body: JSON.stringify({ transcript, title })
    });
    return res.data;
  }

  static async saveNewMeeting(
    meetingData: {
      title: string;
      date: string;
      participants: string[];
      transcript: string;
    },
    extraction?: ExtractionResult
  ): Promise<{
    meeting: Meeting;
    newActions: ActionItem[];
    newDecisions: Decision[];
    newUnresolved: UnresolvedIssue[];
  }> {
    const res = await request<{
      success: boolean;
      data: {
        meeting: Meeting;
        newActions: ActionItem[];
        newDecisions: Decision[];
        newUnresolved: UnresolvedIssue[];
      };
    }>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({
        ...meetingData,
        extraction
      })
    });
    return res.data;
  }

  // Retrieval
  static async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await request<{ success: boolean; data: Meeting[] }>('/api/meetings');
      return res.data;
    } catch (err) {
      console.warn('API getMeetings failed, using fallback cache:', err);
      return DEMO_MEETINGS;
    }
  }

  static async getMeetingById(id: string): Promise<{
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  }> {
    try {
      const res = await request<{
        success: boolean;
        data: {
          meeting: Meeting;
          actions: ActionItem[];
          decisions: Decision[];
          unresolved: UnresolvedIssue[];
        };
      }>(`/api/meetings/${id}`);
      return res.data;
    } catch (err) {
      console.warn(`API getMeetingById(${id}) failed, fallback:`, err);
      const meeting = DEMO_MEETINGS.find(m => m.id === id);
      const actions = DEMO_ACTION_ITEMS.filter(a => a.meetingId === id);
      const decisions = DEMO_DECISIONS.filter(d => d.meetingId === id);
      const unresolved = DEMO_UNRESOLVED.filter(u => u.meetingId === id);
      return { meeting, actions, decisions, unresolved };
    }
  }

  static async getActionItems(filters?: { meetingId?: string; status?: string; owner?: string; search?: string }): Promise<ActionItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.meetingId) params.append('meetingId', filters.meetingId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.owner) params.append('owner', filters.owner);
      if (filters?.search) params.append('search', filters.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await request<{ success: boolean; data: ActionItem[] }>(`/api/actions${qs}`);
      return res.data;
    } catch (err) {
      console.warn('API getActionItems failed, using fallback:', err);
      return DEMO_ACTION_ITEMS;
    }
  }

  static async updateActionStatus(id: string, status: ActionItemStatus): Promise<ActionItem | null> {
    try {
      const res = await request<{ success: boolean; data: ActionItem }>(`/api/actions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return res.data;
    } catch (err) {
      console.error(`API updateActionStatus failed for item ${id}:`, err);
      return null;
    }
  }

  static async getDecisions(): Promise<Decision[]> {
    try {
      const res = await request<{ success: boolean; data: Decision[] }>('/api/decisions');
      return res.data;
    } catch (err) {
      console.warn('API getDecisions failed, using fallback:', err);
      return DEMO_DECISIONS;
    }
  }

  static async getUnresolvedIssues(): Promise<UnresolvedIssue[]> {
    try {
      const res = await request<{ success: boolean; data: UnresolvedIssue[] }>('/api/unresolved');
      return res.data;
    } catch (err) {
      console.warn('API getUnresolvedIssues failed, using fallback:', err);
      return DEMO_UNRESOLVED;
    }
  }

  static async getSystemStats(): Promise<SystemStats> {
    try {
      const res = await request<{ success: boolean; data: SystemStats }>('/api/stats');
      return res.data;
    } catch (err) {
      console.warn('API getSystemStats failed, calculating fallback:', err);
      return {
        totalMeetings: DEMO_MEETINGS.length,
        totalActionItems: DEMO_ACTION_ITEMS.length,
        openItems: DEMO_ACTION_ITEMS.filter(a => a.status === 'NEW').length,
        carriedOverItems: DEMO_ACTION_ITEMS.filter(a => a.status === 'CARRIED_OVER').length,
        completedItems: DEMO_ACTION_ITEMS.filter(a => a.status === 'COMPLETED').length,
        overdueItems: DEMO_ACTION_ITEMS.filter(a => a.status === 'OVERDUE').length,
        ambiguousItems: DEMO_ACTION_ITEMS.filter(a => a.status === 'AMBIGUOUS' || a.isAmbiguous).length,
        unresolvedIssues: DEMO_UNRESOLVED.filter(u => u.status === 'UNRESOLVED').length
      };
    }
  }

  // System actions
  static async resetToDemo(): Promise<void> {
    await request('/api/reset-demo', { method: 'POST' });
  }

  static async clearAll(): Promise<void> {
    await request('/api/clear', { method: 'POST' });
  }

  static async exportBackup(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/backup`);
    return res.text();
  }

  static async importBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      await request('/api/backup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }
}
