import React, { useState, useEffect } from 'react';
import { 
  getStoredAuthState, 
  requestDriveAuth, 
  clearAuthState,
  getGoogleUserInfo
} from '../services/googleDrive';
import { X, LogIn, LogOut, Sun, Moon, AlertCircle, Download } from 'lucide-react';
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
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onThemeToggle, 
  theme,
  customLogo,
  onLogoChange
}) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem('past_you_custom_logo', base64String);
      onLogoChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    localStorage.removeItem('past_you_custom_logo');
    onLogoChange(null);
  };

  useEffect(() => {
    const auth = getStoredAuthState();
    const connected = !!auth.accessToken && Date.now() < auth.expiresAt;
    setIsLoggedIn(connected);

    if (connected) {
      getGoogleUserInfo().then((info) => {
        if (info?.emailAddress) {
          setUserEmail(info.emailAddress);
        }
      }).catch(console.error);
    } else {
      setUserEmail(null);
    }
    
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

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (!clientId.trim()) {
        throw new Error('Google OAuth Client ID is not configured in the environment.');
      }
      await requestDriveAuth(clientId.trim());
      setIsLoggedIn(true);
      getGoogleUserInfo().then((info) => {
        if (info?.emailAddress) {
          setUserEmail(info.emailAddress);
        }
      }).catch(console.error);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthState();
    setIsLoggedIn(false);
    setUserEmail(null);
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

          {/* Custom Logo setting */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-text-primary">App Logo</h3>
              <p className="text-xs text-text-secondary">Customize the in-app header logo. Supports standard image formats.</p>
            </div>
            <div className="flex items-center gap-4">
              <img 
                src={customLogo || "/logo.png"} 
                alt="Logo preview" 
                className="w-12 h-12 rounded-xl object-cover border border-border-brand bg-bg-app/40 shrink-0"
              />
              <div className="flex gap-2 flex-1">
                <label className="flex-1 flex items-center justify-center py-2 px-3 text-xs font-semibold bg-accent-brand hover:bg-accent-brand-hover text-bg-app rounded-xl transition-all cursor-pointer text-center select-none active:scale-95">
                  <span>Upload Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>
                {customLogo && (
                  <button
                    onClick={handleResetLogo}
                    className="py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-red-500 hover:text-red-500 text-text-primary rounded-xl transition-all cursor-pointer select-none active:scale-95"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <hr className="border-border-brand" />

          {/* Google Drive Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary">Google Drive Sync</h3>
              <p className="text-xs text-text-secondary">
                {isLoggedIn 
                  ? (userEmail ? `Connected as ${userEmail}.` : "Sync your diaries securely to your Google Drive folder.")
                  : "Connect your Google Account to enable the automatic sync feature."}
              </p>
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
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary">Google Account Sync</span>
                  {isLoggedIn && userEmail && (
                    <span className="text-[11px] text-text-secondary mt-0.5">{userEmail}</span>
                  )}
                </div>
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

            {/* Privacy & Terms Links */}
            <div className="flex justify-center items-center gap-3 pt-6 border-t border-border-brand/40 text-[11px] text-text-secondary">
              <a 
                href="/privacy/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-accent-brand hover:underline transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-border-brand">•</span>
              <a 
                href="/terms/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-accent-brand hover:underline transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
