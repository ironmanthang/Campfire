export interface SyncLogger {
  log(message: string): void;
}

export const consoleLogger: SyncLogger = {
  log: (m) => console.log(m),
};
