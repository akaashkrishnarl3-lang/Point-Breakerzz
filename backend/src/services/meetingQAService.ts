import { Meeting, ActionItem, Decision, UnresolvedIssue, MeetingQAResponse, MeetingCitation } from '../types/index.js';
import { config } from '../utils/env.js';
import { logger } from '../utils/logger.js';

export interface MeetingContext {
  meeting: Meeting;
  actions: ActionItem[];
  decisions: Decision[];
  unresolved: UnresolvedIssue[];
}

export async function askMeetingQuestion(
  context: MeetingContext,
  question: string
): Promise<MeetingQAResponse> {
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

  // 1. Try Gemini Grounded RAG if API key is present
  const apiKey = config.geminiApiKey;
  if (apiKey && apiKey.trim().length > 10) {
    try {
      logger.info(`Running Gemini Grounded Q&A for meeting "${context.meeting.title}" (Q: "${qClean}")`);
      const response = await callGeminiGroundedQA(context, qClean, apiKey.trim());
      if (response && response.answer) {
        return response;
      }
    } catch (err) {
      logger.warn('Gemini Q&A call failed, falling back to Intelligent Local Grounded Engine:', err);
    }
  }

  // 2. Intelligent Grounded Local RAG Engine
  logger.info(`Running Local Grounded RAG Q&A for meeting "${context.meeting.title}" (Q: "${qClean}")`);
  return runLocalGroundedQA(context, qClean);
}

