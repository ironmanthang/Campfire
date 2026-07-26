import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, RefreshCw, AlertTriangle, Cloud, CloudOff, Sun, Moon } from 'lucide-react';
import { type SyncProgress } from '../../services/sync';
import { LogoModal } from '../modals';

interface HeaderProps {
  onSettingsOpen: () => void;
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
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-brand bg-bg-surface shrink-0 select-none">
        <div
          onClick={() => setIsLogoModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
          title={t("settings.logoTitle", "App Logo")}
        >
          <img
            src={customLogo || "/logo.png"}
            alt={t("header.logoAlt")}
            className="w-8 h-8 rounded-lg object-cover border border-border-brand/40 group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg text-text-primary tracking-tight">{t("common.campfire")}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Indicator & Trigger */}
          <button
            onClick={onSync}
            disabled={syncProgress.status === 'syncing' || syncProgress.status === 'connecting'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand transition-all duration-200 active:scale-95 disabled:opacity-80"
            title={getSyncTooltip()}
          >
            {getSyncIcon()}
            <span className="text-xs font-semibold text-text-secondary hidden xs:inline">
              {!isLoggedIn ? t("header.syncOffline") : syncProgress.status === 'syncing' ? t("header.syncSyncing") : t("header.syncButton")}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center"
            title={theme === 'dark' ? t("common.themeLight", "Switch to Light Mode") : t("common.themeDark", "Switch to Dark Mode")}
          >
            {theme === 'dark' ? <Sun size={18} className="text-accent-brand" /> : <Moon size={18} className="text-accent-brand" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onSettingsOpen}
            className="p-2 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-text-secondary hover:text-text-primary transition-all active:scale-95"
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

