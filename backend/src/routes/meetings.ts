import { Router } from 'express';
import {
  getMeetings,
  getMeetingById,
  createMeeting,
  extractMeeting
} from '../controllers/meetingController.js';
import {
  validateMeetingMiddleware,
  validateExtractionMiddleware
} from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getMeetings);
router.post('/extract', validateExtractionMiddleware, extractMeeting);
router.get('/:id', getMeetingById);
router.post('/', validateMeetingMiddleware, createMeeting);

export default router;
