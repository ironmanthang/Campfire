import { Tag } from "lucide-react";
import { useTranslation } from "react-i18next";

interface JournalEditorFooterProps {
  editorTags: string[];
  entryContent: string;
  handleTagClick: (tag: string, navigateToView: any) => void;
  navigateToView: any;
}

export function JournalEditorFooter({
  editorTags,
  entryContent,
  handleTagClick,
  navigateToView,
}: JournalEditorFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="p-3 border-t border-border-brand bg-bg-surface/40 flex items-center justify-between text-xs shrink-0 select-none">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-4">
        <Tag className="h-3.5 w-3.5 text-accent-brand shrink-0" />
        {editorTags.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {editorTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag, navigateToView)}
                className="px-2 py-0.5 rounded bg-accent-brand/10 border border-accent-brand/20 text-accent-brand font-medium text-xs hover:bg-accent-brand/20 hover:border-accent-brand transition-colors cursor-pointer select-none"
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-text-secondary text-xs">{t("journalEditor.noTags")}</span>
        )}
      </div>
      <div className="text-text-secondary shrink-0 pl-2">
        {t("timeline.wordCount", { count: entryContent.split(/\s+/).filter(Boolean).length })}
      </div>
    </footer>
  );
}
