import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Folder,
  Edit2,
  Check,
  X,
  CornerDownRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ScratchpadItem } from "@campfire/core";

export interface ScratchpadItemRowProps {
  item: ScratchpadItem;
  depth: number;
  collapsedMap: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onToggleCheck: (id: string, checked?: boolean) => void;
  onAddChild: (parentId: string, text: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function ScratchpadItemRow({
  item,
  depth,
  collapsedMap,
  onToggleCollapse,
  onToggleCheck,
  onAddChild,
  onRenameGroup,
  onDelete,
}: ScratchpadItemRowProps) {
  const { t } = useTranslation();
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupEditText, setGroupEditText] = useState(item.text);

  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const isCollapsed = Boolean(collapsedMap[item.id]);
  const hasChildren = Boolean(item.children && item.children.length > 0);

  useEffect(() => {
    if (isAddingSubtask) {
      subtaskInputRef.current?.focus();
    }
  }, [isAddingSubtask]);

  useEffect(() => {
    if (isEditingGroup) {
      groupInputRef.current?.focus();
      groupInputRef.current?.select();
    }
  }, [isEditingGroup]);

  const handleSubtaskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = subtaskText.trim();
    if (trimmed) {
      onAddChild(item.id, trimmed);
      setSubtaskText("");
      setIsAddingSubtask(false);
    }
  };

  const handleGroupRenameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = groupEditText.trim();
    if (trimmed && trimmed !== item.text) {
      onRenameGroup(item.id, trimmed);
    } else {
      setGroupEditText(item.text);
    }
    setIsEditingGroup(false);
  };

  const indentPx = Math.min(depth, 3) * 20;

  if (item.isGroup) {
    return (
      <div className="space-y-1 my-2">
        <div
          style={{ paddingLeft: `${indentPx}px` }}
          className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-bg-surface/90 border border-border-brand/60 shadow-xs hover:border-accent-brand/40 transition-all"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => onToggleCollapse(item.id)}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
              title={isCollapsed ? t("common.expand", "Expand") : t("common.collapse", "Collapse")}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-accent-brand" />
              ) : (
                <ChevronDown className="h-4 w-4 text-accent-brand" />
              )}
            </button>

            <Folder className="h-4.5 w-4.5 text-accent-brand shrink-0" />

            {isEditingGroup ? (
              <form onSubmit={handleGroupRenameSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  ref={groupInputRef}
                  type="text"
                  value={groupEditText}
                  onChange={(e) => setGroupEditText(e.target.value)}
                  onBlur={handleGroupRenameSubmit}
                  className="w-full bg-bg-app border border-accent-brand rounded-lg px-2 py-1 text-sm font-bold text-text-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 text-accent-brand hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupEditText(item.text);
                    setIsEditingGroup(false);
                  }}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <span
                onClick={() => setIsEditingGroup(true)}
                className="font-bold text-sm text-text-primary truncate cursor-pointer hover:text-accent-brand transition-colors"
                title={t("scratchpad.clickToRename", "Click to rename group")}
              >
                {item.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {!isEditingGroup && (
              <button
                onClick={() => setIsEditingGroup(true)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
                title={t("scratchpad.renameGroup", "Rename group")}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent-brand hover:bg-bg-app transition-colors cursor-pointer"
              title={t("scratchpad.addTaskToGroup", "Add task to group")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-bg-app transition-colors cursor-pointer"
              title={t("common.delete", "Delete group")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isAddingSubtask && (
          <form
            onSubmit={handleSubtaskSubmit}
            style={{ paddingLeft: `${indentPx + 24}px` }}
            className="flex items-center gap-2 py-1 animate-fade-in"
          >
            <CornerDownRight className="h-3.5 w-3.5 text-accent-brand shrink-0" />
            <input
              ref={subtaskInputRef}
              type="text"
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              placeholder={t("scratchpad.newTaskPlaceholder", "Task in this group...")}
              className="flex-1 bg-bg-app border border-border-brand rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
            />
            <button
              type="submit"
              disabled={!subtaskText.trim()}
              className="px-2.5 py-1.5 bg-accent-brand text-bg-surface rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSubtaskText("");
                setIsAddingSubtask(false);
              }}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {!isCollapsed && hasChildren && (
          <div className="space-y-1">
            {item.children.map((child) => (
              <ScratchpadItemRow
                key={child.id}
                item={child}
                depth={depth + 1}
                collapsedMap={collapsedMap}
                onToggleCollapse={onToggleCollapse}
                onToggleCheck={onToggleCheck}
                onAddChild={onAddChild}
                onRenameGroup={onRenameGroup}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        style={{ paddingLeft: `${indentPx}px` }}
        className="group flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-bg-surface/70 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleCollapse(item.id)}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
              title={isCollapsed ? t("common.expand", "Expand") : t("common.collapse", "Collapse")}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-accent-brand" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-accent-brand" />
              )}
            </button>
          ) : (
            <div className="w-5.5 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onToggleCheck(item.id, !item.isChecked)}
            className="text-accent-brand focus:outline-none cursor-pointer shrink-0"
          >
            {item.isChecked ? (
              <CheckSquare className="h-4.5 w-4.5 opacity-80" />
            ) : (
              <Square className="h-4.5 w-4.5 text-text-secondary" />
            )}
          </button>

          <span
            onClick={() => onToggleCheck(item.id, !item.isChecked)}
            className={`text-sm break-words flex-1 cursor-pointer select-none leading-relaxed ${
              item.isChecked ? "line-through text-text-secondary/60" : "text-text-primary"
            }`}
          >
            {item.text}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {!item.isChecked && (
            <button
              onClick={() => {
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent-brand hover:bg-bg-app transition-colors cursor-pointer"
              title={t("scratchpad.addSubtask", "Add subtask")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-bg-app transition-colors cursor-pointer"
            title={t("common.delete", "Delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isAddingSubtask && (
        <form
          onSubmit={handleSubtaskSubmit}
          style={{ paddingLeft: `${indentPx + 24}px` }}
          className="flex items-center gap-2 py-1 animate-fade-in"
        >
          <CornerDownRight className="h-3.5 w-3.5 text-accent-brand shrink-0" />
          <input
            ref={subtaskInputRef}
            type="text"
            value={subtaskText}
            onChange={(e) => setSubtaskText(e.target.value)}
            placeholder={t("scratchpad.subtaskPlaceholder", "New subtask...")}
            className="flex-1 bg-bg-app border border-border-brand rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
          />
          <button
            type="submit"
            disabled={!subtaskText.trim()}
            className="px-2.5 py-1.5 bg-accent-brand text-bg-surface rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSubtaskText("");
              setIsAddingSubtask(false);
            }}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {!isCollapsed && hasChildren && (
        <div className="space-y-1">
          {item.children.map((child) => (
            <ScratchpadItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              collapsedMap={collapsedMap}
              onToggleCollapse={onToggleCollapse}
              onToggleCheck={onToggleCheck}
              onAddChild={onAddChild}
              onRenameGroup={onRenameGroup}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
