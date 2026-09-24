export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[MeetFlow AI INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[MeetFlow AI WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[MeetFlow AI ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }
};
