import React from 'react';
import { Settings, CloudLightning, RefreshCw, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { type SyncProgress } from '../services/sync';

interface HeaderProps {
  onSettingsOpen: () => void;
  onSync: () => void;
  syncProgress: SyncProgress;
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSettingsOpen, 
  onSync, 
  syncProgress,
  isLoggedIn
}) => {
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
    if (!isLoggedIn) return 'Setup Google Drive to sync';
    if (syncProgress.status === 'idle') {
      const lastSync = localStorage.getItem('past_you_last_sync_time');
      if (lastSync) {
        const dateStr = new Date(parseInt(lastSync)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Last synced: ${dateStr}`;
      }
      return 'Sync with Google Drive';
    }
    return syncProgress.message;
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border-brand bg-bg-surface shrink-0 select-none">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-brand/10 flex items-center justify-center border border-accent-brand/20">
          <CloudLightning className="text-accent-brand" size={18} />
        </div>
        <span className="font-bold text-lg text-text-primary tracking-tight">Campfire</span>
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
            {!isLoggedIn ? 'Offline' : syncProgress.status === 'syncing' ? 'Syncing' : 'Sync'}
          </span>
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
  );
};
