import { ActionItem, UnresolvedIssue, ActionItemHistoryPoint, Meeting, ActionItemMatch, ActionItemStatus } from '../types/index.js';

/**
 * Calculates word-level Jaccard and token similarity between two strings
 */
export function calculateSimilarity(str1: string, str2: string): number {
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

export function findSourceLineNumber(transcript: string, evidence: string): number {
  if (!transcript || !evidence) return 1;
  const lines = transcript.split(/\r?\n/);
  const cleanEvidence = evidence.trim().toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes(cleanEvidence) || cleanEvidence.includes(lineLower.trim())) {
      return i + 1;
    }
  }

  const words = cleanEvidence.split(/\s+/).filter(w => w.length > 3);
  let best = 1;
  let maxW = 0;
  for (let i = 0; i < lines.length; i++) {
    let count = 0;
    const l = lines[i].toLowerCase();
    for (const w of words) {
      if (l.includes(w)) count++;
    }
    if (count > maxW) {
      maxW = count;
      best = i + 1;
    }
  }
  return best;
}

export interface HistoricalMatchResult {
  matchedItem: ActionItem;
  score: number;
  matchReason: string;
  inferredStatus?: ActionItemStatus;
}

/**
 * Checks if a candidate action matches an existing historical action item
 * Considers task semantics, owner, topic keywords, and evidence sentiment (completed vs carried over)
 */
export function findMatchingHistoricalAction(
  newItem: { task: string; owner: string | null; evidence_text: string },
  historicalItems: ActionItem[]
): HistoricalMatchResult | null {
  let bestResult: HistoricalMatchResult | null = null;
  let highestScore = 0;

  const newEvidenceLower = newItem.evidence_text.toLowerCase();
  const newTaskLower = newItem.task.toLowerCase();

  // Detect completion signals
  const isCompletionSignal =
    newEvidenceLower.includes('completed') ||
    newEvidenceLower.includes('has completed') ||
    newEvidenceLower.includes('finished') ||
    newEvidenceLower.includes('has finished') ||
    newEvidenceLower.includes('is done') ||
    newEvidenceLower.includes('passed ci') ||
    newEvidenceLower.includes('passed qa') ||
    newEvidenceLower.includes('merged into main');

  // Detect carry-over signals
  const isCarryOverSignal =
    newEvidenceLower.includes('incomplete') ||
    newEvidenceLower.includes('still incomplete') ||
    newEvidenceLower.includes('needs more time') ||
    newEvidenceLower.includes('need more time') ||
    newEvidenceLower.includes('carrying this over') ||
    newEvidenceLower.includes('carry this over') ||
    newEvidenceLower.includes('delayed') ||
    newEvidenceLower.includes('two more days') ||
    newEvidenceLower.includes('couldn\'t complete') ||
    newEvidenceLower.includes('could not complete');

  // Detect in-progress signals
  const isInProgressSignal =
    newEvidenceLower.includes('working on') ||
    newEvidenceLower.includes('currently building') ||
    newEvidenceLower.includes('in progress');

  for (const hist of historicalItems) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Owner Alignment
    const sameOwner =
      newItem.owner &&
      hist.owner &&
      (newItem.owner.toLowerCase().includes(hist.owner.toLowerCase()) ||
       hist.owner.toLowerCase().includes(newItem.owner.toLowerCase()));

    if (sameOwner) {
      score += 0.35;
      reasons.push(`Shared owner (${hist.owner})`);
    }

    // 2. Task Semantic Similarity
    const taskSim = calculateSimilarity(newItem.task, hist.task);
    score += taskSim * 0.45;
    if (taskSim > 0.3) {
      reasons.push(`Task token similarity (${Math.round(taskSim * 100)}%)`);
    }

    // 3. Evidence Semantic Similarity
    const evidenceSim = calculateSimilarity(newItem.evidence_text, hist.evidenceText);
    score += evidenceSim * 0.25;

    // 4. Topic Domain Keyword Overlap
    const domainKeywords = [
      'database', 'db', 'integration', 'migration', 'postgres', 'schema',
      'ui', 'frontend', 'dashboard', 'wireframe', 'token',
      'api', 'graphql', 'rest', 'openapi', 'federation', 'benchmark',
      'auth', 'oauth', 'jwt', 'security', 'rate limit',
      'billing', 'webhook', 'stripe', 'retry',
      'testing', 'smoke test', 'github actions', 'ci',
      'kafka', 'broker', 'telemetry', 'analytics'
    ];

    let keywordOverlapCount = 0;
    for (const kw of domainKeywords) {
      const inNew = newEvidenceLower.includes(kw) || newTaskLower.includes(kw);
      const inHist = hist.evidenceText.toLowerCase().includes(kw) || hist.task.toLowerCase().includes(kw);
      if (inNew && inHist) {
        score += 0.25;
        keywordOverlapCount++;
      }
    }
    if (keywordOverlapCount > 0) {
      reasons.push(`Domain keyword overlap (${keywordOverlapCount} shared topics)`);
    }

    // Determine status inferred from new evidence
    let inferredStatus: ActionItemStatus | undefined;
    if (isCompletionSignal) {
      inferredStatus = 'COMPLETED';
    } else if (isCarryOverSignal) {
      inferredStatus = 'CARRIED_OVER';
    } else if (isInProgressSignal) {
      inferredStatus = 'IN_PROGRESS';
    }

    if (score > highestScore && score >= 0.45) {
      highestScore = score;
      bestResult = {
        matchedItem: hist,
        score: Math.min(1.0, score),
        matchReason: reasons.join(' • '),
        inferredStatus
      };
    }
  }

  return bestResult;
}

