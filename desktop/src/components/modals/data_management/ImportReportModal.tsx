import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import type { ReactNode } from "react";
import { formatToDDMMYY } from "../../../lib/dateUtils";
import type { ImportReport } from "../../../store/domains/uiSlice";

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
  children: ReactNode;
}) {
  if (!count) return null;

  return (
    <div className="space-y-2">
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

export function ImportReportModal({ report, onClose }: ImportReportModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onPointerDown={(e) => {
        const target = e.target as Node;
        pointerStartedInsideRef.current = modalRef.current?.contains(target) ?? false;
        pointerMovedRef.current = false;
        activePointerIdRef.current = e.pointerId;
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        const start = startPosRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) pointerMovedRef.current = true;
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        if (pointerStartedInsideRef.current) {
          pointerStartedInsideRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        activePointerIdRef.current = null;
        startPosRef.current = null;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div ref={modalRef} className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-accent-brand">
            <CheckCircle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold text-text-primary">
              {t("settingsView.importReportTitle")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {t("settingsView.importReportSubtitle", { format: report.source_format })}
        </p>

        <div className="space-y-3">
          <ReportSection title={t("settingsView.importReportNew")} count={report.new_entries.length}>
            {report.new_entries.map((date) => (
              <div
                key={`new-${date}`}
                className="text-xs font-semibold px-3 py-2 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
              >
                {formatToDDMMYY(date)} ({date})
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settingsView.importReportAppended")} count={report.appended_entries.length}>
            {report.appended_entries.map((date) => (
              <div
                key={`append-${date}`}
                className="text-xs font-semibold px-3 py-2 bg-bg-app border border-border-brand/40 rounded-lg text-text-primary"
              >
                {formatToDDMMYY(date)} ({date})
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settingsView.importReportSkipped")} count={report.skipped.length}>
            {report.skipped.map((entry) => (
              <div
                key={`skip-${entry.date}-${entry.reason}`}
                className="text-xs font-semibold px-3 py-2 bg-bg-app border border-amber-500/30 rounded-lg text-text-primary"
              >
                {formatToDDMMYY(entry.date)} ({entry.date}) - {entry.reason}
              </div>
            ))}
          </ReportSection>

          <ReportSection title={t("settingsView.importReportErrors")} count={report.errors.length}>
            {report.errors.map((entry, index) => (
              <div
                key={`error-${entry.date ?? "none"}-${index}`}
                className="text-xs font-semibold px-3 py-2 bg-bg-app border border-red-500/30 rounded-lg text-text-primary flex items-start gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <span>{entry.date ? `${entry.date}: ` : ""}{entry.message}</span>
              </div>
            ))}
          </ReportSection>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            {t("notification.close")}
          </button>
        </div>
      </div>
    </div>
  );
}