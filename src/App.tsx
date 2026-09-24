import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { Meeting, ActionItem, Decision, UnresolvedIssue, SystemStats } from './types';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { AuditTrailModal } from './components/AuditTrailModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { MeetingsView } from './components/views/MeetingsView';
import { MeetingDetailView } from './components/views/MeetingDetailView';
import { ActionTrackerView } from './components/views/ActionTrackerView';
import { DecisionsView } from './components/views/DecisionsView';
import { UnresolvedIssuesView } from './components/views/UnresolvedIssuesView';
import { NewMeetingView } from './components/views/NewMeetingView';
import { SettingsView } from './components/views/SettingsView';

import confetti from 'canvas-confetti';

export function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [activeEvidenceHighlight, setActiveEvidenceHighlight] = useState<string | undefined>(undefined);

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

  const [inspectedItem, setInspectedItem] = useState<ActionItem | Decision | UnresolvedIssue | null>(null);

  const loadData = () => {
    const loadedMeetings = StorageService.getMeetings();
    const loadedActions = StorageService.getActionItems();
    const loadedDecisions = StorageService.getDecisions();
    const loadedUnresolved = StorageService.getUnresolvedIssues();
    const loadedStats = StorageService.getSystemStats();

    setMeetings(loadedMeetings);
    setActions(loadedActions);
    setDecisions(loadedDecisions);
    setUnresolved(loadedUnresolved);
    setStats(loadedStats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadDemo = () => {
    StorageService.resetToDemo();
    loadData();
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
    setCurrentView('dashboard');
  };

  const handleSelectMeeting = (meetingId: string, highlight?: string) => {
    setSelectedMeetingId(meetingId);
    setActiveEvidenceHighlight(highlight);
    setCurrentView('meeting-detail');
  };

  const handleMeetingCreated = (newMeetingId: string) => {
    loadData();
    setSelectedMeetingId(newMeetingId);
    setActiveEvidenceHighlight(undefined);
    setCurrentView('meeting-detail');
  };

  // Find selected meeting details
  const selectedMeetingData = selectedMeetingId
    ? StorageService.getMeetingById(selectedMeetingId)
    : null;

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
