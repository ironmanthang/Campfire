import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import { listLocalEntries, getLocalEntry, saveLocalEntry } from '../../../services/db';
import {
  exportAsJson,
  exportAsMarkdown,
  downloadBlob,
  defaultExportFilename,
  parseImportContent,
  appendImportedContent,
  type ImportReport,
} from '../../../lib/exportJournal';
import { ImportReportModal } from '../../modals/data_management/ImportReportModal';

interface ExportSectionProps {
  onImportComplete?: () => void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ onImportComplete }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const fileName = file.name;
      const { format, entries: parsedEntries } = parseImportContent(text);

      const report: ImportReport = {
        source_format: format,
        new_entries: [],
        appended_entries: [],
        skipped: [],
        errors: [],
      };

      for (const entry of parsedEntries) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          report.errors.push({
            date: entry.date,
            message: 'Invalid date format (expected YYYY-MM-DD)',
          });
          continue;
        }

        if (!entry.content || entry.content.trim() === '') {
          report.skipped.push({
            date: entry.date,
            reason: 'Empty content',
          });
          continue;
        }

        const existing = await getLocalEntry(entry.date);
        if (existing && existing.content && existing.content.trim() !== '') {
          const merged = appendImportedContent(existing.content, entry.content, fileName);
          await saveLocalEntry(entry.date, merged);
          report.appended_entries.push(entry.date);
        } else {
          await saveLocalEntry(entry.date, entry.content);
          report.new_entries.push(entry.date);
        }
      }

      setImportReport(report);
      onImportComplete?.();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || t("settings.importFailed"));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md"
        onChange={handleFileChange}
        className="hidden"
      />
      <div>
        <h3 className="font-semibold text-text-primary text-sm">{t("settings.exportTitle")}</h3>
        <p className="text-xs text-text-secondary">{t("settings.exportDesc")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportJson}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{t("settings.exportJson")}</span>
        </button>
        <button
          onClick={handleExportMarkdown}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{t("settings.exportMarkdown")}</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-bg-app border border-border-brand hover:border-accent-brand text-text-primary rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Upload size={14} />
          <span>{t("settings.importData")}</span>
        </button>
      </div>

      {importReport && (
        <ImportReportModal
          report={importReport}
          onClose={() => setImportReport(null)}
        />
      )}
    </div>
  );
};
