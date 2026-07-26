import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { listLocalEntries } from '../../../services/db';
import {
  exportAsJson,
  exportAsMarkdown,
  downloadBlob,
  defaultExportFilename,
} from '../../../lib/exportJournal';

export const ExportSection: React.FC = () => {
  const { t } = useTranslation();

  const handleExportJson = async () => {
    try {
      const allEntries = await listLocalEntries();
      downloadBlob(exportAsJson(allEntries), defaultExportFilename('json'));
    } catch (err) {
      console.error(err);
      alert(t("settings.exportJsonFailed"));
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const allEntries = await listLocalEntries();
      downloadBlob(exportAsMarkdown(allEntries), defaultExportFilename('md'));
    } catch (err) {
      console.error(err);
      alert(t("settings.exportMarkdownFailed"));
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-text-primary text-sm">{t("settings.exportTitle")}</h3>
        <p className="text-xs text-text-secondary">{t("settings.exportDesc")}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleExportJson}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{t("settings.exportJson")}</span>
        </button>
        <button
          onClick={handleExportMarkdown}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{t("settings.exportMarkdown")}</span>
        </button>
      </div>
    </div>
  );
};
