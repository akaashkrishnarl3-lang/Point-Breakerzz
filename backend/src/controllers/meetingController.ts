import { Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService.js';
import { extractMeetingData } from '../services/extractorService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

export async function getMeetings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const meetings = StorageService.getMeetings(userId);
    res.json({ success: true, data: meetings });
  } catch (err) {
    next(err);
  }
}

export async function getMeetingById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const meetingData = StorageService.getMeetingById(userId, id);
    if (!meetingData.meeting) {
      res.status(404).json({ success: false, error: `Meeting with ID ${id} not found.` });
      return;
    }
    res.json({ success: true, data: meetingData });
  } catch (err) {
    next(err);
  }
}

export async function extractMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { transcript, title } = req.body;
    logger.info(`Extracting meeting accountability data for "${title || 'Untitled Meeting'}" (User: ${req.user!.id})`);
    const extraction = await extractMeetingData(transcript, title || 'Untitled Meeting');
    res.json({ success: true, data: extraction });
  } catch (err) {
    next(err);
  }
}

export async function createMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, date, participants, transcript, extraction } = req.body;

    let finalExtraction = extraction;
    if (!finalExtraction) {
      logger.info(`No pre-computed extraction provided. Running extraction for "${title}"...`);
      finalExtraction = await extractMeetingData(transcript, title);
    }

    const participantsList = Array.isArray(participants)
      ? participants
      : typeof participants === 'string'
      ? participants.split(',').map(p => p.trim()).filter(Boolean)
      : ['Team Attendees'];

    const result = StorageService.saveNewMeeting(
      userId,
      {
        title: title.trim(),
        date: date || new Date().toISOString().split('T')[0],
        participants: participantsList.length > 0 ? participantsList : ['Team Attendees'],
        transcript: transcript.trim()
      },
      finalExtraction
    );

    logger.info(`Successfully created meeting ${result.meeting.id} for user ${userId} with ${result.newActions.length} action items.`);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function transcribeAudio(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { audioData, audioBase64, fileName, filename, mimeType, meetingTitle } = req.body;
    const data = audioData || audioBase64;
    const name = fileName || filename || 'recording.mp3';

    if (!data) {
      res.status(400).json({ success: false, error: 'Audio data (Base64) is required.' });
      return;
    }

    logger.info(`Transcribing audio upload "${name}" (User: ${req.user!.id})`);
    const result = await StorageService.transcribeAudioFile({
      audioData: data,
      fileName: name,
      mimeType,
      meetingTitle
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Audio transcription error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to transcribe audio file.'
    });
  }
}

export async function getMeetingEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const evidence = StorageService.getMeetingEvidence(userId, id);
    if (!evidence) {
      res.status(404).json({ success: false, error: `Meeting with ID ${id} not found.` });
      return;
    }
    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
}

export async function askMeetingQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ success: false, error: 'Question is required.' });
      return;
    }

    logger.info(`Ask meeting question on meeting ${id}: "${question.trim()}"`);
    const answer = await StorageService.askMeetingQuestion(userId, id, question.trim());
    if (!answer) {
      res.status(404).json({ success: false, error: `Meeting with ID ${id} not found.` });
      return;
    }

    res.json({ success: true, data: answer });
  } catch (err) {
    next(err);
  }
}

export async function getMeetingAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, meetingId, owner, status } = req.query;

    const analytics = StorageService.getMeetingAnalytics(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      meetingId: meetingId as string | undefined,
      owner: owner as string | undefined,
      status: status as any
    });

    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
}

