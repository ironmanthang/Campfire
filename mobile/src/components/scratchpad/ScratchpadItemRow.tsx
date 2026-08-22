import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import { type ScratchpadItem } from '@campfire/core';

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
  const [subtaskText, setSubtaskText] = useState('');
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
      setSubtaskText('');
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

  const indentPx = Math.min(depth, 3) * 16;

  if (item.isGroup) {
    return (
      <div className="space-y-1.5 my-2.5">
        <div
          style={{ paddingLeft: `${indentPx}px` }}
          className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-bg-surface border border-border-brand/70 shadow-xs"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onToggleCollapse(item.id)}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary active:bg-bg-app transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={18} className="text-accent-brand" />
              ) : (
                <ChevronDown size={18} className="text-accent-brand" />
              )}
            </button>

            <Folder size={18} className="text-accent-brand shrink-0" />

            {isEditingGroup ? (
              <form onSubmit={handleGroupRenameSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  ref={groupInputRef}
                  type="text"
                  value={groupEditText}
                  onChange={(e) => setGroupEditText(e.target.value)}
                  onBlur={handleGroupRenameSubmit}
                  enterKeyHint="done"
                  className="w-full bg-bg-app border border-accent-brand rounded-xl px-2.5 py-1 text-sm font-bold text-text-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1 text-accent-brand"
                >
                  <Check size={18} />
                </button>
              </form>
            ) : (
              <span
                onClick={() => setIsEditingGroup(true)}
                className="font-bold text-sm text-text-primary truncate"
              >
                {item.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isEditingGroup && (
              <button
                type="button"
                onClick={() => setIsEditingGroup(true)}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Edit2 size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 text-accent-brand hover:opacity-80 transition-opacity"
            >
              <Plus size={16} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {isAddingSubtask && (
          <form
            onSubmit={handleSubtaskSubmit}
            style={{ paddingLeft: `${indentPx + 20}px` }}
            className="flex items-center gap-2 py-1 animate-fade-in"
          >
            <CornerDownRight size={14} className="text-accent-brand shrink-0" />
            <input
              ref={subtaskInputRef}
              type="text"
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              enterKeyHint="done"
              placeholder={t('scratchpad.newTaskPlaceholder', 'Task in this group...')}
              className="flex-1 bg-bg-app border border-border-brand rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
            />
            <button
              type="submit"
              disabled={!subtaskText.trim()}
              className="px-3 py-2 bg-accent-brand text-bg-surface rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setSubtaskText('');
                setIsAddingSubtask(false);
              }}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors shrink-0"
            >
              <X size={14} />
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
        className="flex items-start justify-between gap-2.5 p-2.5 rounded-2xl bg-bg-surface/60 active:bg-bg-surface transition-colors"
      >
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleCollapse(item.id)}
              className="mt-0.5 p-0.5 rounded-md text-text-secondary hover:text-text-primary"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-accent-brand" />
              ) : (
                <ChevronDown size={16} className="text-accent-brand" />
              )}
            </button>
          ) : (
            <div className="w-5 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onToggleCheck(item.id, !item.isChecked)}
            className="mt-0.5 text-accent-brand focus:outline-none shrink-0 cursor-pointer"
          >
            {item.isChecked ? (
              <CheckSquare size={18} className="opacity-80" />
            ) : (
              <Square size={18} className="text-text-secondary" />
            )}
          </button>

          <span
            onClick={() => onToggleCheck(item.id, !item.isChecked)}
            className={`text-sm break-words flex-1 leading-relaxed ${
              item.isChecked ? 'line-through text-text-secondary/60' : 'text-text-primary'
            }`}
          >
            {item.text}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!item.isChecked && (
            <button
              type="button"
              onClick={() => {
                setIsAddingSubtask(true);
                if (isCollapsed) onToggleCollapse(item.id);
              }}
              className="p-1.5 text-text-secondary hover:text-accent-brand transition-colors"
              title={t('scratchpad.addSubtask', 'Add subtask')}
            >
              <Plus size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isAddingSubtask && (
        <form
          onSubmit={handleSubtaskSubmit}
          style={{ paddingLeft: `${indentPx + 20}px` }}
          className="flex items-center gap-2 py-1 animate-fade-in"
        >
          <CornerDownRight size={14} className="text-accent-brand shrink-0" />
          <input
            ref={subtaskInputRef}
            type="text"
            value={subtaskText}
            onChange={(e) => setSubtaskText(e.target.value)}
            enterKeyHint="done"
            placeholder={t('scratchpad.subtaskPlaceholder', 'New subtask...')}
            className="flex-1 bg-bg-app border border-border-brand rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
          />
          <button
            type="submit"
            disabled={!subtaskText.trim()}
            className="px-3 py-2 bg-accent-brand text-bg-surface rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSubtaskText('');
              setIsAddingSubtask(false);
            }}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <X size={14} />
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
