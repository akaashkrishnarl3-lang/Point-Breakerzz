import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from './services/api';
import { getDemoSession, clearDemoSession, createDemoUser } from './services/demoSession';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED, getDemoStats } from './data/demoData';
import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, User } from './types';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { AuditTrailModal } from './components/AuditTrailModal';

// Views
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { MeetingsView } from './components/views/MeetingsView';
import { MeetingDetailView } from './components/views/MeetingDetailView';
import { ActionTrackerView } from './components/views/ActionTrackerView';
import { DecisionsView } from './components/views/DecisionsView';
import { UnresolvedIssuesView } from './components/views/UnresolvedIssuesView';
import { NewMeetingView } from './components/views/NewMeetingView';
import { SettingsView } from './components/views/SettingsView';

import confetti from 'canvas-confetti';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Navigation and active item states
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [activeEvidenceHighlight, setActiveEvidenceHighlight] = useState<string | undefined>(undefined);

  // Entities scoped to authenticated user
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedIssue[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalMeetings: 0,
    totalActionItems: 0,
    openItems: 0,
    carriedOverItems: 0,
    completedItems: 0,
    overdueItems: 0,
    ambiguousItems: 0,
    unresolvedIssues: 0
  });

  const [selectedMeetingData, setSelectedMeetingData] = useState<{
    meeting: Meeting | undefined;
    actions: ActionItem[];
    decisions: Decision[];
    unresolved: UnresolvedIssue[];
  } | null>(null);

  const [inspectedItem, setInspectedItem] = useState<ActionItem | Decision | UnresolvedIssue | null>(null);

  // Load user data from protected APIs
  // Load user data from protected APIs (or frontend demo data when in demo mode)
  const loadData = useCallback(async (targetUser?: User | null) => {
    const activeUser = targetUser !== undefined ? targetUser : user;
    if (activeUser?.is_demo || activeUser?.isDemo) {
      setMeetings(DEMO_MEETINGS);
      setActions(DEMO_ACTION_ITEMS);
      setDecisions(DEMO_DECISIONS);
      setUnresolved(DEMO_UNRESOLVED);
      setStats(getDemoStats());
      return;
    }

    try {
      const [loadedMeetings, loadedActions, loadedDecisions, loadedUnresolved, loadedStats] = await Promise.all([
        ApiService.getMeetings(),
        ApiService.getActionItems(),
        ApiService.getDecisions(),
        ApiService.getUnresolvedIssues(),
        ApiService.getSystemStats()
      ]);

      setMeetings(loadedMeetings);
      setActions(loadedActions);
      setDecisions(loadedDecisions);
      setUnresolved(loadedUnresolved);
      setStats(loadedStats);
    } catch (err) {
      console.warn('Could not load user data from API:', err);
    }
  }, [user]);

  // Synchronize browser history and handle route edge cases
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login' && user) {
        window.history.replaceState(null, '', '/dashboard');
        setCurrentView('dashboard');
      } else if (path === '/dashboard' && !user && !isCheckingAuth) {
        window.history.replaceState(null, '', '/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, isCheckingAuth]);

  // Validate existing session on application startup
  useEffect(() => {
    const verifyExistingSession = async () => {
      // 1. Check for local demo session first (100% offline, zero network)
      const demoSession = getDemoSession();
      if (demoSession && (demoSession.isAuthenticated || demoSession.isDemo)) {
        const demoUser = createDemoUser();
        if (demoSession.user) {
          demoUser.name = demoSession.user.name || demoUser.name;
          demoUser.email = demoSession.user.email || demoUser.email;
          demoUser.role = demoSession.user.role || demoUser.role;
        }
        setUser(demoUser);
        setMeetings(DEMO_MEETINGS);
        setActions(DEMO_ACTION_ITEMS);
        setDecisions(DEMO_DECISIONS);
        setUnresolved(DEMO_UNRESOLVED);
        setStats(getDemoStats());
        setCurrentView('dashboard');
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          window.history.replaceState(null, '', '/dashboard');
        }
        setIsCheckingAuth(false);
        return;
      }

      // 2. Check for backend token session
      const token = ApiService.getToken();
      if (!token) {
        setUser(null);
        if (window.location.pathname === '/dashboard') {
          window.history.replaceState(null, '', '/login');
        }
        setIsCheckingAuth(false);
        return;
      }

      try {
        const currentUser = await ApiService.getCurrentUser();
        setUser(currentUser);
        await loadData(currentUser);
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          window.history.replaceState(null, '', '/dashboard');
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        ApiService.clearToken();
        clearDemoSession();
        setUser(null);
        if (window.location.pathname === '/dashboard') {
          window.history.replaceState(null, '', '/login');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyExistingSession();
  }, [loadData]);

  // Load detail for selected meeting
  useEffect(() => {
    if (selectedMeetingId && user) {
      if (user.is_demo || user.isDemo) {
        const meeting = DEMO_MEETINGS.find((m) => m.id === selectedMeetingId);
        const meetingActions = DEMO_ACTION_ITEMS.filter((a) => a.meetingId === selectedMeetingId);
        const meetingDecisions = DEMO_DECISIONS.filter((d) => d.meetingId === selectedMeetingId);
        const meetingUnresolved = DEMO_UNRESOLVED.filter((u) => u.meetingId === selectedMeetingId);
        setSelectedMeetingData({
          meeting,
          actions: meetingActions,
          decisions: meetingDecisions,
          unresolved: meetingUnresolved
        });
      } else {
        ApiService.getMeetingById(selectedMeetingId)
          .then((data) => setSelectedMeetingData(data))
          .catch(console.error);
      }
    } else {
      setSelectedMeetingData(null);
    }
  }, [selectedMeetingId, user]);

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
    window.history.replaceState(null, '', '/dashboard');

    if (loggedInUser.is_demo || loggedInUser.isDemo) {
      // 100% frontend local demo data population with zero network latency
      setMeetings(DEMO_MEETINGS);
      setActions(DEMO_ACTION_ITEMS);
      setDecisions(DEMO_DECISIONS);
      setUnresolved(DEMO_UNRESOLVED);
      setStats(getDemoStats());
    } else {
      await loadData(loggedInUser);
    }
  };

  const handleLogout = async () => {
    try {
      if (!user?.is_demo && !user?.isDemo && ApiService.getToken()) {
        await ApiService.logout();
      }
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      clearDemoSession();
      ApiService.clearToken();
      setUser(null);
      setMeetings([]);
      setActions([]);
      setDecisions([]);
      setUnresolved([]);
      setStats({
        totalMeetings: 0,
        totalActionItems: 0,
        openItems: 0,
        carriedOverItems: 0,
        completedItems: 0,
        overdueItems: 0,
        ambiguousItems: 0,
        unresolvedIssues: 0
      });
      setSelectedMeetingId(null);
      setSelectedMeetingData(null);
      setCurrentView('dashboard');
      window.history.replaceState(null, '', '/login');
    }
  };

  const handleLoadDemo = async () => {
    if (!user) return;

    if (user.is_demo || user.isDemo) {
      setMeetings(DEMO_MEETINGS);
      setActions(DEMO_ACTION_ITEMS);
      setDecisions(DEMO_DECISIONS);
      setUnresolved(DEMO_UNRESOLVED);
      setStats(getDemoStats());
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      setCurrentView('dashboard');
      return;
    }

    try {
      const res = await ApiService.loadDemoData();
      await loadData();
      if (!res.alreadyLoaded) {
        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
      }
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Failed to load demo:', err);
    }
  };

  const handleSelectMeeting = (meetingId: string, highlight?: string) => {
    setSelectedMeetingId(meetingId);
    setActiveEvidenceHighlight(highlight);
    setCurrentView('meeting-detail');
  };

  const handleMeetingCreated = async (newMeetingId: string) => {
    await loadData();
    setSelectedMeetingId(newMeetingId);
    setActiveEvidenceHighlight(undefined);
    setCurrentView('meeting-detail');
  };

  // 1. Initial Authentication Check Loading Screen
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0A0D14] text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4 animate-pulse">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Verifying authentication session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Protected Route Guard -> Show LoginView
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Authenticated Application
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0D14] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'meeting-detail') {
            setSelectedMeetingId(null);
            setActiveEvidenceHighlight(undefined);
          }
        }}
        stats={stats}
        onLoadDemo={handleLoadDemo}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view !== 'meeting-detail') {
              setSelectedMeetingId(null);
              setActiveEvidenceHighlight(undefined);
            }
          }}
          onLoadDemo={handleLoadDemo}
          stats={stats}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0A0D14] via-[#0D121F] to-[#0A0D14]">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              meetings={meetings}
              actions={actions}
              unresolved={unresolved}
              onNavigate={setCurrentView}
              onSelectMeeting={(id) => handleSelectMeeting(id)}
              onInspectItem={(item) => setInspectedItem(item)}
              onLoadDemo={handleLoadDemo}
            />
          )}

          {currentView === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              onSelectMeeting={(id) => handleSelectMeeting(id)}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'meeting-detail' && selectedMeetingData?.meeting && (
            <MeetingDetailView
              meeting={selectedMeetingData.meeting}
              actions={selectedMeetingData.actions}
              decisions={selectedMeetingData.decisions}
              unresolved={selectedMeetingData.unresolved}
              initialHighlight={activeEvidenceHighlight}
              onBack={() => setCurrentView('meetings')}
              onInspectItem={(item) => setInspectedItem(item)}
            />
          )}

          {currentView === 'tracker' && (
            <ActionTrackerView
              actions={actions}
              meetings={meetings}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight)}
            />
          )}

          {currentView === 'decisions' && (
            <DecisionsView
              decisions={decisions}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight)}
            />
          )}

          {currentView === 'unresolved' && (
            <UnresolvedIssuesView
              unresolved={unresolved}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight)}
            />
          )}

          {currentView === 'new-meeting' && (
            <NewMeetingView onMeetingCreated={handleMeetingCreated} />
          )}

          {currentView === 'settings' && (
            <SettingsView onDataReset={loadData} />
          )}
        </main>
      </div>

      {/* Global Audit Trail Modal */}
      <AuditTrailModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onViewMeeting={(meetingId, highlight) => {
          handleSelectMeeting(meetingId, highlight);
        }}
      />
    </div>
  );
}

export default App;
