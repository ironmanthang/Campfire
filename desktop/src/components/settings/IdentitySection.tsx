import { useState, useEffect } from "react";
import { FolderOpen, History } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/languages";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { RestoreConfirmModal } from "../modals/data_management/RestoreConfirmModal";
import { getGoogleUserInfo } from "../../services/googleDrive";

export function IdentitySection() {
  const { t } = useTranslation();
  const {
    config,
    updateConfigField,
    selectDirectory,
    isDriveConnected,
    syncProgress,
    handleSync,
    startDriveAuth,
    disconnectDrive,
    listJournalBackups,
    restoreJournalBackup,
    showNotification
  } = useAppStore();

  const [backups, setBackups] = useState<number[]>([]);
  const [restoringBackup, setRestoringBackup] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [confirmRestoreTs, setConfirmRestoreTs] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isDriveConnected) {
      getGoogleUserInfo().then((info) => {
        if (info?.emailAddress) {
          setUserEmail(info.emailAddress);
        }
      }).catch(console.error);
    } else {
      setUserEmail(null);
    }
  }, [isDriveConnected]);

  const fetchBackups = async () => {
    if (config.journal_dir) {
      const list = await listJournalBackups(config.journal_dir);
      setBackups(list);
    } else {
      setBackups([]);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [config.journal_dir]);

  const handleCreateBackup = async () => {
    if (!config.journal_dir) return;
    setBackingUp(true);
    try {
      await invoke("create_journal_backup", { dirPath: config.journal_dir });
      showNotification(t("settingsView.backupSuccess", "Backup created successfully!"), "success");
      await fetchBackups();
    } catch (err: any) {
      console.error(err);
      const errMsg = typeof err === 'string' ? err : (err.message || t("settingsView.backupFailed", "Failed to create backup"));
      showNotification(errMsg, "error");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = (ts: number) => {
    setConfirmRestoreTs(ts);
  };

  const executeRestore = async () => {
    if (confirmRestoreTs === null) return;
    const ts = confirmRestoreTs;
    setConfirmRestoreTs(null);
    setRestoringBackup(ts);
    try {
      await restoreJournalBackup(config.journal_dir, ts);
    } catch (e) {
      // Notification is already shown in store
    } finally {
      setRestoringBackup(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* Name field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">{t("settingsView.namePrompt")}</label>
        <input
          type="text"
          value={config.user_name}
          onChange={(e) => updateConfigField("user_name", e.target.value)}
          placeholder={t("settingsView.namePlaceholder")}
          className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
        />
      </div>

      {/* Directory storage */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">{t("settingsView.storageFolder")}</label>
        <div className="flex gap-2.5">
          <input
            type="text"
            readOnly
            value={config.journal_dir || t("settingsView.noFolderSelected")}
            className="flex-1 px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-secondary text-sm overflow-x-auto select-all cursor-default"
          />
          <button
            onClick={selectDirectory}
            className="px-4 py-2 bg-accent-brand text-bg-app rounded-lg text-sm font-medium hover:bg-accent-brand-hover transition-colors flex items-center gap-2 shrink-0"
          >
            <FolderOpen className="h-4 w-4" />
            {t("settingsView.browseButton")}
          </button>
        </div>
      </div>

      {/* Debounce / Autosave setting */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">{t("settingsView.autosaveFrequency")}</label>
        <select
          value={config.autosave_interval}
          onChange={(e) => updateConfigField("autosave_interval", parseInt(e.target.value))}
          className="w-full pl-3.5 pr-9 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors appearance-none bg-no-repeat bg-[right_0.65rem_center] bg-[length:0.7rem] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23a1a1aa%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.06l3.71-3.83a.75.75%200%20111.08%201.04l-4.25%204.39a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
        >
          <option value={1}>{t("settingsView.autosave1s")}</option>
          <option value={10}>{t("settingsView.autosave10s")}</option>
          <option value={60}>{t("settingsView.autosave1m")}</option>
          <option value={0}>{t("settingsView.autosaveDisabled")}</option>
        </select>
      </div>

      {/* Language setting */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">{t("settingsView.languageLabel")}</label>
        <select
          value={config.language || "en"}
          onChange={(e) => updateConfigField("language", e.target.value)}
          className="w-full pl-3.5 pr-9 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors appearance-none bg-no-repeat bg-[right_0.65rem_center] bg-[length:0.7rem] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23a1a1aa%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.06l3.71-3.83a.75.75%200%20111.08%201.04l-4.25%204.39a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Google Drive Sync Section */}
      <div className="border-t border-border-brand/40 pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{t("settingsView.googleDriveTitle", "Google Drive Sync")}</h3>
            {isDriveConnected && userEmail && (
              <span className="text-xs text-text-secondary truncate">
                ({userEmail})
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            isDriveConnected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-text-secondary/10 text-text-secondary border border-text-secondary/20"
          }`}>
            {isDriveConnected ? t("settingsView.connected", "Connected") : t("settingsView.disconnected", "Disconnected")}
          </span>
        </div>

        {!isDriveConnected ? (
          <button
            onClick={() => {
              const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
              startDriveAuth(clientId);
            }}
            className="w-full py-2.5 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer font-medium"
          >
            {t("settingsView.connectAccount", "Connect Account")}
          </button>
        ) : (
          <button
            onClick={disconnectDrive}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 text-red-500 rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer font-medium"
          >
            {t("settingsView.disconnectAccount", "Disconnect Account")}
          </button>
        )}

        {isDriveConnected && (
          <div className="space-y-4 bg-bg-surface/30 p-3.5 border border-border-brand/40 rounded-xl">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary">{t("settingsView.enableAutoSync", "Enable Auto-Sync")}</label>
              <input
                type="checkbox"
                checked={config.google_drive_auto_sync}
                onChange={(e) => updateConfigField("google_drive_auto_sync", e.target.checked)}
                className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand cursor-pointer"
              />
            </div>

            {/* Sync Trigger & Progress */}
            <div className="space-y-2 border-t border-border-brand/30 pt-3 flex flex-col">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleSync(true)}
                  disabled={syncProgress.status === 'syncing' || syncProgress.status === 'connecting'}
                  className="px-4 py-2 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {syncProgress.status === 'syncing' || syncProgress.status === 'connecting'
                    ? t("settingsView.syncing", "Syncing...")
                    : t("settingsView.syncNow", "Sync Now")}
                </button>
                <span className="text-xs text-text-secondary">
                  {syncProgress.message}
                </span>
              </div>
              {syncProgress.status === 'syncing' && syncProgress.totalFiles > 0 && (
                <div className="w-full bg-border-brand/35 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-accent-brand h-1.5 rounded-full transition-all duration-200" 
                    style={{ width: `${(syncProgress.filesProcessed / syncProgress.totalFiles) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local Backups Section */}
      <div className="border-t border-border-brand/40 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent-brand" />
            <h3 className="text-sm font-semibold text-text-primary">{t("settingsView.localBackups", "Local Backups")}</h3>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={backingUp || !config.journal_dir}
            className="px-3.5 py-1.5 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {backingUp ? t("settingsView.backingUp", "Backing up...") : t("settingsView.backupNow", "Backup Now")}
          </button>
        </div>
        {backups.length === 0 ? (
          <p className="text-xs text-text-secondary italic bg-bg-surface/20 p-3 rounded-lg border border-border-brand/20">
            {t("settingsView.noBackupsYet", "No backups yet.")}
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {backups.map((ts) => (
              <div 
                key={ts} 
                className="flex items-center justify-between p-2.5 bg-bg-surface/30 border border-border-brand/30 rounded-xl text-xs hover:border-border-brand/60 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-text-primary">
                    {new Date(ts * 1000).toLocaleString()}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {t("settingsView.timestampLabel", "Timestamp:")} {ts}
                  </span>
                </div>
                <button
                  onClick={() => handleRestore(ts)}
                  disabled={restoringBackup !== null}
                  className="px-3 py-1.5 bg-border-brand hover:bg-border-brand/75 text-text-primary rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {restoringBackup === ts ? t("settingsView.restoring", "Restoring...") : t("settingsView.restore", "Restore")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmRestoreTs !== null && (
        <RestoreConfirmModal
          dateStr={new Date(confirmRestoreTs * 1000).toLocaleString()}
          onCancel={() => setConfirmRestoreTs(null)}
          onConfirm={executeRestore}
        />
      )}
    </div>
  );
}
