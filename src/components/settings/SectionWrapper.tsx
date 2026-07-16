import React from "react";
import { ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SectionWrapperProps {
  sectionKey: string;
  index: number;
  isCollapsed: boolean;
  onToggle: () => void;
  title: string;
  badge?: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

export function SectionWrapper({
  isCollapsed,
  onToggle,
  title,
  badge,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  children
}: SectionWrapperProps) {
  const { t } = useTranslation();

  const cardClass = `settings-card rounded-xl border bg-bg-surface transition-all duration-150 ${
    isCollapsed ? "p-3 space-y-0 cursor-pointer" : "p-6 space-y-6 cursor-pointer"
  } border-border-brand opacity-100 relative`;

  return (
    <div className={cardClass} onClick={onToggle}>
      {/* Header */}
      <div
        className={`flex items-center justify-between ${
          isCollapsed ? "" : "pb-3 border-b border-border-brand/40"
        } select-none group/header`}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-text-secondary group-hover/header:text-text-primary transition-colors" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-text-secondary group-hover/header:text-text-primary transition-colors" />
          )}
          <h3 className="font-bold text-sm text-text-primary group-hover/header:text-accent-brand transition-colors">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
              {badge}
            </span>
          )}
          
          {/* Reordering Controls */}
          <div className="flex items-center gap-1 bg-bg-input/60 border border-border-brand/40 rounded-lg p-0.5 select-none shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              title={t("settingsView.moveUp")}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-border-brand/30" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              title={t("settingsView.moveDown")}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}
