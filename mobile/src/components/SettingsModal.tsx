import React, { useState, useEffect } from 'react';
import { 
  getStoredAuthState, 
  saveAuthState, 
  requestDriveAuth, 
  clearAuthState 
} from '../services/googleDrive';
import { X, LogIn, LogOut, Sun, Moon, Check, AlertCircle, Download } from 'lucide-react';
import { listLocalEntries } from '../services/db';
import {
  exportAsJson,
  exportAsMarkdown,
  downloadBlob,
  defaultExportFilename,
} from '../lib/exportJournal';

interface SettingsModalProps {
  onClose: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onThemeToggle, theme }) => {
  const [clientId, setClientId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const auth = getStoredAuthState();
    setClientId(auth.clientId);
    setIsLoggedIn(!!auth.accessToken && Date.now() < auth.expiresAt);
    
    const storedAutoSync = localStorage.getItem('past_you_auto_sync');
    setAutoSync(storedAutoSync !== 'false');

    const storedLogs = localStorage.getItem('past_you_sync_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {}
    }
  }, []);

  const handleAutoSyncToggle = (val: boolean) => {
    setAutoSync(val);
    localStorage.setItem('past_you_auto_sync', String(val));
  };

  const handleSaveClientId = () => {
    const current = getStoredAuthState();
    saveAuthState({
      ...current,
      clientId: clientId.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (!clientId.trim()) {
        throw new Error('Please enter a Google OAuth Client ID first.');
      }
      await requestDriveAuth(clientId.trim());
      setIsLoggedIn(true);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthState();
    setIsLoggedIn(false);
  };

  const handleClearLogs = () => {
    localStorage.removeItem('past_you_sync_logs');
    setLogs([]);
  };

  const handleExportJson = async () => {
    try {
      const allEntries = await listLocalEntries();
      downloadBlob(exportAsJson(allEntries), defaultExportFilename('json'));
    } catch (err) {
      console.error(err);
      alert("Failed to export entries as JSON");
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const allEntries = await listLocalEntries();
      downloadBlob(exportAsMarkdown(allEntries), defaultExportFilename('md'));
    } catch (err) {
      console.error(err);
      alert("Failed to export entries as Markdown");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-brand">
          <h2 className="text-xl font-bold tracking-tight text-text-primary m-0">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Theme setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">Theme Mode</h3>
              <p className="text-xs text-text-secondary">Toggle between warm light and charcoal dark theme</p>
            </div>
            <button 
              onClick={onThemeToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary transition-all duration-200"
            >
              {theme === 'dark' ? (
                <>
                  <Moon size={16} className="text-accent-brand" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun size={16} className="text-accent-brand" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          <hr className="border-border-brand" />

          {/* Google Drive Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary">Google Drive Sync</h3>
              <p className="text-xs text-text-secondary">Provide your Google OAuth Client ID to sync diaries to your Google Drive folder.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Client ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxxxx.apps.googleusercontent.com"
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-border-brand bg-bg-input text-text-primary outline-none focus:border-accent-brand transition-all"
                />
                <button 
                  onClick={handleSaveClientId}
                  className="px-3 py-2 text-sm font-medium bg-bg-app border border-border-brand text-text-primary hover:border-accent-brand rounded-xl transition-all"
                >
                  {saveSuccess ? <Check size={16} className="text-green-500" /> : 'Save'}
                </button>
              </div>
            </div>
            {/* Auto-Sync Toggle */}
            {isLoggedIn && (
              <div className="flex items-center justify-between py-2 border-t border-border-brand/40">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Enable Auto-Sync</h4>
                  <p className="text-[11px] text-text-secondary">Sync entries automatically on startup and when closing the editor.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand"
                />
              </div>
            )}

            {/* Auth status */}
            <div className="p-4 rounded-xl bg-bg-app border border-border-brand flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Google Account Sync</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isLoggedIn ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                  {isLoggedIn ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {authError && (
                <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/5 p-2.5 rounded-lg border border-red-500/10">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {isLoggedIn ? (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 text-red-500 font-semibold text-sm transition-all"
                >
                  <LogOut size={16} />
                  <span>Disconnect Account</span>
                </button>
              ) : (
                <button 
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent-brand hover:bg-accent-brand-hover text-bg-app font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <LogIn size={16} />
                  <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>

            <hr className="border-border-brand" />

            {/* Export data section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Export Journal</h3>
                <p className="text-xs text-text-secondary">Export your journals as offline files. No vendor lock-in.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportJson}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export Markdown</span>
                </button>
              </div>
            </div>

            {/* Debug logs section */}
            <div className="space-y-2 border-t border-border-brand/40 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Sync Debug Logs</h4>
                {logs.length > 0 && (
                  <button onClick={handleClearLogs} className="text-[10px] text-red-500 hover:underline">
                    Clear Logs
                  </button>
                )}
              </div>
              <div className="bg-bg-app border border-border-brand rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[9px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                {logs.length > 0 ? (
                  logs.slice().reverse().join('\n')
                ) : (
                  <span className="italic text-text-secondary">No sync cycles recorded yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
