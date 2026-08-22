import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Folder,
  Edit2,
  Check,
  X,
  Pin,
  CornerDownRight,
  MoreHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ScratchpadItem } from "@campfire/core";

export interface ScratchpadItemRowProps {
  item: ScratchpadItem;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  collapsedMap: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onToggleCheck: (id: string, checked?: boolean) => void;
  onAddChild: (parentId: string, text: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onTogglePin?: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onMoveChild?: (parentId: string, childId: string, direction: 'up' | 'down') => void;
  isDuplicate?: (text: string, excludeId?: string) => boolean;
  onDelete: (id: string, isGroup?: boolean, text?: string) => void;
}

export function ScratchpadItemRow({
  item,
  depth,
  isFirst,
  isLast,
  collapsedMap,
  onToggleCollapse,
  onToggleCheck,
  onAddChild,
  onUpdateText,
  onTogglePin,
  onMove,
  onMoveChild,
  isDuplicate,
  onDelete,
}: ScratchpadItemRowProps) {
  const { t } = useTranslation();
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const subtaskFormRef = useRef<HTMLFormElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isCollapsed = Boolean(collapsedMap[item.id]);
  const hasChildren = Boolean(item.children && item.children.length > 0);

  useEffect(() => {
    setEditText(item.text);
  }, [item.text]);

  useEffect(() => {
    if (!isAddingSubtask) return;
    subtaskInputRef.current?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      if (subtaskFormRef.current && !subtaskFormRef.current.contains(e.target as Node)) {
        setSubtaskText("");
        setIsAddingSubtask(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSubtaskText("");
        setIsAddingSubtask(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddingSubtask]);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  // Close ••• menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreMenuOpen]);

  const isEditDuplicate = Boolean(
    isEditing &&
    editText.trim() &&
    editText.trim().toLowerCase() !== item.text.trim().toLowerCase() &&
    isDuplicate?.(editText, item.id)
  );

  const handleSubtaskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = subtaskText.trim();
    if (trimmed) {
      onAddChild(item.id, trimmed);
      setSubtaskText("");
      setIsAddingSubtask(false);
    }
  };

  const handleEditSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text && !isEditDuplicate) {
      onUpdateText(item.id, trimmed);
      setIsEditing(false);
    } else if (trimmed === item.text) {
      setIsEditing(false);
    }
  };

  const completedChildCount = hasChildren
    ? item.children.filter((child) => !child.isGroup && child.isChecked).length
    : 0;
  const totalChildCount = hasChildren ? item.children.length : 0;

  // Shared edit form used in both group and task rows
  const editForm = (
    <form onSubmit={handleEditSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        ref={editInputRef}
        type="text"
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditText(item.text);
            setIsEditing(false);
          }
        }}
        onBlur={handleEditSubmit}
        className={`w-full bg-bg-app border ${
          isEditDuplicate ? "border-red-400 focus:border-red-400" : "border-accent-brand"
        } rounded-lg px-2 py-1 text-sm ${item.isGroup ? "font-bold" : ""} text-text-primary focus:outline-none`}
      />
      <button
        type="submit"
        disabled={!editText.trim() || isEditDuplicate}
        className="p-1 text-accent-brand hover:opacity-80 disabled:opacity-30 disabled:pointer-events-none transition-opacity cursor-pointer"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setEditText(item.text);
          setIsEditing(false);
        }}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );

  // ••• context menu (Pin + Rename) — only shown at depth === 0 or when rename applies
  const moreMenu = (
    <div className="relative" ref={moreMenuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMoreMenuOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
        title={t("common.more", "More options")}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {moreMenuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-bg-surface border border-border-brand rounded-xl shadow-lg py-1 min-w-[130px] animate-fade-in">
          {depth === 0 && onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(item.id);
                setMoreMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer hover:bg-bg-app ${
                item.isPinned ? "text-accent-brand" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Pin className={`h-3.5 w-3.5 shrink-0 ${item.isPinned ? "fill-current" : ""}`} />
              {item.isPinned
                ? t("scratchpad.unpin", "Unpin")
                : t("scratchpad.pin", "Pin to top")}
            </button>
          )}
          {!isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              {t("scratchpad.rename", "Rename")}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Shared completion badge
  const badge = hasChildren ? (
    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-bg-app text-text-secondary border border-border-brand/40 select-none shrink-0">
      {completedChildCount}/{totalChildCount}
    </span>
  ) : null;

  // Shared subtask add form
  const subtaskForm = isAddingSubtask && (
    <form
      ref={subtaskFormRef}
      onSubmit={handleSubtaskSubmit}
      className="flex items-center gap-2 py-1 pl-6 animate-fade-in"
    >
      <CornerDownRight className="h-3.5 w-3.5 text-accent-brand shrink-0" />
      <input
        ref={subtaskInputRef}
        type="text"
        value={subtaskText}
        onChange={(e) => setSubtaskText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSubtaskText("");
            setIsAddingSubtask(false);
          }
        }}
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
  );

  if (item.isGroup) {
    return (
      <div className="space-y-1 my-2">
        <div
          className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-bg-surface/90 border border-border-brand/60 shadow-xs hover:border-accent-brand/40 transition-all cursor-pointer"
          onClick={() => { if (!isEditing) onToggleCollapse(item.id); }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(item.id); }}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? t("common.expand", "Expand") : t("common.collapse", "Collapse")}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-accent-brand" />
              ) : (
                <ChevronDown className="h-4 w-4 text-accent-brand" />
              )}
            </button>

            <Folder className="h-4.5 w-4.5 text-accent-brand shrink-0" />

            {isEditing ? editForm : (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="font-bold text-sm text-text-primary truncate min-w-0">
                  {item.text}
                </span>
                {/* Badge after the title text */}
                {badge}
              </div>
            )}
          </div>

          {/* Hover-revealed action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {/* Primary actions: Add, Delete, Move Up, Move Down */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent-brand hover:bg-bg-app transition-colors cursor-pointer"
              title={t("scratchpad.addTaskToGroup", "Add task to group")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id, true, item.text); }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-bg-app transition-colors cursor-pointer"
              title={t("common.delete", "Delete group")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center bg-bg-app border border-border-brand/40 rounded-lg select-none shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(item.id, "up"); }}
                disabled={isFirst}
                title={t("scratchpad.moveUp", "Move up")}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <div className="w-[1px] h-3 bg-border-brand/30" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMove(item.id, "down"); }}
                disabled={isLast}
                title={t("scratchpad.moveDown", "Move down")}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ••• menu: Pin + Rename */}
            {moreMenu}
          </div>
        </div>

        {subtaskForm}

        {!isCollapsed && hasChildren && (
          <div className="space-y-1 relative pl-3.5 ml-2.5 border-l-2 border-accent-brand/30">
            {item.children.map((child, idx) => (
              <ScratchpadItemRow
                key={child.id}
                item={child}
                depth={depth + 1}
                isFirst={idx === 0}
                isLast={idx === item.children.length - 1}
                collapsedMap={collapsedMap}
                onToggleCollapse={onToggleCollapse}
                onToggleCheck={onToggleCheck}
                onAddChild={onAddChild}
                onUpdateText={onUpdateText}
                onMoveChild={onMoveChild}
                onMove={(childId, dir) => {
                  if (onMoveChild) {
                    onMoveChild(item.id, childId, dir);
                  }
                }}
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
        className="group flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-bg-surface/70 transition-colors cursor-pointer"
        onClick={() => {
          if (!isEditing) onToggleCheck(item.id, !item.isChecked);
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Collapse/expand button for parent tasks with children */}
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(item.id); }}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer shrink-0"
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

          {/* Checkbox — stop propagation so the outer onClick doesn't double-fire */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleCheck(item.id, !item.isChecked); }}
            className="text-accent-brand focus:outline-none cursor-pointer shrink-0"
          >
            {item.isChecked ? (
              <CheckSquare className="h-4.5 w-4.5 opacity-80" />
            ) : (
              <Square className="h-4.5 w-4.5 text-text-secondary" />
            )}
          </button>

          {isEditing ? editForm : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span
                className={`text-sm break-words min-w-0 select-none leading-relaxed ${
                  item.isChecked ? "line-through text-text-secondary/60" : "text-text-primary"
                }`}
              >
                {item.text}
              </span>
              {/* Badge after the title text */}
              {badge}
            </div>
          )}
        </div>

        {/* Hover-revealed action buttons */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Primary action slot: Add Subtask when unchecked, Delete when checked */}
          {!item.isChecked ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent-brand hover:bg-bg-app transition-colors cursor-pointer"
              title={t("scratchpad.addSubtask", "Add subtask")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id, false, item.text); }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-bg-app transition-colors cursor-pointer"
              title={t("common.delete", "Delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="flex items-center bg-bg-app border border-border-brand/40 rounded-lg select-none shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove(item.id, "up"); }}
              disabled={isFirst}
              title={t("scratchpad.moveUp", "Move up")}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-border-brand/30" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove(item.id, "down"); }}
              disabled={isLast}
              title={t("scratchpad.moveDown", "Move down")}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ••• menu: Pin + Rename */}
          {moreMenu}
        </div>
      </div>

      {subtaskForm}

      {!isCollapsed && hasChildren && (
        <div className="space-y-1 relative pl-3.5 ml-2.5 border-l-2 border-accent-brand/30">
          {item.children.map((child, idx) => (
            <ScratchpadItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              isFirst={idx === 0}
              isLast={idx === item.children.length - 1}
              collapsedMap={collapsedMap}
              onToggleCollapse={onToggleCollapse}
              onToggleCheck={onToggleCheck}
              onAddChild={onAddChild}
              onUpdateText={onUpdateText}
              onMoveChild={onMoveChild}
              onMove={(childId, dir) => {
                if (onMoveChild) {
                  onMoveChild(item.id, childId, dir);
                }
              }}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
