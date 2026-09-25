import { ExtractionResult } from '../types/index.js';
import { config } from '../utils/env.js';
import { logger } from '../utils/logger.js';
import { findSourceLineNumber } from './crossMeetingTracker.js';

export interface ExtractionOptions {
  apiKey?: string;
  model?: string;
}

export async function extractMeetingData(
  transcript: string,
  meetingTitle: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  const apiKey = options.apiKey || config.geminiApiKey;

  // Try real Gemini API if key is present
  if (apiKey && apiKey.trim().length > 10) {
    try {
      logger.info('Calling Gemini API for transcript extraction...');
      const result = await callGeminiApi(transcript, meetingTitle, apiKey.trim());
      if (isValidExtractionResult(result)) {
        logger.info('Gemini API extraction successful.');
        // Ensure source lines are attached
        for (const d of result.decisions) {
          if (!d.source_line) d.source_line = findSourceLineNumber(transcript, d.evidence_text);
        }
        for (const a of result.action_items) {
          if (!a.source_line) a.source_line = findSourceLineNumber(transcript, a.evidence_text);
          if (!a.owner) a.owner = null;
          if (!a.deadline) a.deadline = null;
        }
        for (const u of result.unresolved_issues) {
          if (!u.source_line) u.source_line = findSourceLineNumber(transcript, u.evidence_text);
        }
        return result;
      }
    } catch (err) {
      logger.warn('Gemini API call failed, falling back to Intelligent Local Extractor:', err);
    }
  }

  // Fallback to grounded local heuristic NLP extractor (100% deterministic, offline-capable)
  logger.info('Running Intelligent Grounded Local Extractor...');
  return runGroundedLocalExtractor(transcript, meetingTitle);
}

function isValidExtractionResult(data: any): data is ExtractionResult {
  return (
    data &&
    typeof data.summary === 'string' &&
    Array.isArray(data.decisions) &&
    Array.isArray(data.action_items) &&
    Array.isArray(data.unresolved_issues)
  );
}

