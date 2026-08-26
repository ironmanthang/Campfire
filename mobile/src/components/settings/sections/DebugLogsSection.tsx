import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const DebugLogsSection: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('past_you_sync_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch {}
    }
  }, []);

  const handleClearLogs = () => {
    localStorage.removeItem('past_you_sync_logs');
    setLogs([]);
  };

  return (
    <div className="space-y-2 border-t border-border-brand/40 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">{t("settings.debugLogsTitle")}</h4>
        {logs.length > 0 && (
          <button onClick={handleClearLogs} className="text-xs text-red-500 hover:underline">
            {t("settings.debugClearLogs")}
          </button>
        )}
      </div>
      <div className="bg-bg-app border border-border-brand rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[0.6875rem] text-text-secondary whitespace-pre-wrap leading-relaxed">
        {logs.length > 0 ? (
          logs.slice().reverse().join('\n')
        ) : (
          <span className="italic text-text-secondary">{t("settings.debugEmpty")}</span>
        )}
      </div>
    </div>
  );
};
