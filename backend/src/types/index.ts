export interface User {
  id: string;
  google_sub?: string;
  password?: string;
  name: string;
  email: string;
  profile_picture?: string;
  provider: 'google' | 'email';
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export type ActionItemStatus = 'NEW' | 'IN_PROGRESS' | 'CARRIED_OVER' | 'COMPLETED' | 'OVERDUE' | 'AMBIGUOUS';

export interface ActionItemMatch {
  id: string;
  actionItemId: string;
  previousActionItemId: string;
  meetingId: string;
  matchType: 'CARRIED_OVER' | 'COMPLETED' | 'IN_PROGRESS' | 'RECONCILED';
  matchReason: string;
  confidence: number;
  evidence: string;
  createdAt: string;
}

export interface ActionItemHistoryPoint {
  meetingId: string;
  meetingTitle: string;
  date: string;
  status: ActionItemStatus;
  evidenceText: string;
  sourceLine?: number;
  note?: string;
  matchReason?: string;
  confidence?: number;
}

export interface ActionItem {
  id: string;
  userId?: string;
  demo_key?: string;
  meetingId: string;
  meetingTitle?: string;
  meetingDate?: string;
  task: string;
  owner: string | null;
  deadline: string | null;
  status: ActionItemStatus;
  confidence: number;
  evidenceText: string;
  evidenceStart?: number;
  evidenceEnd?: number;
  sourceLine?: number;
  linkedItemId?: string | null;
  match?: ActionItemMatch | null;
  matches?: ActionItemMatch[];
  isAmbiguous: boolean;
  ambiguityReason?: string;
  history: ActionItemHistoryPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  userId?: string;
  demo_key?: string;
  meetingId: string;
  meetingTitle?: string;
  meetingDate?: string;
  decision: string;
  evidenceText: string;
  sourceLine?: number;
  createdAt: string;
}

export interface UnresolvedIssue {
  id: string;
  userId?: string;
  demo_key?: string;
  meetingId: string;
  meetingTitle?: string;
  meetingDate?: string;
  issue: string;
  owner: string | null;
  status: 'UNRESOLVED' | 'RESOLVED';
  evidenceText: string;
  sourceLine?: number;
  linkedIssueId?: string | null;
  resolvedByDecisionId?: string;
  appearances?: {
    meetingId: string;
    meetingTitle: string;
    date: string;
    evidenceText: string;
    sourceLine?: number;
  }[];
  createdAt: string;
}

export interface Meeting {
  id: string;
  userId?: string;
  demo_key?: string;
  title: string;
  date: string;
  participants: string[];
  transcript: string;
  audioFileName?: string;
  audioDuration?: number;
  summary: string;
  actionItemsCount?: number;
  decisionsCount?: number;
  unresolvedCount?: number;
  createdAt: string;
}

export interface ExtractionResult {
  summary: string;
  decisions: {
    decision: string;
    evidence_text: string;
    source_line?: number;
  }[];
  action_items: {
    task: string;
    owner: string | null;
    deadline: string | null;
    status: ActionItemStatus;
    confidence: number;
    evidence_text: string;
    source_line?: number;
    is_ambiguous?: boolean;
    ambiguity_reason?: string;
  }[];
  unresolved_issues: {
    issue: string;
    owner: string | null;
    evidence_text: string;
    source_line?: number;
  }[];
}

export interface FilterOptions {
  search?: string;
  status?: ActionItemStatus | 'ALL';
  owner?: string;
  meetingId?: string;
  dateRange?: 'all' | '7d' | '30d' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface SystemStats {
  totalMeetings: number;
  totalActionItems: number;
  openItems: number;
  inProgressItems?: number;
  carriedOverItems: number;
  completedItems: number;
  overdueItems: number;
  unresolvedIssues: number;
  ambiguousItems: number;
}

export interface MeetingAnalytics {
  totalMeetings: number;
  totalActionItems: number;
  completedItems: number;
  inProgressItems: number;
  carriedOverItems: number;
  overdueItems: number;
  unresolvedIssues: number;
  openItems: number;
  ambiguousItems: number;
  completionRate: number;
  averageActionItemsPerMeeting: number;
  meetingsWithUnresolvedCommitments: {
    meetingId: string;
    title: string;
    date: string;
    unresolvedCount: number;
    overdueCount: number;
  }[];
  statusDistribution: {
    status: ActionItemStatus;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  completedVsPending: {
    completed: number;
    pending: number;
    overdue: number;
  };
  actionItemsByMeeting: {
    meetingId: string;
    title: string;
    date: string;
    total: number;
    completed: number;
    carriedOver: number;
    overdue: number;
  }[];
  timeline: {
    date: string;
    meetingTitle: string;
    totalActions: number;
    completed: number;
    overdue: number;
    carriedOver: number;
  }[];
  ownersBreakdown: {
    owner: string;
    total: number;
    completed: number;
    overdue: number;
    inProgress: number;
  }[];
}

export interface MeetingCitation {
  text: string;
  sourceLine?: number;
  speaker?: string;
  relevance: string;
}

export interface MeetingQAResponse {
  question: string;
  answer: string;
  citations: MeetingCitation[];
  confidence: number;
  grounded: boolean;
}

export interface EvidenceItem {
  id: string;
  category: 'ACTION_ITEM' | 'DECISION' | 'UNRESOLVED_ISSUE';
  title: string;
  owner?: string;
  deadline?: string;
  status?: string;
  confidence?: number;
  evidenceText: string;
  sourceLine: number;
  isAmbiguous?: boolean;
  ambiguityReason?: string;
}

export interface MeetingEvidenceResponse {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  transcript: string;
  totalEvidenceItems: number;
  items: EvidenceItem[];
}