async function callGeminiApi(transcript: string, title: string, apiKey: string): Promise<ExtractionResult> {
  const systemPrompt = `You are a meeting accountability extraction engine.
Read ONLY the provided transcript.
Return valid JSON matching the required schema.
Extract only facts supported by the transcript.
Do not infer commitments from casual suggestions.
Do not invent owners, dates, deadlines or decisions.
If an owner is unclear or not specified, set owner to null and explain ambiguity in the evidence/notes.
If a deadline is absent or not specified, set deadline to null.
Every decision/action/unresolved issue must include evidence_text copied verbatim from the transcript.

SCHEMA:
{
  "summary": "High-level summary of the meeting",
  "decisions": [
    {
      "decision": "Formal decision made",
      "evidence_text": "Exact sentence from transcript"
    }
  ],
  "action_items": [
    {
      "task": "Specific task description",
      "owner": "Person name or null",
      "deadline": "Deadline text or null",
      "status": "NEW" | "IN_PROGRESS" | "CARRIED_OVER" | "COMPLETED" | "AMBIGUOUS",
      "confidence": 0.95,
      "evidence_text": "Exact sentence from transcript",
      "is_ambiguous": false,
      "ambiguity_reason": "Explanation if ambiguous, otherwise null"
    }
  ],
  "unresolved_issues": [
    {
      "issue": "Undecided or open issue",
      "owner": "Person name or null",
      "evidence_text": "Exact sentence from transcript"
    }
  ]
}`;

  const prompt = `Meeting Title: ${title}\n\nTranscript:\n${transcript}\n\nExtract accountability information according to the strict contract. Output only raw JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const json: any = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(text);
}

/**
 * Intelligent Grounded Local Extractor
 * Follows the exact build specification rules:
 * - Extracts only grounded facts with exact transcript evidence quotes
 * - Never hallucinates or invents people or dates
 * - Categorizes commitments, completions, delays, decisions, and ambiguities
 */
export function runGroundedLocalExtractor(transcript: string, title: string): ExtractionResult {
  const lines = transcript
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const decisions: ExtractionResult['decisions'] = [];
  const actionItems: ExtractionResult['action_items'] = [];
  const unresolvedIssues: ExtractionResult['unresolved_issues'] = [];

  // Sentence split for evidence tracking
  const rawSentences = transcript
    .replace(/([.?!])\s+/g, "$1|")
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const participantNames = new Set<string>();

  // Extract participants from speaker patterns like "Alex Chen [10:00 AM]:" or "Rahul Sharma:"
  for (const line of lines) {
    const speakerMatch = line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)(?:\s*\([^)]*\))?(?:\s*\[[^\]]+\])?\s*:/);
    if (speakerMatch && speakerMatch[1]) {
      const name = speakerMatch[1].replace(/\s*\([^)]*\)/, '').trim();
      if (!['Welcome', 'Agreed', 'Thanks', 'Sprint', 'Good', 'Yes', 'Also'].includes(name)) {
        participantNames.add(name);
      }
    }
  }

  for (const sentence of rawSentences) {
    const lower = sentence.toLowerCase();
    const sourceLine = findSourceLineNumber(transcript, sentence);

    // 1. DECISIONS DETECTION
    if (
      (lower.includes('decided to') ||
       lower.includes('firm decision') ||
       lower.includes('agreed to use') ||
       lower.includes('agreed to adopt') ||
       lower.includes('verdict is') ||
       lower.includes('finally agreed')) &&
      !lower.includes('haven\'t decided') &&
      !lower.includes('still undecided') &&
      !lower.includes('not decided')
    ) {
      let cleanDecision = sentence;
      if (sentence.includes(':')) {
        const parts = sentence.split(':');
        cleanDecision = parts[parts.length - 1].trim();
      }
      cleanDecision = cleanDecision.replace(/^(let's make that a firm decision:?|we decided to|as a team, we decided to|agreed\.\s*)/i, '').trim();
      cleanDecision = cleanDecision.charAt(0).toUpperCase() + cleanDecision.slice(1);

      decisions.push({
        decision: cleanDecision,
        evidence_text: sentence,
        source_line: sourceLine
      });
      continue;
    }

    // 2. UNRESOLVED ISSUES DETECTION
    if (
      lower.includes('undecided') ||
      lower.includes('haven\'t decided') ||
      lower.includes('have not decided') ||
      lower.includes('debate over') ||
      lower.includes('remains pending') ||
      lower.includes('still waiting on')
    ) {
      let issueText = sentence;
      if (sentence.includes(':')) {
        const parts = sentence.split(':');
        issueText = parts[parts.length - 1].trim();
      }

      let issueOwner: string | null = null;
      for (const name of participantNames) {
        if (sentence.includes(name)) {
          issueOwner = name;
          break;
        }
      }

      unresolvedIssues.push({
        issue: issueText,
        owner: issueOwner,
        evidence_text: sentence,
        source_line: sourceLine
      });
      continue;
    }

    // 3. ACTION ITEMS & COMPLETIONS (Speaker or passive completion)
    // A. Explicit Speaker Completion: "Rahul completed the database integration"
    const completedMatch = sentence.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(completed|finished|shipped|merged)\s+(?:the\s+)?([^.,]+)/i);
    if (completedMatch && !lower.includes('haven\'t') && !lower.includes('couldn\'t')) {
      const ownerCandidate = completedMatch[1].trim();
      const taskDesc = completedMatch[3].trim();

      actionItems.push({
        task: `Completed: ${taskDesc}`,
        owner: ownerCandidate,
        deadline: null,
        status: 'COMPLETED',
        confidence: 0.98,
        evidence_text: sentence,
        source_line: sourceLine,
        is_ambiguous: false
      });
      continue;
    }

    // B. Passive Completion: "The database integration has been completed"
    if (
      (lower.includes('has been completed') || lower.includes('is completed') || lower.includes('have been completed')) &&
      !lower.includes('not completed') &&
      !lower.includes('incomplete')
    ) {
      let taskDesc = sentence;
      if (sentence.includes(':')) {
        taskDesc = sentence.split(':').slice(1).join(':').trim();
      }
      actionItems.push({
        task: taskDesc,
        owner: null,
        deadline: null,
        status: 'COMPLETED',
        confidence: 0.96,
        evidence_text: sentence,
        source_line: sourceLine,
        is_ambiguous: false
      });
      continue;
    }

    // C. Carried Over / Incomplete: "The database integration is still incomplete" or "Rahul needs more time"
    if (
      lower.includes('still incomplete') ||
      lower.includes('is incomplete') ||
      lower.includes('needs more time') ||
      lower.includes('need more time') ||
      lower.includes('carrying this over') ||
      lower.includes('couldn\'t complete') ||
      lower.includes('could not complete') ||
      lower.includes('delayed')
    ) {
      let ownerCandidate: string | null = null;
      for (const name of participantNames) {
        if (sentence.includes(name)) {
          ownerCandidate = name;
          break;
        }
      }

      const deadlineMatch = sentence.match(/\bby\s+([A-Z][a-z]+(?:\s+(?:morning|afternoon|evening|next\s+week))?|\d{4}-\d{2}-\d{2})/i);
      const deadline = deadlineMatch ? deadlineMatch[1] : null;

      let cleanTask = sentence;
      if (sentence.includes(':')) {
        cleanTask = sentence.split(':').slice(1).join(':').trim();
      }

      actionItems.push({
        task: cleanTask,
        owner: ownerCandidate,
        deadline: deadline,
        status: 'CARRIED_OVER',
        confidence: 0.94,
        evidence_text: sentence,
        source_line: sourceLine,
        is_ambiguous: false
      });
      continue;
    }

    // D. Future Commitments: "Rahul will complete the database integration by Friday"
    const commitmentMatch = sentence.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+will\s+([a-zA-Z0-9_\-\s]{6,80}?)(?:\s+by\s+([A-Z][a-z]+(?:\s+(?:afternoon|morning|evening|next\s+week))?|\d{4}-\d{2}-\d{2}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+))?([.,]|$)/i);
    if (commitmentMatch) {
      const ownerCandidate = commitmentMatch[1].trim();
      const taskRaw = commitmentMatch[2].trim();
      const deadlineRaw = commitmentMatch[3] ? commitmentMatch[3].trim() : null;

      if (!['Agreed', 'Thanks', 'Yes', 'Also', 'Now', 'First', 'Next'].includes(ownerCandidate)) {
        actionItems.push({
          task: taskRaw.charAt(0).toUpperCase() + taskRaw.slice(1),
          owner: ownerCandidate,
          deadline: deadlineRaw ? `by ${deadlineRaw}` : null,
          status: 'NEW',
          confidence: 0.95,
          evidence_text: sentence,
          source_line: sourceLine,
          is_ambiguous: false
        });
        continue;
      }
    }

    // E. In-Progress items: "Priya is working on the dashboard UI"
    const inProgressMatch = sentence.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+is\s+(?:currently\s+)?(working on|building|implementing)\s+([^.,]+)/i);
    if (inProgressMatch) {
      const ownerCandidate = inProgressMatch[1].trim();
      const taskDesc = inProgressMatch[3].trim();
      if (!['Agreed', 'Thanks'].includes(ownerCandidate)) {
        actionItems.push({
          task: `In Progress: ${taskDesc}`,
          owner: ownerCandidate,
          deadline: null,
          status: 'IN_PROGRESS',
          confidence: 0.92,
          evidence_text: sentence,
          source_line: sourceLine,
          is_ambiguous: false
        });
        continue;
      }
    }

    // 4. AMBIGUOUS ACTION ITEMS DETECTION
    if (
      lower.includes('someone should') ||
      lower.includes('somebody should') ||
      lower.includes('somebody needs to') ||
      lower.includes('someone needs to') ||
      lower.includes('we should probably') ||
      lower.includes('should probably look at')
    ) {
      let ambiguousTask = sentence;
      if (sentence.includes(':')) {
        const parts = sentence.split(':');
        ambiguousTask = parts[parts.length - 1].trim();
      }

      actionItems.push({
        task: ambiguousTask,
        owner: null,
        deadline: null,
        status: 'AMBIGUOUS',
        confidence: 0.70,
        evidence_text: sentence,
        source_line: sourceLine,
        is_ambiguous: true,
        ambiguity_reason: 'Unassigned suggestion. No individual owner or specific calendar deadline committed.'
      });
      continue;
    }
  }

  const summary = `Meeting: "${title}". Extracted ${actionItems.length} action item(s), ${decisions.length} formal decision(s), and ${unresolvedIssues.length} open issue(s). Grounded strictly in transcript evidence with zero unverified claims.`;

  return {
    summary,
    decisions,
    action_items: actionItems,
    unresolved_issues: unresolvedIssues
  };
}
