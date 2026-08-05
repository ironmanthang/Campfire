import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, RefreshCw, AlertTriangle, Cloud, CloudOff, Sun, Moon } from 'lucide-react';
import { type SyncProgress } from '../../services/sync';
import { LogoModal } from '../modals';

interface HeaderProps {
  onSettingsOpen: () => void;
  onScratchpadOpen: () => void;
  onSync: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  syncProgress: SyncProgress;
  isLoggedIn: boolean;
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSettingsOpen,
  onScratchpadOpen,
  onSync,
  onThemeToggle,
  theme,
  syncProgress,
  isLoggedIn,
  customLogo,
  onLogoChange
}) => {
  const { t } = useTranslation();
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const getSyncIcon = () => {
    if (!isLoggedIn) return <CloudOff className="text-text-secondary" size={18} />;

    switch (syncProgress.status) {
      case 'syncing':
      case 'connecting':
        return <RefreshCw className="text-accent-brand animate-spin" size={18} />;
      case 'error':
        return <AlertTriangle className="text-red-500 animate-pulse" size={18} />;
      case 'completed':
        return <Cloud className="text-green-500" size={18} />;
      default:
        return <Cloud className="text-text-secondary" size={18} />;
    }
  };

  const getSyncTooltip = () => {
    if (!isLoggedIn) return t("header.syncSetupGoogle");
    if (syncProgress.status === 'idle') {
      const lastSync = localStorage.getItem('past_you_last_sync_time');
      if (lastSync) {
        const dateStr = new Date(parseInt(lastSync)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return t("header.lastSynced", { time: dateStr });
      }
      return t("header.syncWithGoogle");
    }
    return syncProgress.message;
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-border-brand bg-bg-surface shrink-0 select-none">
        <div
          onClick={() => setIsLogoModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity min-h-[44px]"
          title={t("settings.logoTitle", "App Logo")}
        >
          <img
            src={customLogo || "/logo.png"}
            alt={t("header.logoAlt")}
            className="w-8 h-8 rounded-lg object-cover border border-border-brand/40 group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg text-text-primary tracking-tight">{t("common.campfire")}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sync Indicator & Trigger */}
          <button
            onClick={onSync}
            disabled={syncProgress.status === 'syncing' || syncProgress.status === 'connecting'}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand transition-all duration-200 active:scale-95 disabled:opacity-80 cursor-pointer"
            title={getSyncTooltip()}
            aria-label={getSyncTooltip()}
          >
            {getSyncIcon()}
            <span className="text-xs font-semibold text-text-secondary hidden xs:inline">
              {!isLoggedIn ? t("header.syncOffline") : syncProgress.status === 'syncing' ? t("header.syncSyncing") : t("header.syncButton")}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? t("common.themeLight", "Switch to Light Mode") : t("common.themeDark", "Switch to Dark Mode")}
            aria-label={theme === 'dark' ? t("common.themeLight", "Switch to Light Mode") : t("common.themeDark", "Switch to Dark Mode")}
          >
            {theme === 'dark' ? <Sun size={18} className="text-accent-brand" /> : <Moon size={18} className="text-accent-brand" />}
          </button>

          {/* Quick Scratchpad & To-Do */}
          <button
            onClick={onScratchpadOpen}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-accent-brand transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title={t("scratchpad.title", "Scratchpad & Notes")}
            aria-label={t("scratchpad.title", "Scratchpad & Notes")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-6 6z" />
              <path d="M15 15v6l6-6h-6z" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
            </svg>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onSettingsOpen}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title={t("settings.title", "Settings")}
            aria-label={t("settings.title", "Settings")}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <LogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        customLogo={customLogo}
        onLogoChange={onLogoChange}
      />
    </>
  );
};

