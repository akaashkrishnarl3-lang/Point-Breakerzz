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
