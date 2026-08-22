import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FolderPlus,
  Folder,
  X,
  Sparkles,
} from 'lucide-react';
import { type ScratchpadItem } from '@campfire/core';
import { useScratchpad } from '../../hooks/useScratchpad';
import { ScratchpadItemRow } from './ScratchpadItemRow';

interface ScratchpadViewProps {
  onBack: () => void;
}

export const ScratchpadView: React.FC<ScratchpadViewProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [newTaskText, setNewTaskText] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const quickInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    loading,
    toggleItemWithChildren,
    addItem,
    addChildItem,
    addGroup,
    renameGroup,
    removeItem,
    clearCompleted,
  } = useScratchpad(true);

  useEffect(() => {
    quickInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isCreatingGroup) {
      groupInputRef.current?.focus();
    }
  }, [isCreatingGroup]);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setNewTaskText('');
  };

  const handleCreateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGroupName.trim();
    if (trimmed) {
      addGroup(trimmed);
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const checkHasCompleted = (itemList: ScratchpadItem[]): boolean => {
    return itemList.some(
      (item) =>
        (!item.isGroup && item.isChecked) ||
        (item.children && item.children.length > 0 && checkHasCompleted(item.children))
    );
  };

  const hasCompleted = checkHasCompleted(items);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-text">
      {/* View Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-brand bg-bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary active:bg-bg-app transition-colors flex items-center gap-1 cursor-pointer"
            title={t('common.back', 'Back to Journal')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-base text-text-primary leading-tight">
              {t('scratchpad.title', 'Scratchpad & Notes')}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {t('scratchpad.subtitle', 'Quick persistent task list')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingGroup(true)}
          className="px-3 py-1.5 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <FolderPlus size={15} className="text-accent-brand" />
          <span>{t('scratchpad.newGroup', 'Group')}</span>
        </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Quick Add Form */}
        <div className="space-y-2.5">
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <input
              ref={quickInputRef}
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              enterKeyHint="done"
              placeholder={t('scratchpad.addPlaceholder', 'Quick scratch idea or todo...')}
              className="flex-1 bg-bg-surface border border-border-brand rounded-2xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand shadow-xs"
            />
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="px-4 py-2.5 rounded-2xl bg-accent-brand text-bg-surface font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={18} />
            </button>
          </form>

          {isCreatingGroup && (
            <form
              onSubmit={handleCreateGroup}
              className="flex items-center gap-2 p-2.5 bg-bg-surface border border-accent-brand/60 rounded-2xl animate-fade-in shadow-xs"
            >
              <Folder size={16} className="text-accent-brand shrink-0" />
              <input
                ref={groupInputRef}
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                enterKeyHint="done"
                placeholder={t('scratchpad.groupPlaceholder', 'Group name (e.g. Work, Shopping)...')}
                className="flex-1 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-3 py-1.5 bg-accent-brand text-bg-surface rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
              >
                {t('common.create', 'Create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewGroupName('');
                  setIsCreatingGroup(false);
                }}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </form>
          )}
        </div>

        {/* Task Items List */}
        <div className="bg-bg-surface/50 border border-border-brand/40 rounded-3xl p-4 shadow-xs min-h-[300px] flex flex-col justify-between">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary py-12 text-sm">
              {t('common.loading', 'Loading...')}
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary py-12 select-none">
              <Sparkles size={32} className="text-border-brand mb-2.5 animate-pulse" />
              <p className="text-sm font-semibold">{t('scratchpad.empty', 'No scratch ideas or tasks yet.')}</p>
              <p className="text-xs text-text-secondary/70 mt-1 max-w-xs">
                {t('scratchpad.emptyHint', 'Add a quick thought above before you forget!')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <ScratchpadItemRow
                  key={item.id}
                  item={item}
                  depth={0}
                  collapsedMap={collapsedMap}
                  onToggleCollapse={toggleCollapse}
                  onToggleCheck={toggleItemWithChildren}
                  onAddChild={addChildItem}
                  onRenameGroup={renameGroup}
                  onDelete={removeItem}
                />
              ))}
            </div>
          )}

          {/* Footer Actions */}
          {hasCompleted && (
            <div className="mt-4 pt-3 border-t border-border-brand/40 flex justify-end">
              <button
                type="button"
                onClick={clearCompleted}
                className="px-3 py-1.5 rounded-xl border border-border-brand hover:border-red-400 text-xs font-medium text-text-secondary hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-colors bg-bg-surface"
              >
                <Trash2 size={13} />
                {t('scratchpad.clearCompleted', 'Clear completed tasks')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScratchpadView;
