import { useState, useEffect } from "react";
import { FolderOpen, History } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/languages";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { RestoreConfirmModal } from "../RestoreConfirmModal";

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

  const [clientIdInput, setClientIdInput] = useState(config.google_drive_client_id || "");
  const [clientSecretInput, setClientSecretInput] = useState(config.google_drive_client_secret || "");
  const [backups, setBackups] = useState<number[]>([]);
  const [restoringBackup, setRestoringBackup] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [confirmRestoreTs, setConfirmRestoreTs] = useState<number | null>(null);

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
      showNotification("Backup created successfully!", "success");
      await fetchBackups();
    } catch (err: any) {
      console.error(err);
      const errMsg = typeof err === 'string' ? err : (err.message || "Failed to create backup");
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
        <p className="text-xs text-text-secondary">
          {t("settingsView.storageFolderDesc")}
        </p>
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
        <p className="text-xs text-text-secondary">
          {t("settingsView.autosaveFrequencyDesc")}
        </p>
        <select
          value={config.autosave_interval}
          onChange={(e) => updateConfigField("autosave_interval", parseInt(e.target.value))}
          className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
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
        <p className="text-xs text-text-secondary">
          {t("settingsView.languageDesc")}
        </p>
        <select
          value={config.language || "en"}
          onChange={(e) => updateConfigField("language", e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Google Drive Sync</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            isDriveConnected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-text-secondary/10 text-text-secondary border border-text-secondary/20"
          }`}>
            {isDriveConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <p className="text-xs text-text-secondary">
          Sync your journal entries securely to Google Drive.
          Please use a <strong>Desktop Application</strong> OAuth Client ID to avoid port configuration issues.
        </p>

        {/* Client ID Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-text-secondary">OAuth Client ID</label>
          <input
            type="text"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Enter your Google OAuth Client ID"
            disabled={isDriveConnected}
            className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Client Secret Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-text-secondary">OAuth Client Secret</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={clientSecretInput}
              onChange={(e) => setClientSecretInput(e.target.value)}
              placeholder={isDriveConnected ? "••••••••••••••••" : "Enter your Google OAuth Client Secret"}
              disabled={isDriveConnected}
              className="flex-1 px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isDriveConnected ? (
              <button
                onClick={disconnectDrive}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => startDriveAuth(clientIdInput, clientSecretInput)}
                className="px-4 py-2 bg-accent-brand text-bg-app rounded-lg text-sm font-medium hover:bg-accent-brand-hover transition-colors shrink-0"
              >
                Connect Account
              </button>
            )}
          </div>
        </div>

        {isDriveConnected && (
          <div className="space-y-4 bg-bg-surface/30 p-3.5 border border-border-brand/40 rounded-xl">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="block text-xs font-semibold text-text-secondary">Enable Auto-Sync</label>
                <p className="text-[10px] text-text-secondary">Automatically sync entries on startup and after changes are saved. For best experience, please turn on auto-sync on both devices, and avoid using both app at the same time to prevent unkonw sync problems.</p>
              </div>
              <input
                type="checkbox"
                checked={config.google_drive_auto_sync}
                onChange={(e) => updateConfigField("google_drive_auto_sync", e.target.checked)}
                className="w-4 h-4 rounded border-border-brand bg-bg-input text-accent-brand focus:ring-accent-brand"
              />
            </div>

            {/* Sync Trigger & Progress */}
            <div className="space-y-2 border-t border-border-brand/30 pt-3 flex flex-col">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSync}
                  disabled={syncProgress.status === 'syncing' || syncProgress.status === 'connecting'}
                  className="px-4 py-2 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {syncProgress.status === 'syncing' || syncProgress.status === 'connecting' ? 'Syncing...' : 'Sync Now'}
                </button>
                <span className="text-[10px] text-text-secondary">
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
            <h3 className="text-sm font-semibold text-text-primary">Local Backups</h3>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={backingUp || !config.journal_dir}
            className="px-3.5 py-1.5 bg-accent-brand text-bg-app hover:bg-accent-brand-hover rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {backingUp ? "Backing up..." : "Backup Now"}
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          Create manual backups or recover your journal entries from local backups if files are accidentally deleted or corrupted.
        </p>

        {backups.length === 0 ? (
          <p className="text-xs text-text-secondary italic bg-bg-surface/20 p-3 rounded-lg border border-border-brand/20">
            No local backups found yet. Backups are automatically created before each Google Drive sync.
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
                  <span className="text-[10px] text-text-secondary">
                    Timestamp: {ts}
                  </span>
                </div>
                <button
                  onClick={() => handleRestore(ts)}
                  disabled={restoringBackup !== null}
                  className="px-3 py-1.5 bg-border-brand hover:bg-border-brand/75 text-text-primary rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {restoringBackup === ts ? "Restoring..." : "Restore"}
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
