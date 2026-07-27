export const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

// VietQR credentials configuration
export const BANK_ID = "VCB";       // e.g. "MB", "VCB", "TCB", "TPB"
export const ACCOUNT_NO = "9949420500";  // e.g. "123456789"
export const ACCOUNT_NAME = "NGUYEN NHU THANG"; // e.g. "NGUYEN NHU THANG"

