import { Router } from 'express';
import {
  getMeetings,
  getMeetingById,
  createMeeting,
  extractMeeting,
  transcribeAudio,
  getMeetingEvidence,
  askMeetingQuestion,
  getMeetingAnalytics
} from '../controllers/meetingController.js';
import {
  validateMeetingMiddleware,
  validateExtractionMiddleware
} from '../middleware/validateRequest.js';

const router = Router();

// Specific routes first
router.get('/', getMeetings);
router.get('/analytics', getMeetingAnalytics);
router.post('/extract', validateExtractionMiddleware, extractMeeting);
router.post('/transcript', validateExtractionMiddleware, extractMeeting);
router.post('/transcribe-audio', transcribeAudio);
router.post('/audio', transcribeAudio);

// Parameterized routes
router.get('/:id/evidence', getMeetingEvidence);
router.post('/:id/ask', askMeetingQuestion);
router.get('/:id/analytics', getMeetingAnalytics);
router.get('/:id', getMeetingById);
router.post('/', validateMeetingMiddleware, createMeeting);

export default router;

