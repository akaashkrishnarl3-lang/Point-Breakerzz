import { ActionItem, UnresolvedIssue, ActionItemHistoryPoint, Meeting } from '../types';

/**
 * Calculates similarity between two strings based on normalized word token overlap
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  return (2 * intersection) / (words1.size + words2.size);
}

/**
 * Checks if a historical action item matches an item from the new meeting
 */
export function findMatchingHistoricalAction(
  newItem: { task: string; owner: string | null; evidence_text: string },
  historicalItems: ActionItem[]
): ActionItem | null {
  let bestMatch: ActionItem | null = null;
  let highestScore = 0;

  for (const hist of historicalItems) {
    let score = 0;

    // Owner match gives high weight
    const sameOwner =
      newItem.owner &&
      hist.owner &&
      (newItem.owner.toLowerCase().includes(hist.owner.toLowerCase()) ||
       hist.owner.toLowerCase().includes(newItem.owner.toLowerCase()));

    if (sameOwner) {
      score += 0.4;
    }

    // Similarity between tasks
    const taskSim = calculateSimilarity(newItem.task, hist.task);
    score += taskSim * 0.4;

    // Check evidence text overlap (e.g. mention of "database module", "UI", "authentication")
    const evidenceSim = calculateSimilarity(newItem.evidence_text, hist.evidenceText);
    score += evidenceSim * 0.2;

    // Check key topic keywords
    const keywords = ['database', 'ui', 'api', 'auth', 'oauth', 'billing', 'webhook', 'kafka', 'testing', 'dashboard'];
    for (const kw of keywords) {
      const inNew = newItem.evidence_text.toLowerCase().includes(kw) || newItem.task.toLowerCase().includes(kw);
      const inHist = hist.evidenceText.toLowerCase().includes(kw) || hist.task.toLowerCase().includes(kw);
      if (inNew && inHist) {
        score += 0.25;
      }
    }

    if (score > highestScore && score >= 0.5) {
      highestScore = score;
      bestMatch = hist;
    }
  }

  return bestMatch;
}

/**
 * Process Cross-Meeting Reconciliation
 * Connects newly ingested items to previous meetings, updates status and history timelines
 */
