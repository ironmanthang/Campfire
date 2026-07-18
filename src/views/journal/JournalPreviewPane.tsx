import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

interface JournalPreviewPaneProps {
  entryContent: string;
  editorWidthPercent: number;
}

export function JournalPreviewPane({ entryContent, editorWidthPercent }: JournalPreviewPaneProps) {
  const { t } = useTranslation();

  return (
    <div
      className="overflow-y-auto p-6 bg-bg-surface/20 h-full flex-1"
      style={{
        width: `${100 - editorWidthPercent}%`,
        display: editorWidthPercent === 100 ? "none" : "block",
      }}
    >
      {entryContent.trim() ? (
        <div className="prose max-w-none markdown-preview">
          <ReactMarkdown>{entryContent}</ReactMarkdown>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-text-secondary select-none">
          <p className="text-sm">{t("journalEditor.previewEmpty")}</p>
          <p className="text-xs mt-1">{t("journalEditor.previewInstruction")}</p>
        </div>
      )}
    </div>
  );
}
