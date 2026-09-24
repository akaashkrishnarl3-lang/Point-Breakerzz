import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, ExtractionResult, ActionItemStatus, User } from '../types';

const TOKEN_KEY = 'meetflow_auth_token';

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

  const token = ApiService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

    if (response.status === 401) {
      // If unauthorized on protected route, clean local token
      if (!endpoint.includes('/auth/google')) {
        ApiService.clearToken();
      }
    }

    throw new Error(errorMsg);
  }

  return response.json();
}

export class ApiService {
  public static getBaseUrl(): string {
    return API_BASE;
  }

  // Token management
  public static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token to localStorage:', e);
    }
  }

  public static clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove token from localStorage:', e);
    }
  }

  // Authentication
  public static async loginWithGoogle(credential: string): Promise<{ user: User; token: string }> {
    const res = await request<{
      success: boolean;
      data: { user: User; token: string };
    }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });

    if (res.data && res.data.token) {
      ApiService.setToken(res.data.token);
    }
    return res.data;
  }

  public static async registerWithEmail(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{
      success: boolean;
      data: { user: User; token: string };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    if (res.data && res.data.token) {
      ApiService.setToken(res.data.token);
    }
    return res.data;
  }

  public static async loginWithEmail(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{
      success: boolean;
      data: { user: User; token: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.data && res.data.token) {
      ApiService.setToken(res.data.token);
    }
    return res.data;
  }

  public static async loginWithDemo(): Promise<{ user: User; token: string }> {
    const res = await request<{
      success: boolean;
      data: { user: User; token: string };
    }>('/api/auth/demo', {
      method: 'POST'
    });

    if (res.data && res.data.token) {
      ApiService.setToken(res.data.token);
    }
    return res.data;
  }

  public static async getCurrentUser(): Promise<User> {
    const res = await request<{
      success: boolean;
      data: { user: User };
    }>('/api/auth/me');
    return res.data.user;
  }

  public static async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Backend logout failed, clearing client session anyway:', err);
    } finally {
      ApiService.clearToken();
    }
  }

  // Health and System Status
  static async checkHealth(): Promise<{
    status: string;
    service: string;
    googleConfigured: boolean;
    geminiConfigured: boolean;
    timestamp: string;
  }> {
    try {
      return await request('/api/health');
    } catch (err) {
      return {
        status: 'offline',
        service: 'MeetFlow AI Backend API (Offline)',
        googleConfigured: false,
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

  // Retrieval (User-specific)
  static async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await request<{ success: boolean; data: Meeting[] }>('/api/meetings');
      return res.data || [];
    } catch (err) {
      console.error('API getMeetings error:', err);
      return [];
    }
  }

  static async getMeetingById(id: string): Promise<{
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  }> {
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
      return res.data || [];
    } catch (err) {
      console.error('API getActionItems error:', err);
      return [];
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
      return res.data || [];
    } catch (err) {
      console.error('API getDecisions error:', err);
      return [];
    }
  }

  static async getUnresolvedIssues(): Promise<UnresolvedIssue[]> {
    try {
      const res = await request<{ success: boolean; data: UnresolvedIssue[] }>('/api/unresolved');
      return res.data || [];
    } catch (err) {
      console.error('API getUnresolvedIssues error:', err);
      return [];
    }
  }

  static async getSystemStats(): Promise<SystemStats> {
    try {
      const res = await request<{ success: boolean; data: SystemStats }>('/api/stats');
      return res.data || {
        totalMeetings: 0,
        totalActionItems: 0,
        openItems: 0,
        carriedOverItems: 0,
        completedItems: 0,
        overdueItems: 0,
        ambiguousItems: 0,
        unresolvedIssues: 0
      };
    } catch (err) {
      console.error('API getSystemStats error:', err);
      return {
        totalMeetings: 0,
        totalActionItems: 0,
        openItems: 0,
        carriedOverItems: 0,
        completedItems: 0,
        overdueItems: 0,
        ambiguousItems: 0,
        unresolvedIssues: 0
      };
    }
  }

  // System actions (scoped to user)
  static async loadDemoData(): Promise<{ success: boolean; message: string; alreadyLoaded: boolean; stats: SystemStats }> {
    const res = await request<{
      success: boolean;
      message: string;
      alreadyLoaded: boolean;
      data: SystemStats;
    }>('/api/demo/load', { method: 'POST' });
    return {
      success: res.success,
      message: res.message,
      alreadyLoaded: res.alreadyLoaded,
      stats: res.data
    };
  }

  static async resetToDemo(): Promise<void> {
    await request('/api/demo/reset', { method: 'POST' });
  }

  static async clearAll(): Promise<void> {
    await request('/api/clear', { method: 'POST' });
  }

  static async exportBackup(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/backup`, {
      headers: {
        Authorization: `Bearer ${ApiService.getToken() || ''}`
      }
    });
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