export function reconcileCrossMeetingItems(
  newMeeting: Meeting,
  extractedActions: {
    task: string;
    owner: string | null;
    deadline: string | null;
    status: 'NEW' | 'CARRIED_OVER' | 'COMPLETED' | 'AMBIGUOUS' | 'OVERDUE';
    confidence: number;
    evidence_text: string;
    is_ambiguous?: boolean;
    ambiguity_reason?: string;
  }[],
  existingActions: ActionItem[]
): {
  reconciledNewItems: ActionItem[];
  updatedHistoricalItems: ActionItem[];
} {
  const reconciledNewItems: ActionItem[] = [];
  const updatedHistoricalItems: ActionItem[] = [...existingActions];

  for (const item of extractedActions) {
    const historicalMatch = findMatchingHistoricalAction(item, updatedHistoricalItems);

    if (historicalMatch) {
      // Historical item was matched!
      const histIndex = updatedHistoricalItems.findIndex(h => h.id === historicalMatch.id);

      if (item.status === 'COMPLETED') {
        // Spec rule: Do not mark an item completed unless transcript contains evidence of completion
        const newHistoryPoint: ActionItemHistoryPoint = {
          meetingId: newMeeting.id,
          meetingTitle: newMeeting.title,
          date: newMeeting.date,
          status: 'COMPLETED',
          evidenceText: item.evidence_text,
          note: `Completed verified in meeting "${newMeeting.title}"`
        };

        if (histIndex !== -1) {
          updatedHistoricalItems[histIndex] = {
            ...updatedHistoricalItems[histIndex],
            status: 'COMPLETED',
            updatedAt: new Date().toISOString(),
            history: [...updatedHistoricalItems[histIndex].history, newHistoryPoint]
          };
        }
      } else if (item.status === 'CARRIED_OVER') {
        const newHistoryPoint: ActionItemHistoryPoint = {
          meetingId: newMeeting.id,
          meetingTitle: newMeeting.title,
          date: newMeeting.date,
          status: 'CARRIED_OVER',
          evidenceText: item.evidence_text,
          note: item.deadline ? `Carried over to ${item.deadline}` : 'Carried over without explicit deadline'
        };

        if (histIndex !== -1) {
          updatedHistoricalItems[histIndex] = {
            ...updatedHistoricalItems[histIndex],
            status: 'CARRIED_OVER',
            deadline: item.deadline || updatedHistoricalItems[histIndex].deadline,
            updatedAt: new Date().toISOString(),
            history: [...updatedHistoricalItems[histIndex].history, newHistoryPoint]
          };
        }
      }

      // Record this occurrence in the new meeting
      const newItemId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      reconciledNewItems.push({
        id: newItemId,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        task: item.task,
        owner: item.owner || historicalMatch.owner,
        deadline: item.deadline || historicalMatch.deadline,
        status: item.status,
        confidence: item.confidence,
        evidenceText: item.evidence_text,
        linkedItemId: historicalMatch.id,
        isAmbiguous: !!item.is_ambiguous,
        ambiguityReason: item.ambiguity_reason,
        history: [
          ...historicalMatch.history,
          {
            meetingId: newMeeting.id,
            meetingTitle: newMeeting.title,
            date: newMeeting.date,
            status: item.status,
            evidenceText: item.evidence_text,
            note: `Reconciled from previous meeting "${historicalMatch.meetingTitle || 'Prior Meeting'}"`
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Brand new item without prior history
      const newItemId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      reconciledNewItems.push({
        id: newItemId,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        task: item.task,
        owner: item.owner,
        deadline: item.deadline,
        status: item.status,
        confidence: item.confidence,
        evidenceText: item.evidence_text,
        linkedItemId: null,
        isAmbiguous: !!item.is_ambiguous,
        ambiguityReason: item.ambiguity_reason,
        history: [
          {
            meetingId: newMeeting.id,
            meetingTitle: newMeeting.title,
            date: newMeeting.date,
            status: item.status,
            evidenceText: item.evidence_text,
            note: 'Newly created action item'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Check for overdue items among historical open items
  const meetingDateObj = new Date(newMeeting.date);
  for (let i = 0; i < updatedHistoricalItems.length; i++) {
    const item = updatedHistoricalItems[i];
    if (item.status === 'NEW' || item.status === 'CARRIED_OVER') {
      if (item.deadline) {
        // Parse date from deadline if possible (e.g., "2026-10-14")
        const dateMatch = item.deadline.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const itemDeadline = new Date(dateMatch[1]);
          if (itemDeadline < meetingDateObj) {
            updatedHistoricalItems[i] = {
              ...item,
              status: 'OVERDUE',
              history: [
                ...item.history,
                {
                  meetingId: newMeeting.id,
                  meetingTitle: newMeeting.title,
                  date: newMeeting.date,
                  status: 'OVERDUE',
                  evidenceText: 'Deadline has passed without verified completion evidence in current meeting.',
                  note: 'Automatically flagged as OVERDUE'
                }
              ]
            };
          }
        }
      }
    }
  }

  return {
    reconciledNewItems,
    updatedHistoricalItems
  };
}

/**
 * Reconcile Unresolved Issues across meetings
 */
export function reconcileUnresolvedIssues(
  newMeeting: Meeting,
  extractedIssues: { issue: string; owner: string | null; evidence_text: string }[],
  existingIssues: UnresolvedIssue[]
): {
  reconciledNewIssues: UnresolvedIssue[];
  updatedHistoricalIssues: UnresolvedIssue[];
} {
  const reconciledNewIssues: UnresolvedIssue[] = [];
  const updatedHistoricalIssues: UnresolvedIssue[] = [...existingIssues];

  for (const item of extractedIssues) {
    // Find matching prior issue
    let matchIndex = -1;
    let maxSim = 0;

    for (let i = 0; i < updatedHistoricalIssues.length; i++) {
      const hist = updatedHistoricalIssues[i];
      const sim = calculateSimilarity(item.issue, hist.issue);
      if (sim > maxSim && sim >= 0.4) {
        maxSim = sim;
        matchIndex = i;
      }
    }

    const newIssueId = `unres-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    if (matchIndex !== -1) {
      // Re-appeared unresolved issue!
      const matched = updatedHistoricalIssues[matchIndex];
      const appearance = {
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        date: newMeeting.date,
        evidenceText: item.evidence_text
      };

      updatedHistoricalIssues[matchIndex] = {
        ...matched,
        appearances: [...(matched.appearances || []), appearance]
      };

      reconciledNewIssues.push({
        id: newIssueId,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        issue: item.issue,
        owner: item.owner || matched.owner,
        status: 'UNRESOLVED',
        evidenceText: item.evidence_text,
        linkedIssueId: matched.id,
        appearances: [
          ...(matched.appearances || []),
          appearance
        ],
        createdAt: new Date().toISOString()
      });
    } else {
      // First appearance
      reconciledNewIssues.push({
        id: newIssueId,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        issue: item.issue,
        owner: item.owner,
        status: 'UNRESOLVED',
        evidenceText: item.evidence_text,
        linkedIssueId: null,
        appearances: [
          {
            meetingId: newMeeting.id,
            meetingTitle: newMeeting.title,
            date: newMeeting.date,
            evidenceText: item.evidence_text
          }
        ],
        createdAt: new Date().toISOString()
      });
    }
  }

  return {
    reconciledNewIssues,
    updatedHistoricalIssues
  };
}
