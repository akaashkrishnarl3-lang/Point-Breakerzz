import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from './services/api';
import { getDemoSession, clearDemoSession, createDemoUser } from './services/demoSession';
import { DEMO_MEETINGS, DEMO_ACTION_ITEMS, DEMO_DECISIONS, DEMO_UNRESOLVED, getDemoStats } from './data/demoData';
import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats, User } from './types';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { AuditTrailModal } from './components/AuditTrailModal';
import { parseRoute, formatRoutePath, RouteLocation, DetailTab, IngestionMode } from './utils/router';

// Views
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { MeetingsView } from './components/views/MeetingsView';
import { MeetingDetailView } from './components/views/MeetingDetailView';
import { ActionTrackerView } from './components/views/ActionTrackerView';
import { DecisionsView } from './components/views/DecisionsView';
import { UnresolvedIssuesView } from './components/views/UnresolvedIssuesView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { NewMeetingView } from './components/views/NewMeetingView';
import { SettingsView } from './components/views/SettingsView';

import confetti from 'canvas-confetti';
import { ShieldCheck, Loader2, Calendar, PlusCircle, Quote } from 'lucide-react';

export function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Structured routing state initialized from current browser URL
  const [currentRoute, setCurrentRoute] = useState<RouteLocation>(() => 
    parseRoute(window.location.pathname, window.location.search)
  );
  const [currentView, setCurrentView] = useState<NavView>(() => {
    const init = parseRoute(window.location.pathname, window.location.search);
    return init.view;
  });

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(() => {
    const init = parseRoute(window.location.pathname, window.location.search);
    return init.meetingId || null;
  });
  const [activeEvidenceHighlight, setActiveEvidenceHighlight] = useState<string | undefined>(() => {
    const init = parseRoute(window.location.pathname, window.location.search);
    return init.highlight;
  });
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab | undefined>(() => {
    const init = parseRoute(window.location.pathname, window.location.search);
    return init.tab;
  });
  const [activeIngestionMode, setActiveIngestionMode] = useState<IngestionMode | undefined>(() => {
    const init = parseRoute(window.location.pathname, window.location.search);
    return init.mode;
  });

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

  // Sync internal state with parsed route location
  const syncRouteState = useCallback((loc: RouteLocation) => {
    setCurrentRoute(loc);
    setCurrentView(loc.view);

    if (loc.meetingId !== undefined) {
      setSelectedMeetingId(loc.meetingId || null);
    }
    if (loc.highlight !== undefined) {
      setActiveEvidenceHighlight(loc.highlight);
    }
    if (loc.tab !== undefined) {
      setActiveDetailTab(loc.tab);
    }
    if (loc.mode !== undefined) {
      setActiveIngestionMode(loc.mode);
    }
  }, []);

  // Central Navigation Dispatcher
  const navigateTo = useCallback((targetPathOrView: string, options?: { replace?: boolean }) => {
    let targetPath = targetPathOrView;

    // Convert short view names like 'dashboard' or 'tracker' to canonical paths
    if (!targetPath.startsWith('/')) {
      targetPath = formatRoutePath(targetPath as NavView);
    }

    if (options?.replace) {
      window.history.replaceState(null, '', targetPath);
    } else {
      window.history.pushState(null, '', targetPath);
    }

    const [cleanPath, queryStr] = targetPath.split('?');
    const loc = parseRoute(cleanPath, queryStr ? `?${queryStr}` : '');
    syncRouteState(loc);
  }, [syncRouteState]);

  // Handle browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const loc = parseRoute(window.location.pathname, window.location.search);
      syncRouteState(loc);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteState]);

  // Load user data from protected APIs or local demo data
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

  // Validate existing session on application startup without resetting active route
  useEffect(() => {
    const verifyExistingSession = async () => {
      const initialPath = window.location.pathname;
      const initialSearch = window.location.search;
      const initialLoc = parseRoute(initialPath, initialSearch);

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

        // Preserve current route; only redirect to /dashboard if on root or login
        if (initialPath === '/login' || initialPath === '/' || initialPath === '') {
          window.history.replaceState(null, '', '/dashboard');
          syncRouteState(parseRoute('/dashboard'));
        } else {
          syncRouteState(initialLoc);
        }
        setIsCheckingAuth(false);
        return;
      }

      // 2. Check for backend token session
      const token = ApiService.getToken();
      if (!token) {
        setUser(null);
        if (initialPath === '/dashboard') {
          window.history.replaceState(null, '', '/login');
        }
        setIsCheckingAuth(false);
        return;
      }

      try {
        const currentUser = await ApiService.getCurrentUser();
        setUser(currentUser);
        await loadData(currentUser);

        // Preserve current route; only redirect to /dashboard if on root or login
        if (initialPath === '/login' || initialPath === '/' || initialPath === '') {
          window.history.replaceState(null, '', '/dashboard');
          syncRouteState(parseRoute('/dashboard'));
        } else {
          syncRouteState(initialLoc);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        ApiService.clearToken();
        clearDemoSession();
        setUser(null);
        if (initialPath === '/dashboard') {
          window.history.replaceState(null, '', '/login');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyExistingSession();
  }, [loadData, syncRouteState]);

  // Auto-select first meeting if viewing Evidence Explorer or Ask Meeting without a specific meetingId
  useEffect(() => {
    if (currentView === 'meeting-detail' && !selectedMeetingId && meetings.length > 0) {
      const defaultMeetingId = meetings[0].id;
      setSelectedMeetingId(defaultMeetingId);
    }
  }, [currentView, selectedMeetingId, meetings]);

  // Load detail for selected meeting
  useEffect(() => {
    if (selectedMeetingId && user) {
      if (user.is_demo || user.isDemo) {
        const meeting = DEMO_MEETINGS.find((m) => m.id === selectedMeetingId) || DEMO_MEETINGS[0];
        const meetingActions = DEMO_ACTION_ITEMS.filter((a) => a.meetingId === meeting?.id);
        const meetingDecisions = DEMO_DECISIONS.filter((d) => d.meetingId === meeting?.id);
        const meetingUnresolved = DEMO_UNRESOLVED.filter((u) => u.meetingId === meeting?.id);
        setSelectedMeetingData({
          meeting,
          actions: meetingActions,
          decisions: meetingDecisions,
          unresolved: meetingUnresolved
        });
      } else {
        ApiService.getMeetingById(selectedMeetingId)
          .then((data) => setSelectedMeetingData(data))
          .catch((err) => {
            console.error('Failed to load meeting details:', err);
            // Fallback to first meeting from list if specific meeting fails
            if (meetings.length > 0) {
              const fallback = meetings[0];
              ApiService.getMeetingById(fallback.id)
                .then(setSelectedMeetingData)
                .catch(console.error);
            }
          });
      }
    } else {
      setSelectedMeetingData(null);
    }
  }, [selectedMeetingId, user, meetings]);

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);

    if (loggedInUser.is_demo || loggedInUser.isDemo) {
      setMeetings(DEMO_MEETINGS);
      setActions(DEMO_ACTION_ITEMS);
      setDecisions(DEMO_DECISIONS);
      setUnresolved(DEMO_UNRESOLVED);
      setStats(getDemoStats());
    } else {
      await loadData(loggedInUser);
    }

    // Direct to requested page or default to /dashboard
    const targetPath = window.location.pathname;
    if (targetPath === '/login' || targetPath === '/' || targetPath === '') {
      navigateTo('/dashboard', { replace: true });
    } else {
      navigateTo(targetPath + window.location.search, { replace: true });
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
      navigateTo('/login', { replace: true });
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
    } catch (err) {
      console.error('Failed to load demo:', err);
    }
  };

  const handleSelectMeeting = (meetingId: string, highlight?: string, tab?: DetailTab) => {
    setSelectedMeetingId(meetingId);
    setActiveEvidenceHighlight(highlight);
    let target = `/meetings/${meetingId}`;
    const params = new URLSearchParams();
    if (tab && tab !== 'overview') params.set('tab', tab);
    if (highlight) params.set('highlight', highlight);
    const qs = params.toString();
    if (qs) target += `?${qs}`;
    navigateTo(target);
  };

  const handleMeetingCreated = async (newMeetingId: string) => {
    await loadData();
    handleSelectMeeting(newMeetingId);
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

  // Derive current effective view title key for Header
  const effectiveHeaderView: NavView = (() => {
    if (currentRoute.path === '/evidence' || currentRoute.tab === 'evidence') return 'evidence';
    if (currentRoute.path === '/ask-meeting' || currentRoute.tab === 'ask') return 'ask-meeting';
    if (currentRoute.path === '/audio-transcript' || activeIngestionMode === 'audio') return 'audio-transcript';
    return currentView;
  })();

  // 3. Authenticated Application
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0D14] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={effectiveHeaderView}
        currentPath={currentRoute.path}
        onNavigate={navigateTo}
        stats={stats}
        onLoadDemo={handleLoadDemo}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={effectiveHeaderView}
          onNavigate={navigateTo}
          onLoadDemo={handleLoadDemo}
          stats={stats}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0A0D14] via-[#0D121F] to-[#0A0D14]">
          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              meetings={meetings}
              actions={actions}
              unresolved={unresolved}
              onNavigate={navigateTo}
              onSelectMeeting={(id) => handleSelectMeeting(id)}
              onInspectItem={(item) => setInspectedItem(item)}
              onLoadDemo={handleLoadDemo}
            />
          )}

          {/* Meeting History Repository */}
          {currentView === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              onSelectMeeting={(id) => handleSelectMeeting(id)}
              onNavigate={navigateTo}
            />
          )}

          {/* Meeting Detail / Evidence Explorer / Grounded Q&A */}
          {currentView === 'meeting-detail' && (
            selectedMeetingData?.meeting ? (
              <MeetingDetailView
                meeting={selectedMeetingData.meeting}
                actions={selectedMeetingData.actions}
                decisions={selectedMeetingData.decisions}
                unresolved={selectedMeetingData.unresolved}
                initialHighlight={activeEvidenceHighlight}
                initialTab={activeDetailTab || 'overview'}
                onTabChange={(tab) => {
                  setActiveDetailTab(tab);
                  if (tab === 'evidence') {
                    window.history.replaceState(null, '', `/evidence?meetingId=${selectedMeetingId}`);
                  } else if (tab === 'ask') {
                    window.history.replaceState(null, '', `/ask-meeting?meetingId=${selectedMeetingId}`);
                  } else {
                    const qs = tab !== 'overview' ? `?tab=${tab}` : '';
                    window.history.replaceState(null, '', `/meetings/${selectedMeetingId}${qs}`);
                  }
                }}
                onBack={() => navigateTo('/meetings')}
                onInspectItem={(item) => setInspectedItem(item)}
              />
            ) : meetings.length === 0 ? (
              <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">No Ingested Meetings Available</h3>
                <p className="text-xs text-slate-400">
                  {currentRoute.tab === 'evidence'
                    ? 'Evidence Explorer requires an ingested meeting transcript to trace citations.'
                    : currentRoute.tab === 'ask'
                    ? 'Ask About This Meeting requires an ingested meeting to ground AI answers.'
                    : 'Please ingest a meeting transcript or load realistic demo data.'}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleLoadDemo}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
                  >
                    Load Demo Data
                  </button>
                  <button
                    onClick={() => navigateTo('/meetings/new')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
                  >
                    Ingest Meeting
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading meeting details...</span>
              </div>
            )
          )}

          {/* Cross-Meeting Accountability & Action Tracker */}
          {currentView === 'tracker' && (
            <ActionTrackerView
              actions={actions}
              meetings={meetings}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight, 'evidence')}
            />
          )}

          {/* Decisions Register */}
          {currentView === 'decisions' && (
            <DecisionsView
              decisions={decisions}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight, 'decisions')}
            />
          )}

          {/* Unresolved Issues & Blockers */}
          {currentView === 'unresolved' && (
            <UnresolvedIssuesView
              unresolved={unresolved}
              onInspectItem={(item) => setInspectedItem(item)}
              onViewMeeting={(mId, highlight) => handleSelectMeeting(mId, highlight, 'unresolved')}
            />
          )}

          {/* Meeting Health & Accountability Analytics */}
          {currentView === 'analytics' && (
            <AnalyticsView
              meetings={meetings}
              onSelectMeeting={(id) => handleSelectMeeting(id)}
            />
          )}

          {/* Ingest New Meeting / Audio -> Transcript */}
          {currentView === 'new-meeting' && (
            <NewMeetingView 
              onMeetingCreated={handleMeetingCreated}
              initialMode={activeIngestionMode || 'paste'}
              onModeChange={(mode) => {
                setActiveIngestionMode(mode);
                if (mode === 'audio') {
                  window.history.replaceState(null, '', '/audio-transcript');
                } else {
                  window.history.replaceState(null, '', '/meetings/new');
                }
              }}
            />
          )}

          {/* Settings & System Engine Config */}
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
          setInspectedItem(null);
          handleSelectMeeting(meetingId, highlight, 'evidence');
        }}
      />
    </div>
  );
}

export default App;