async function callGeminiGroundedQA(
  context: MeetingContext,
  question: string,
  apiKey: string
): Promise<MeetingQAResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptContext = `MEETING TITLE: ${context.meeting.title}
MEETING DATE: ${context.meeting.date}
PARTICIPANTS: ${context.meeting.participants.join(', ')}

TRANSCRIPT:
${context.meeting.transcript}

RECORDED DECISIONS:
${context.decisions.map((d, i) => `${i + 1}. ${d.decision} (Evidence: "${d.evidenceText}")`).join('\n') || 'None'}

RECORDED ACTION ITEMS:
${context.actions.map((a, i) => `${i + 1}. Task: ${a.task} | Owner: ${a.owner || 'Not specified'} | Deadline: ${a.deadline || 'Not specified'} | Status: ${a.status} (Evidence: "${a.evidenceText}")`).join('\n') || 'None'}

RECORDED UNRESOLVED ISSUES:
${context.unresolved.map((u, i) => `${i + 1}. Issue: ${u.issue} | Status: ${u.status} (Evidence: "${u.evidenceText}")`).join('\n') || 'None'}`;

  const systemInstruction = `You are the MeetFlow AI Grounded Meeting Assistant.
Your task is to answer questions strictly based on the provided meeting transcript and extracted facts.

CRITICAL ZERO-HALLUCINATION RULES:
1. Answer using ONLY information explicitly stated in the provided transcript or facts.
2. If the user asks about something NOT mentioned in this meeting, reply EXACTLY:
   "I couldn't find that information in this meeting transcript."
3. Do NOT invent, assume, or infer facts not explicitly confirmed.
4. Always provide the exact verbatim supporting quote from the transcript as citation when possible.
5. Return JSON matching:
{
  "answer": "Direct, clear answer strictly grounded in the meeting.",
  "citations": [
    {
      "text": "Exact quote from transcript",
      "relevance": "Why this quote supports the answer"
    }
  ],
  "confidence": 0.95,
  "grounded": true
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${promptContext}\n\nUSER QUESTION: ${question}\n\nRespond in JSON only.` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}`);
  }

  const json: any = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  const parsed = JSON.parse(text);
  return {
    question,
    answer: parsed.answer || "I couldn't find that information in this meeting transcript.",
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
    grounded: true
  };
}

/**
 * Intelligent Local Grounded RAG Engine
 * Guarantees zero-hallucination answers when operating offline or without Gemini API key.
 */
export function runLocalGroundedQA(
  context: MeetingContext,
  question: string
): MeetingQAResponse {
  const qLower = question.toLowerCase();
  const lines = context.meeting.transcript
    .split(/\r?\n/)
    .map((l, idx) => ({ line: l.trim(), lineNum: idx + 1 }))
    .filter(item => item.line.length > 0);

  const citations: MeetingCitation[] = [];

  // 1. Decisions Query
  if (
    qLower.includes('decision') ||
    qLower.includes('decide') ||
    qLower.includes('verdict') ||
    qLower.includes('agreed on')
  ) {
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
    }
  }

  // 2. Unresolved Issues / Blockers Query
  if (
    qLower.includes('unresolved') ||
    qLower.includes('blocker') ||
    qLower.includes('open issue') ||
    qLower.includes('undecided') ||
    qLower.includes('pending')
  ) {
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
        answer: `The following topics remain unresolved from this meeting:\n\n${issueList}`,
        citations,
        confidence: 0.96,
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
    }
  }

  // 3. Person / Task Assignments Query (e.g., "What was assigned to Rahul?", "Rahul tasks")
  const cleanWords = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const matchedActions = context.actions.filter(a => {
    if (!a.owner || a.owner === 'Not specified') return false;
    const ownerLower = a.owner.toLowerCase();
    const ownerTokens = ownerLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    return ownerTokens.some(token => cleanWords.includes(token)) || cleanWords.some(w => ownerLower.includes(w));
  });

  if (matchedActions.length > 0) {
    const ownerName = matchedActions[0].owner;
    const taskList = matchedActions
      .map(
        a =>
          `• ${a.task}${a.deadline ? ` [Deadline: ${a.deadline}]` : ''} (Status: ${a.status})`
      )
      .join('\n');

    matchedActions.forEach(a => {
      citations.push({
        text: a.evidenceText,
        sourceLine: a.sourceLine || findLineForText(lines, a.evidenceText),
        speaker: a.owner || undefined,
        relevance: `Commitment assigned to ${a.owner}`
      });
    });

    return {
      question,
      answer: `Here are the commitments assigned to ${ownerName}:\n\n${taskList}`,
      citations,
      confidence: 0.95,
      grounded: true
    };
  }

  // 4. Deadline / Due Date Queries
  if (qLower.includes('deadline') || qLower.includes('when is') || qLower.includes('due')) {
    const matchingAction = context.actions.find(a => {
      const taskWords = a.task.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      return taskWords.some(w => cleanWords.includes(w));
    });

    if (matchingAction && matchingAction.deadline) {
      citations.push({
        text: matchingAction.evidenceText,
        sourceLine: matchingAction.sourceLine || findLineForText(lines, matchingAction.evidenceText),
        relevance: 'Deadline commitment in transcript'
      });
      return {
        question,
        answer: `The deadline for "${matchingAction.task}" is ${matchingAction.deadline}.`,
        citations,
        confidence: 0.97,
        grounded: true
      };
    }
  }

  // 5. Semantic Transcript Keyword Search
  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'this', 'that', 'these', 'those', 'from', 'with', 'about', 'meeting',
    'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should', 'can',
    'have', 'has', 'had', 'the', 'and', 'for', 'to', 'in', 'on', 'at', 'by',
    'building', 'doing', 'saying', 'talking', 'discussing', 'mention', 'mentioned'
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
    if (bestLine && (maxMatchCount >= 2 || (queryTerms.length === 1 && maxMatchCount === 1)) && coverageRatio >= 0.5) {
      citations.push({
        text: bestLine.line,
        sourceLine: bestLine.lineNum,
        relevance: 'Direct transcript match'
      });

      return {
        question,
        answer: `Based on the transcript: "${bestLine.line}"`,
        citations,
        confidence: 0.9,
        grounded: true
      };
    }
  }

  // Strict Zero-Hallucination Fallback
  return {
    question,
    answer: "I couldn't find that information in this meeting transcript.",
    citations: [],
    confidence: 1.0,
    grounded: true
  };
}

function findLineForText(lines: { line: string; lineNum: number }[], text: string): number {
  if (!text) return 1;
  const clean = text.toLowerCase();
  for (const item of lines) {
    if (item.line.toLowerCase().includes(clean)) {
      return item.lineNum;
    }
  }
  return 1;
}
