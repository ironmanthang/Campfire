// localStorage-backed sync logger. Mirrors the historical behaviour of
// mobile's old addSyncLog helper: log to console, and persist the last
// 100 lines under the 'past_you_sync_logs' key so the UI can show a
// rolling history.

import type { SyncLogger } from '@campfire/core';

const LOG_KEY = 'past_you_sync_logs';
const MAX_LINES = 100;

export const localStorageLogger: SyncLogger = {
  log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);

    try {
      if (typeof localStorage === 'undefined') return;
      const existing = localStorage.getItem(LOG_KEY);
      const logs: string[] = existing ? JSON.parse(existing) : [];
      logs.push(logLine);
      if (logs.length > MAX_LINES) logs.shift();
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch {
      // localStorage might be unavailable (private mode, quota); ignore.
    }
  },
};
