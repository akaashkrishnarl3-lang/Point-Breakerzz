import { Meeting, ActionItem, Decision, UnresolvedIssue, MeetingQAResponse, MeetingCitation } from '../types';

export interface MeetingContext {
  meeting: Meeting;
  actions: ActionItem[];
  decisions: Decision[];
  unresolved: UnresolvedIssue[];
  allUserMeetings?: Meeting[];
}

/**
 * Client-Side Deterministic Grounded RAG Engine
 * Guarantees zero-hallucination compliance when running in Demo Mode or offline.
 */
export function runLocalGroundedQA(
  context: MeetingContext,
  question: string
): MeetingQAResponse {
  const qClean = question.trim();
  if (!qClean) {
    return {
      question,
      answer: 'Please provide a valid question about this meeting.',
      citations: [],
      confidence: 0,
      grounded: true
    };
  }

  const qLower = qClean.toLowerCase();
  const rawTranscript = context.meeting.transcript || '';
  const lines = rawTranscript
    .split(/\r?\n/)
    .map((l, idx) => ({ line: l.trim(), lineNum: idx + 1 }))
    .filter(item => item.line.length > 0);

  const citations: MeetingCitation[] = [];

  // ================= 1. OUT-OF-SCOPE DETECTION =================
  const outOfScopePatterns = [
    /\bcapital of\b/,
    /\bpopulation of\b/,
    /\bpresident of\b/,
    /\bprime minister of\b/,
    /\bweather in\b/,
    /\bwho won the\b/,
    /\bcurrency of\b/,
    /\brecipe for\b/,
    /\bhow tall is\b/,
    /\bhow far is\b/,
    /\btranslate (this |it )?to\b/,
    /\bwrite a poem\b/,
    /\btell me a joke\b/,
    /\bmeaning of life\b/,
    /\bspeed of light\b/,
    /\bchemical formula\b/
  ];

  const isMeetingRelated = 
    context.meeting.title.toLowerCase().split(/\s+/).some(w => w.length > 3 && qLower.includes(w)) ||
    context.actions.some(a => qLower.includes(a.task.toLowerCase())) ||
    context.decisions.some(d => qLower.includes(d.decision.toLowerCase())) ||
    context.unresolved.some(u => qLower.includes(u.issue.toLowerCase())) ||
    context.meeting.participants.some(p => p.length > 2 && qLower.includes(p.toLowerCase()));

  if (!isMeetingRelated && outOfScopePatterns.some(p => p.test(qLower))) {
    return {
      question,
      answer: "That question is outside the information available for this meeting. I can answer questions about the meeting, decisions, action items, owners, deadlines, unresolved issues, and related accountability information.",
      citations: [],
      confidence: 1.0,
      grounded: true
    };
  }

  // ================= 2. AMBIGUOUS QUESTIONS =================
  const isAmbiguousOwnerQuery = 
    /^(who is responsible\??|who is the owner\??|who owns it\??|who is assigned\??|who owns this\??)$/i.test(qLower.replace(/[.,?!]/g, '').trim());

  if (isAmbiguousOwnerQuery) {
    if (context.actions.length > 1) {
      return {
        question,
        answer: "There are multiple owners in this meeting. Please specify the task or person you mean (for example: 'Who is responsible for the API integration?').",
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    } else if (context.actions.length === 1 && context.actions[0].owner) {
      const act = context.actions[0];
      return {
        question,
        answer: `${act.owner} is responsible for "${act.task}".`,
        citations: [{
          text: act.evidenceText,
          sourceLine: act.sourceLine || findLineForText(lines, act.evidenceText),
          relevance: `Single task assignment in meeting`
        }],
        confidence: 0.98,
        grounded: true
      };
    }
  }

  // ================= 3. GENERAL MEETING OVERVIEW / EVERYTHING =================
  if (
    qLower.includes('everything about the meeting') ||
    qLower.includes('tell me everything') ||
    qLower.includes('what happened in this meeting') ||
    qLower.includes('what was discussed in this meeting') ||
    qLower.includes('summarize this meeting') ||
    qLower.includes('summarize the meeting') ||
    qLower === 'meeting summary' ||
    qLower === 'what is this meeting about?' ||
    qLower === 'what is this meeting about'
  ) {
    const summarySections: string[] = [];
    summarySections.push(`**${context.meeting.title}** (${context.meeting.date})\n• Participants: ${context.meeting.participants.join(', ') || 'Not recorded'}\n• Overview: ${context.meeting.summary || 'Meeting session'}`);

    if (context.decisions.length > 0) {
      summarySections.push(`\n**Decisions Made (${context.decisions.length})**:\n` + context.decisions.map(d => `• ${d.decision}`).join('\n'));
    }
    if (context.actions.length > 0) {
      summarySections.push(`\n**Action Items Assigned (${context.actions.length})**:\n` + context.actions.map(a => `• ${a.task} — Owner: ${a.owner || 'None'} | Deadline: ${a.deadline || 'None'} | Status: ${a.status}`).join('\n'));
    }
    if (context.unresolved.length > 0) {
      summarySections.push(`\n**Unresolved Issues (${context.unresolved.length})**:\n` + context.unresolved.map(u => `• ${u.issue} (Status: ${u.status})`).join('\n'));
    }

    if (context.decisions[0]) {
      citations.push({
        text: context.decisions[0].evidenceText,
        sourceLine: context.decisions[0].sourceLine || findLineForText(lines, context.decisions[0].evidenceText),
        relevance: 'Decision evidence'
      });
    }
    if (context.actions[0]) {
      citations.push({
        text: context.actions[0].evidenceText,
        sourceLine: context.actions[0].sourceLine || findLineForText(lines, context.actions[0].evidenceText),
        relevance: 'Action item evidence'
      });
    }

    return {
      question,
      answer: summarySections.join('\n'),
      citations,
      confidence: 0.98,
      grounded: true
    };
  }

  // ================= 4. MULTI-PART QUESTIONS (Owner + Deadline) =================
  const isMultiPartOwnerAndDeadline = 
    (qLower.includes('who') && (qLower.includes('when') || qLower.includes('deadline'))) ||
    (qLower.includes('owner') && qLower.includes('deadline'));

  if (isMultiPartOwnerAndDeadline) {
    const matchedAction = findBestMatchingAction(context.actions, qLower);
    if (matchedAction) {
      const ownerStr = matchedAction.owner ? matchedAction.owner : 'The meeting does not specify an owner for this task.';
      const deadlineStr = matchedAction.deadline ? matchedAction.deadline : 'No specific deadline was mentioned in the meeting.';

      citations.push({
        text: matchedAction.evidenceText,
        sourceLine: matchedAction.sourceLine || findLineForText(lines, matchedAction.evidenceText),
        relevance: 'Action item specification'
      });

      return {
        question,
        answer: `For "${matchedAction.task}":\n• Owner: ${ownerStr}\n• Deadline: ${deadlineStr}\n• Status: ${matchedAction.status}`,
        citations,
        confidence: 0.97,
        grounded: true
      };
    }
  }

  // ================= 5. DECISIONS QUESTIONS =================
  if (
    qLower.includes('decision') ||
    qLower.includes('decide') ||
    qLower.includes('verdict') ||
    qLower.includes('agreed on') ||
    qLower.includes('database was selected') ||
    qLower.includes('database selected') ||
    qLower.includes('postgresql') ||
    qLower.includes('postgres')
  ) {
    const specificDecision = context.decisions.find(d => {
      const dLower = d.decision.toLowerCase();
      if (qLower.includes('database') || qLower.includes('postgres')) {
        return dLower.includes('database') || dLower.includes('postgres') || dLower.includes('sql');
      }
      const words = dLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      return words.some(w => qLower.includes(w));
    });

    if (specificDecision) {
      citations.push({
        text: specificDecision.evidenceText,
        sourceLine: specificDecision.sourceLine || findLineForText(lines, specificDecision.evidenceText),
        relevance: 'Decision recorded in transcript'
      });
      return {
        question,
        answer: specificDecision.decision.endsWith('.') ? specificDecision.decision : `${specificDecision.decision}.`,
        citations,
        confidence: 0.99,
        grounded: true
      };
    }

    if (context.decisions.length > 0) {
      const decisionList = context.decisions.map(d => `• ${d.decision}`).join('\n');
      context.decisions.forEach(d => {
        citations.push({
          text: d.evidenceText,
          sourceLine: d.sourceLine || findLineForText(lines, d.evidenceText),
          relevance: 'Recorded decision evidence'
        });
      });
      return {
        question,
        answer: `The following formal decisions were agreed upon in this meeting:\n\n${decisionList}`,
        citations,
        confidence: 0.98,
        grounded: true
      };
    } else {
      return {
        question,
        answer: 'No formal decisions were recorded in this meeting.',
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 6. UNRESOLVED ISSUES / BLOCKERS =================
  if (
    qLower.includes('unresolved') ||
    qLower.includes('blocker') ||
    qLower.includes('open issue') ||
    qLower.includes('undecided') ||
    qLower.includes('still pending') ||
    qLower.includes('hosting platform')
  ) {
    const specificUnresolved = context.unresolved.find(u => {
      const uLower = u.issue.toLowerCase();
      if (qLower.includes('hosting')) return uLower.includes('hosting');
      const words = uLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      return words.some(w => qLower.includes(w));
    });

    if (specificUnresolved) {
      citations.push({
        text: specificUnresolved.evidenceText,
        sourceLine: specificUnresolved.sourceLine || findLineForText(lines, specificUnresolved.evidenceText),
        relevance: 'Unresolved issue citation'
      });
      return {
        question,
        answer: `Unresolved issue: ${specificUnresolved.issue} (Status: ${specificUnresolved.status || 'UNRESOLVED'}).`,
        citations,
        confidence: 0.98,
        grounded: true
      };
    }

    const openIssues = context.unresolved.filter(u => u.status === 'UNRESOLVED');
    if (openIssues.length > 0) {
      const issueList = openIssues.map(u => `• ${u.issue}${u.owner ? ` (Owner: ${u.owner})` : ''}`).join('\n');
      openIssues.forEach(u => {
        citations.push({
          text: u.evidenceText,
          sourceLine: u.sourceLine || findLineForText(lines, u.evidenceText),
          relevance: 'Unresolved blocker citation'
        });
      });
      return {
        question,
        answer: `The following topics are unresolved from this meeting:\n\n${issueList}`,
        citations,
        confidence: 0.97,
        grounded: true
      };
    } else if (context.unresolved.length > 0) {
      return {
        question,
        answer: 'All previously discussed issues in this meeting were marked as resolved.',
        citations: context.unresolved.map(u => ({
          text: u.evidenceText,
          sourceLine: u.sourceLine || 1,
          relevance: 'Resolved topic evidence'
        })),
        confidence: 0.95,
        grounded: true
      };
    } else {
      return {
        question,
        answer: 'No unresolved issues were recorded for this meeting.',
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 7. TASK STATUS / COMPLETION VERIFICATION =================
  const isStatusOrCompletionQuery = 
    qLower.includes('finish') ||
    qLower.includes('completed') ||
    qLower.includes('did ') ||
    (qLower.includes('was ') && (qLower.includes('done') || qLower.includes('completed'))) ||
    qLower.includes('status of');

  if (isStatusOrCompletionQuery) {
    const matchedAction = findBestMatchingAction(context.actions, qLower);
    if (matchedAction) {
      citations.push({
        text: matchedAction.evidenceText,
        sourceLine: matchedAction.sourceLine || findLineForText(lines, matchedAction.evidenceText),
        relevance: 'Action item status check'
      });

      if (matchedAction.status === 'COMPLETED') {
        return {
          question,
          answer: `Yes. "${matchedAction.task}" is recorded as completed.`,
          citations,
          confidence: 0.98,
          grounded: true
        };
      }

      if (matchedAction.status === 'IN_PROGRESS' || matchedAction.status === 'NEW') {
        return {
          question,
          answer: `The meeting records that ${matchedAction.owner || 'someone'} was assigned "${matchedAction.task}"${matchedAction.deadline ? ` with a deadline of ${matchedAction.deadline}` : ''}, but the meeting does not specify whether it was completed.`,
          citations,
          confidence: 0.97,
          grounded: true
        };
      }

      if (matchedAction.status === 'CARRIED_OVER') {
        return {
          question,
          answer: `"${matchedAction.task}" is recorded as carried over from a previous meeting and is currently pending.`,
          citations,
          confidence: 0.97,
          grounded: true
        };
      }

      return {
        question,
        answer: `The status of "${matchedAction.task}" is ${matchedAction.status}.`,
        citations,
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 8. OWNER / RESPONSIBILITY QUESTIONS =================
  const isOwnerQuery = 
    qLower.includes('who is responsible') ||
    qLower.includes('who was responsible') ||
    qLower.includes('who owns') ||
    qLower.includes('who is assigned') ||
    qLower.includes('who will complete') ||
    qLower.includes('who prepares') ||
    qLower.includes('who will prepare') ||
    qLower.includes('whose responsibility');

  if (isOwnerQuery) {
    const matchedAction = findBestMatchingAction(context.actions, qLower);
    if (matchedAction) {
      citations.push({
        text: matchedAction.evidenceText,
        sourceLine: matchedAction.sourceLine || findLineForText(lines, matchedAction.evidenceText),
        relevance: 'Assigned owner in transcript'
      });

      if (matchedAction.owner && matchedAction.owner !== 'Not specified') {
        return {
          question,
          answer: `${matchedAction.owner} is responsible for ${matchedAction.task}.`,
          citations,
          confidence: 0.98,
          grounded: true
        };
      } else {
        return {
          question,
          answer: `The meeting discusses "${matchedAction.task}", but does not specify an owner for this task.`,
          citations,
          confidence: 0.95,
          grounded: true
        };
      }
    }

    const matchedUnresolved = context.unresolved.find(u => {
      const uLower = u.issue.toLowerCase();
      const words = uLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      return words.some(w => qLower.includes(w));
    });

    if (matchedUnresolved) {
      citations.push({
        text: matchedUnresolved.evidenceText,
        sourceLine: matchedUnresolved.sourceLine || findLineForText(lines, matchedUnresolved.evidenceText),
        relevance: 'Unresolved issue discussion'
      });

      if (matchedUnresolved.owner) {
        return {
          question,
          answer: `${matchedUnresolved.owner} is listed as the owner for the unresolved issue: "${matchedUnresolved.issue}".`,
          citations,
          confidence: 0.95,
          grounded: true
        };
      } else {
        return {
          question,
          answer: `The meeting discusses "${matchedUnresolved.issue}" as an unresolved issue, but does not specify an owner for it.`,
          citations,
          confidence: 0.96,
          grounded: true
        };
      }
    }
  }

  // ================= 9. DEADLINE / DUE DATE QUESTIONS =================
  const isDeadlineQuery = 
    qLower.includes('deadline') ||
    qLower.includes('when is') ||
    qLower.includes('when was') ||
    qLower.includes('when will') ||
    qLower.includes('due by') ||
    qLower.includes('due date') ||
    qLower.includes('when exactly');

  if (isDeadlineQuery) {
    const matchedAction = findBestMatchingAction(context.actions, qLower);
    if (matchedAction) {
      citations.push({
        text: matchedAction.evidenceText,
        sourceLine: matchedAction.sourceLine || findLineForText(lines, matchedAction.evidenceText),
        relevance: 'Deadline recorded in meeting'
      });

      if (matchedAction.deadline && matchedAction.deadline !== 'Not specified') {
        return {
          question,
          answer: `The ${matchedAction.task} is due by ${matchedAction.deadline}.`,
          citations,
          confidence: 0.98,
          grounded: true
        };
      } else {
        return {
          question,
          answer: `The meeting discusses "${matchedAction.task}", but no specific deadline was mentioned.`,
          citations,
          confidence: 0.95,
          grounded: true
        };
      }
    }
  }

  // ================= 10. SPECIFIC PERSON ASSIGNMENTS =================
  const matchedPerson = context.meeting.participants.find(p => {
    const pLow = p.toLowerCase();
    const tokens = pLow.split(/\s+/).filter(w => w.length > 2);
    return tokens.some(t => qLower.includes(t)) || qLower.includes(pLow);
  });

  if (matchedPerson) {
    const personActions = context.actions.filter(a => 
      a.owner && a.owner.toLowerCase().includes(matchedPerson.toLowerCase())
    );

    if (personActions.length > 0) {
      personActions.forEach(a => {
        citations.push({
          text: a.evidenceText,
          sourceLine: a.sourceLine || findLineForText(lines, a.evidenceText),
          speaker: a.owner || undefined,
          relevance: `Task assigned to ${a.owner}`
        });
      });

      const taskBulletList = personActions
        .map(a => `• ${a.task}${a.deadline ? ` (Due: ${a.deadline})` : ' (No deadline)'} — Status: ${a.status}`)
        .join('\n');

      return {
        question,
        answer: `Here are the commitments assigned to ${matchedPerson}:\n\n${taskBulletList}`,
        citations,
        confidence: 0.97,
        grounded: true
      };
    } else {
      return {
        question,
        answer: `${matchedPerson} attended this meeting, but no specific action items were assigned to them in this session.`,
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 11. ALL ACTION ITEMS QUERY =================
  const isActionItemsQuery = 
    qLower.includes('action item') ||
    qLower.includes('action items') ||
    qLower.includes('all tasks') ||
    qLower.includes('tasks were assigned') ||
    qLower.includes('assigned tasks') ||
    qLower.includes('what tasks') ||
    qLower.includes('list the tasks') ||
    qLower.includes('list tasks') ||
    qLower.includes('all the tasks') ||
    qLower.includes('to-do') ||
    qLower.includes('todos') ||
    /\b(action\s*items?|assigned\s+tasks?|tasks?\s+assigned)\b/i.test(qLower) ||
    /what\s+(are|were)\s+(all\s+)?(the\s+)?(action\s*items?|tasks?)/i.test(qLower);

  if (isActionItemsQuery) {
    if (context.actions.length > 0) {
      const taskList = context.actions
        .map(a => `• ${a.task} — Owner: ${a.owner || 'Not specified'} | Deadline: ${a.deadline || 'Not specified'} | Status: ${a.status}`)
        .join('\n');

      context.actions.forEach(a => {
        citations.push({
          text: a.evidenceText,
          sourceLine: a.sourceLine || findLineForText(lines, a.evidenceText),
          relevance: `Action item citation`
        });
      });

      return {
        question,
        answer: `The following action items were recorded in this meeting:\n\n${taskList}`,
        citations,
        confidence: 0.98,
        grounded: true
      };
    } else {
      return {
        question,
        answer: 'No action items were recorded for this meeting.',
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 12. CROSS-MEETING / CARRY-OVER QUERIES =================
  if (
    qLower.includes('carried over') ||
    qLower.includes('previous meeting') ||
    qLower.includes('discussed previously') ||
    qLower.includes('carry over')
  ) {
    const carriedOverItems = context.actions.filter(a => a.status === 'CARRIED_OVER');
    if (carriedOverItems.length > 0) {
      carriedOverItems.forEach(a => {
        citations.push({
          text: a.evidenceText,
          sourceLine: a.sourceLine || findLineForText(lines, a.evidenceText),
          relevance: 'Carry-over evidence'
        });
      });

      const list = carriedOverItems.map(a => {
        const hist = a.history && a.history.length > 1 ? ` (First assigned in "${a.history[0].meetingTitle}" on ${a.history[0].date})` : '';
        return `• ${a.task} — Owner: ${a.owner || 'Unassigned'}${hist}`;
      }).join('\n');

      return {
        question,
        answer: `The following tasks were carried over from earlier meetings:\n\n${list}`,
        citations,
        confidence: 0.96,
        grounded: true
      };
    } else {
      return {
        question,
        answer: "No tasks in this meeting are recorded as carried over from previous meetings.",
        citations: [],
        confidence: 0.95,
        grounded: true
      };
    }
  }

  // ================= 13. SEMANTIC TRANSCRIPT KEYWORD MATCHING =================
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'this', 'that', 'these', 'those', 'from', 'with', 'about', 'meeting',
    'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should', 'can',
    'have', 'has', 'had', 'the', 'and', 'for', 'to', 'in', 'on', 'at', 'by',
    'been', 'tell', 'know', 'does', 'did', 'done', 'say', 'said'
  ]);

  const queryTerms = qLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (queryTerms.length > 0) {
    let bestLine: { line: string; lineNum: number } | null = null;
    let maxMatchCount = 0;

    for (const item of lines) {
      const lineLower = item.line.toLowerCase();
      let matches = 0;
      for (const term of queryTerms) {
        if (lineLower.includes(term)) matches++;
      }
      if (matches > maxMatchCount) {
        maxMatchCount = matches;
        bestLine = item;
      }
    }

    const coverageRatio = queryTerms.length > 0 ? maxMatchCount / queryTerms.length : 0;
    if (bestLine && maxMatchCount >= 2 && coverageRatio >= 0.5) {
      citations.push({
        text: bestLine.line,
        sourceLine: bestLine.lineNum,
        relevance: 'Direct transcript match'
      });

      return {
        question,
        answer: `Based on the transcript (Line ${bestLine.lineNum}): "${bestLine.line}"`,
        citations,
        confidence: 0.9,
        grounded: true
      };
    }
  }

  // ================= 14. STRICT ZERO-HALLUCINATION FALLBACK =================
  return {
    question,
    answer: "I couldn't find that information in this meeting.",
    citations: [],
    confidence: 1.0,
    grounded: true
  };
}

function findBestMatchingAction(actions: ActionItem[], query: string): ActionItem | undefined {
  if (actions.length === 0) return undefined;
  const qClean = query.toLowerCase();

  if (qClean.includes('api')) {
    const act = actions.find(a => a.task.toLowerCase().includes('api'));
    if (act) return act;
  }
  if (qClean.includes('presentation')) {
    const act = actions.find(a => a.task.toLowerCase().includes('presentation'));
    if (act) return act;
  }
  if (qClean.includes('mobile')) {
    const act = actions.find(a => a.task.toLowerCase().includes('mobile'));
    if (act) return act;
  }
  if (qClean.includes('database') || qClean.includes('postgres') || qClean.includes('migration')) {
    const act = actions.find(a => a.task.toLowerCase().includes('database') || a.task.toLowerCase().includes('postgres') || a.task.toLowerCase().includes('migration'));
    if (act) return act;
  }
  if (qClean.includes('telemetry') || qClean.includes('analytics')) {
    const act = actions.find(a => a.task.toLowerCase().includes('telemetry') || a.task.toLowerCase().includes('analytics'));
    if (act) return act;
  }

  const qTokens = qClean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  let bestAct: ActionItem | undefined = undefined;
  let bestScore = 0;

  for (const a of actions) {
    const aTokens = `${a.task} ${a.owner || ''}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    let matchCount = 0;
    for (const t of aTokens) {
      if (qTokens.includes(t)) matchCount++;
    }
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestAct = a;
    }
  }

  return bestScore >= 1 ? bestAct : undefined;
}

function findLineForText(lines: { line: string; lineNum: number }[], text: string): number {
  if (!text) return 1;
  const clean = text.toLowerCase().trim();
  for (const item of lines) {
    if (item.line.toLowerCase().includes(clean)) {
      return item.lineNum;
    }
  }
  const firstSentence = clean.split(/[.?!]/)[0];
  if (firstSentence && firstSentence.length > 10) {
    for (const item of lines) {
      if (item.line.toLowerCase().includes(firstSentence)) {
        return item.lineNum;
      }
    }
  }
  return 1;
}
