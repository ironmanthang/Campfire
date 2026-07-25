import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, AlertCircle } from 'lucide-react';
import {
  getStoredAuthState,
  requestDriveAuth,
  clearAuthState,
  getGoogleUserInfo
} from '../../services/googleDrive';

export const GoogleDriveSection: React.FC = () => {
  const { t } = useTranslation();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary">{t("settings.googleSyncTitle")}</h3>
        <p className="text-xs text-text-secondary">
          {isLoggedIn
            ? (userEmail ? t("settings.googleSyncDescConnected", { email: userEmail }) : t("settings.googleSyncDescConnectedShort"))
            : t("settings.googleSyncDescDisconnected")}
        </p>
      </div>
      {/* Auto-Sync Toggle */}
      {isLoggedIn && (
        <div className="flex items-center justify-between py-2 border-t border-border-brand/40">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{t("settings.autoSyncTitle")}</h4>
            <p className="text-[11px] text-text-secondary">{t("settings.autoSyncDesc")}</p>
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
            <span className="text-sm font-medium text-text-primary">{t("settings.googleAccountTitle")}</span>
            {isLoggedIn && userEmail && (
              <span className="text-[11px] text-text-secondary mt-0.5">{userEmail}</span>
            )}
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isLoggedIn ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
            {isLoggedIn ? t("settings.googleStatusConnected") : t("settings.googleStatusDisconnected")}
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
            <span>{t("settings.disconnectButton")}</span>
          </button>
        ) : (
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent-brand hover:bg-accent-brand-hover text-bg-app font-semibold text-sm transition-all disabled:opacity-50"
          >
            <LogIn size={16} />
            <span>{authLoading ? t("settings.signInLoading") : t("settings.signInButton")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
