import React, { useRef, useEffect } from "react";
import { Plus, Folder, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ScratchpadQuickAddProps {
  newTaskText: string;
  setNewTaskText: (v: string) => void;
  onAddTask: (e?: React.FormEvent) => void;
  isTaskDuplicate: boolean;
  isCreatingGroup: boolean;
  setIsCreatingGroup: (v: boolean | ((prev: boolean) => boolean)) => void;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  onCreateGroup: (e?: React.FormEvent) => void;
  isGroupDuplicate: boolean;
  newGroupBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ScratchpadQuickAdd({
  newTaskText,
  setNewTaskText,
  onAddTask,
  isTaskDuplicate,
  isCreatingGroup,
  setIsCreatingGroup,
  newGroupName,
  setNewGroupName,
  onCreateGroup,
  isGroupDuplicate,
  newGroupBtnRef,
}: ScratchpadQuickAddProps) {
  const { t } = useTranslation();
  const quickInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const groupFormContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    quickInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isCreatingGroup) return;
    groupInputRef.current?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        groupFormContainerRef.current &&
        !groupFormContainerRef.current.contains(target) &&
        !newGroupBtnRef?.current?.contains(target)
      ) {
        setNewGroupName("");
        setIsCreatingGroup(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNewGroupName("");
        setIsCreatingGroup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreatingGroup, newGroupBtnRef, setIsCreatingGroup, setNewGroupName]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <form onSubmit={onAddTask} className="flex items-center gap-2">
          <input
            ref={quickInputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={t("scratchpad.addPlaceholder", "Quick scratch idea or todo...")}
            className={`flex-1 bg-bg-surface border ${
              isTaskDuplicate ? "border-red-400 focus:border-red-400" : "border-border-brand focus:border-accent-brand"
            } rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none shadow-xs`}
          />
          <button
            type="submit"
            disabled={!newTaskText.trim() || isTaskDuplicate}
            className="px-4 py-3 rounded-2xl bg-accent-brand text-bg-surface font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span className="hidden sm:inline text-xs font-bold">{t("common.add", "Add")}</span>
          </button>
        </form>
        {isTaskDuplicate && (
          <p className="text-xs text-red-400 pl-2">
            {t("scratchpad.alreadyExists", "An item with this name already exists")}
          </p>
        )}
      </div>

      {isCreatingGroup && (
        <div ref={groupFormContainerRef} className="space-y-1 animate-fade-in">
          <form
            onSubmit={onCreateGroup}
            className={`flex items-center gap-2 p-3 bg-bg-surface border ${
              isGroupDuplicate ? "border-red-400" : "border-accent-brand/50"
            } rounded-2xl shadow-sm`}
          >
            <Folder className="h-4 w-4 text-accent-brand shrink-0" />
            <input
              ref={groupInputRef}
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setNewGroupName("");
                  setIsCreatingGroup(false);
                }
              }}
              placeholder={t("scratchpad.groupPlaceholder", "Group name (e.g. Work, Shopping)...")}
              className="flex-1 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newGroupName.trim() || isGroupDuplicate}
              className="px-3 py-1.5 bg-accent-brand text-bg-surface rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
            >
              {t("common.create", "Create")}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewGroupName("");
                setIsCreatingGroup(false);
              }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
          {isGroupDuplicate && (
            <p className="text-xs text-red-400 pl-2">
              {t("scratchpad.alreadyExists", "An item with this name already exists")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
