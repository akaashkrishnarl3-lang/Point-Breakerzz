import { User } from '../types';

export const DEMO_SESSION_KEY = 'meetflow_demo_session';

export interface DemoSessionData {
  isAuthenticated: boolean;
  isDemo: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function createDemoUser(): User {
  const timestamp = new Date().toISOString();
  return {
    id: 'usr-demo-local',
    name: 'Demo User',
    email: 'demo@meetflow.ai',
    role: 'user',
    provider: 'email',
    is_demo: true,
    isDemo: true,
    created_at: timestamp,
    updated_at: timestamp,
    last_login_at: timestamp
  };
}

export function getDemoSession(): DemoSessionData | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.isAuthenticated || parsed.isDemo)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('[MeetFlow AI] Failed to read demo session from localStorage:', err);
    return null;
  }
}

export function saveDemoSession(): DemoSessionData {
  const session: DemoSessionData = {
    isAuthenticated: true,
    isDemo: true,
    user: {
      name: 'Demo User',
      email: 'demo@meetflow.ai',
      role: 'user'
    }
  };
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('[MeetFlow AI] Failed to write demo session to localStorage:', err);
  }
  return session;
}

export function clearDemoSession(): void {
  try {
    localStorage.removeItem(DEMO_SESSION_KEY);
  } catch (err) {
    console.error('[MeetFlow AI] Failed to clear demo session from localStorage:', err);
  }
}
