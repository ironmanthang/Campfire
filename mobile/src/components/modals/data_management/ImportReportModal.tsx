import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ImportReport } from '../../../lib/exportJournal';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface ImportReportModalProps {
  report: ImportReport;
  onClose: () => void;
}

function ReportSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
        <span>{title}</span>
        <span className="px-2 py-0.5 rounded-full bg-bg-app border border-border-brand/50 text-xs">
          {count}
        </span>
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">{children}</div>
    </div>
  );
}

export const ImportReportModal: React.FC<ImportReportModalProps> = ({ report, onClose }) => {
  const { t, i18n } = useTranslation();
  const { handleManualClose } = useModalBackHandler(true, onClose);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={handleManualClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 cursor-default"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-accent-brand">
            <CheckCircle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold text-text-primary">
              {t("settings.importReportTitle")}
            </h3>
          </div>
          <button
            onClick={handleManualClose}
            className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {t("settings.importReportSubtitle", { format: report.source_format.toUpperCase() })}
        </p>

        <div className="space-y-3">
          <ReportSection title={t("settings.importReportNew")} count={report.new_entries.length}>
            {report.new_entries.map((date) => (
              <div
                key={`new-${date}`}
                className="text-xs font-semibold px-3 py-1.5 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
              >
                {formatDate(date)} ({date})
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settings.importReportAppended")} count={report.appended_entries.length}>
            {report.appended_entries.map((date) => (
              <div
                key={`append-${date}`}
                className="text-xs font-semibold px-3 py-1.5 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
              >
                {formatDate(date)} ({date})
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settings.importReportSkipped")} count={report.skipped.length}>
            {report.skipped.map((entry) => (
              <div
                key={`skip-${entry.date}-${entry.reason}`}
                className="text-xs font-semibold px-3 py-1.5 bg-bg-app border border-amber-500/30 rounded-lg text-text-primary"
              >
                {entry.date ? `${formatDate(entry.date)} (${entry.date})` : ''} - {entry.reason}
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settings.importReportErrors")} count={report.errors.length}>
            {report.errors.map((entry, index) => (
              <div
                key={`error-${entry.date ?? 'none'}-${index}`}
                className="text-xs font-semibold px-3 py-1.5 bg-bg-app border border-red-500/30 rounded-lg text-text-primary flex items-start gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <span>{entry.date ? `${entry.date}: ` : ''}{entry.message}</span>
              </div>
            ))}
          </ReportSection>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleManualClose}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            {t("settings.importReportClose")}
          </button>
        </div>
      </div>
    </div>
  );
};
