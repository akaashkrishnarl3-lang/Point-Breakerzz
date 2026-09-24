export type ActionItemStatus = 'NEW' | 'CARRIED_OVER' | 'COMPLETED' | 'OVERDUE' | 'AMBIGUOUS';

export interface ActionItemHistoryPoint {
  meetingId: string;
  meetingTitle: string;
  date: string;
  status: ActionItemStatus;
  evidenceText: string;
  note?: string;
}

export interface ActionItem {
  id: string;
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
  linkedItemId?: string | null;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  history: ActionItemHistoryPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  meetingDate?: string;
  decision: string;
  evidenceText: string;
  createdAt: string;
}

export interface UnresolvedIssue {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  meetingDate?: string;
  issue: string;
  owner: string | null;
  status: 'UNRESOLVED' | 'RESOLVED';
  evidenceText: string;
  linkedIssueId?: string | null;
  resolvedByDecisionId?: string;
  appearances?: {
    meetingId: string;
    meetingTitle: string;
    date: string;
    evidenceText: string;
  }[];
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  transcript: string;
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
  }[];
  action_items: {
    task: string;
    owner: string | null;
    deadline: string | null;
    status: ActionItemStatus;
    confidence: number;
    evidence_text: string;
    is_ambiguous?: boolean;
    ambiguity_reason?: string;
  }[];
  unresolved_issues: {
    issue: string;
    owner: string | null;
    evidence_text: string;
  }[];
}

export interface FilterOptions {
  search: string;
  status: ActionItemStatus | 'ALL';
  owner: string;
  meetingId: string;
}

export interface SystemStats {
  totalMeetings: number;
  totalActionItems: number;
  openItems: number;
  carriedOverItems: number;
  completedItems: number;
  overdueItems: number;
  unresolvedIssues: number;
  ambiguousItems: number;
}