/**
 * Reconciles action items from a new meeting against historical items
 * Connects lineages, creates ActionItemMatch records, and updates historical statuses
 */
export function reconcileCrossMeetingItems(
  newMeeting: Meeting,
  extractedActions: {
    task: string;
    owner: string | null;
    deadline: string | null;
    status: ActionItemStatus;
    confidence: number;
    evidence_text: string;
    source_line?: number;
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
    const sourceLine = item.source_line || findSourceLineNumber(newMeeting.transcript, item.evidence_text);
    const matchResult = findMatchingHistoricalAction(item, updatedHistoricalItems);

    if (matchResult) {
      const historicalMatch = matchResult.matchedItem;
      const histIndex = updatedHistoricalItems.findIndex(h => h.id === historicalMatch.id);
      const effectiveStatus: ActionItemStatus = matchResult.inferredStatus || item.status;

      let historyNote = `Reconciled from previous meeting "${historicalMatch.meetingTitle || 'Prior Meeting'}"`;
      if (effectiveStatus === 'COMPLETED') {
        historyNote = `Verified completed in meeting "${newMeeting.title}" with evidence: "${item.evidence_text}"`;
      } else if (effectiveStatus === 'CARRIED_OVER') {
        historyNote = item.deadline
          ? `Carried over to ${item.deadline} in meeting "${newMeeting.title}"`
          : `Carried over as incomplete in meeting "${newMeeting.title}"`;
      } else if (effectiveStatus === 'IN_PROGRESS') {
        historyNote = `Marked in progress in meeting "${newMeeting.title}"`;
      }

      const newHistoryPoint: ActionItemHistoryPoint = {
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        date: newMeeting.date,
        status: effectiveStatus,
        evidenceText: item.evidence_text,
        sourceLine,
        note: historyNote,
        matchReason: matchResult.matchReason,
        confidence: matchResult.score
      };

      // Update the historical item's status and timeline
      if (histIndex !== -1) {
        updatedHistoricalItems[histIndex] = {
          ...updatedHistoricalItems[histIndex],
          status: effectiveStatus,
          deadline: item.deadline || updatedHistoricalItems[histIndex].deadline,
          updatedAt: new Date().toISOString(),
          history: [...updatedHistoricalItems[histIndex].history, newHistoryPoint]
        };
      }

      // Create Match Record
      const matchRecord: ActionItemMatch = {
        id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        actionItemId: '', // assigned below
        previousActionItemId: historicalMatch.id,
        meetingId: newMeeting.id,
        matchType: effectiveStatus === 'COMPLETED' ? 'COMPLETED' : effectiveStatus === 'CARRIED_OVER' ? 'CARRIED_OVER' : 'IN_PROGRESS',
        matchReason: matchResult.matchReason,
        confidence: matchResult.score,
        evidence: item.evidence_text,
        createdAt: new Date().toISOString()
      };

      const newItemId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      matchRecord.actionItemId = newItemId;

      reconciledNewItems.push({
        id: newItemId,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        task: item.task,
        owner: item.owner || historicalMatch.owner,
        deadline: item.deadline || historicalMatch.deadline,
        status: effectiveStatus,
        confidence: item.confidence,
        evidenceText: item.evidence_text,
        sourceLine,
        linkedItemId: historicalMatch.id,
        match: matchRecord,
        isAmbiguous: !!item.is_ambiguous,
        ambiguityReason: item.ambiguity_reason,
        history: [...historicalMatch.history, newHistoryPoint],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // New action item with initial history point
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
        sourceLine,
        linkedItemId: null,
        match: null,
        isAmbiguous: !!item.is_ambiguous,
        ambiguityReason: item.ambiguity_reason,
        history: [
          {
            meetingId: newMeeting.id,
            meetingTitle: newMeeting.title,
            date: newMeeting.date,
            status: item.status,
            evidenceText: item.evidence_text,
            sourceLine,
            note: 'Initial commitment created in meeting'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Check for overdue items against meeting date
  const meetingDateObj = new Date(newMeeting.date);
  for (let i = 0; i < updatedHistoricalItems.length; i++) {
    const item = updatedHistoricalItems[i];
    if (item.status === 'NEW' || item.status === 'CARRIED_OVER' || item.status === 'IN_PROGRESS') {
      if (item.deadline) {
        const dateMatch = item.deadline.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const itemDeadline = new Date(dateMatch[1]);
          itemDeadline.setHours(23, 59, 59, 999);
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
                  evidenceText: `Deadline (${item.deadline}) passed before meeting date (${newMeeting.date}) without completion confirmation.`,
                  note: 'Automatically flagged as OVERDUE'
                }
              ]
            };
          }
        }
      }
    }
  }

  return { reconciledNewItems, updatedHistoricalItems };
}

/**
 * Reconciles unresolved issues across meetings
 */
export function reconcileUnresolvedIssues(
  newMeeting: Meeting,
  extractedIssues: {
    issue: string;
    owner: string | null;
    evidence_text: string;
    source_line?: number;
  }[],
  existingIssues: UnresolvedIssue[]
): {
  reconciledNewIssues: UnresolvedIssue[];
  updatedHistoricalIssues: UnresolvedIssue[];
} {
  const reconciledNewIssues: UnresolvedIssue[] = [];
  const updatedHistoricalIssues: UnresolvedIssue[] = [...existingIssues];

  for (const item of extractedIssues) {
    const sourceLine = item.source_line || findSourceLineNumber(newMeeting.transcript, item.evidence_text);

    let bestMatch: UnresolvedIssue | null = null;
    let highestScore = 0;

    for (const hist of updatedHistoricalIssues) {
      const issueSim = calculateSimilarity(item.issue, hist.issue);
      const evSim = calculateSimilarity(item.evidence_text, hist.evidenceText);
      const score = issueSim * 0.7 + evSim * 0.3;
      if (score > highestScore && score >= 0.45) {
        highestScore = score;
        bestMatch = hist;
      }
    }

    if (bestMatch) {
      const histIndex = updatedHistoricalIssues.findIndex(h => h.id === bestMatch!.id);
      const newAppearance = {
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        date: newMeeting.date,
        evidenceText: item.evidence_text,
        sourceLine
      };

      if (histIndex !== -1) {
        updatedHistoricalIssues[histIndex] = {
          ...updatedHistoricalIssues[histIndex],
          appearances: [...(updatedHistoricalIssues[histIndex].appearances || []), newAppearance]
        };
      }

      reconciledNewIssues.push({
        id: `unres-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        issue: item.issue,
        owner: item.owner || bestMatch.owner,
        status: 'UNRESOLVED',
        evidenceText: item.evidence_text,
        sourceLine,
        linkedIssueId: bestMatch.id,
        appearances: [...(bestMatch.appearances || []), newAppearance],
        createdAt: new Date().toISOString()
      });
    } else {
      reconciledNewIssues.push({
        id: `unres-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        meetingId: newMeeting.id,
        meetingTitle: newMeeting.title,
        meetingDate: newMeeting.date,
        issue: item.issue,
        owner: item.owner,
        status: 'UNRESOLVED',
        evidenceText: item.evidence_text,
        sourceLine,
        linkedIssueId: null,
        appearances: [
          {
            meetingId: newMeeting.id,
            meetingTitle: newMeeting.title,
            date: newMeeting.date,
            evidenceText: item.evidence_text,
            sourceLine
          }
        ],
        createdAt: new Date().toISOString()
      });
    }
  }

  return { reconciledNewIssues, updatedHistoricalIssues };
}
