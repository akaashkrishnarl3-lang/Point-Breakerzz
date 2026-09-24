export function validateMeetingPayload(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required.' };
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return { valid: false, error: 'Meeting title is required.' };
  }
  if (!body.transcript || typeof body.transcript !== 'string' || body.transcript.trim().length === 0) {
    return { valid: false, error: 'Meeting transcript is required.' };
  }
  return { valid: true };
}

export function validateExtractionPayload(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required.' };
  }
  if (!body.transcript || typeof body.transcript !== 'string' || body.transcript.trim().length === 0) {
    return { valid: false, error: 'Meeting transcript is required for extraction.' };
  }
  return { valid: true };
}
