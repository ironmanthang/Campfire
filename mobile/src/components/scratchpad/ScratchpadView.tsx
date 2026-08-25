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
  Pin,
} from 'lucide-react';
import { type ScratchpadItem } from '@campfire/core';
import { useScratchpad } from '../../hooks/useScratchpad';
import { usePersistedState } from '../../hooks/usePersistedState';
import { ScratchpadItemRow } from './ScratchpadItemRow';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

type DeleteConfirmState =
  | { type: 'item'; id: string; name: string }
  | { type: 'group'; id: string; name: string }
  | { type: 'clearCompleted'; id: string; name: string }
  | null;

interface ScratchpadViewProps {
  onBack: () => void;
  onSyncTrigger?: () => void;
  refreshKey?: number;
}

export const ScratchpadView: React.FC<ScratchpadViewProps> = ({ onBack, onSyncTrigger, refreshKey }) => {
  const { t } = useTranslation();
  const [newTaskText, setNewTaskText] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [collapsedMap, setCollapsedMap] = usePersistedState<Record<string, boolean>>(
    'scratchpad_collapsed_map',
    {}
  );

  const quickInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const groupFormContainerRef = useRef<HTMLDivElement>(null);
  const newGroupBtnRef = useRef<HTMLButtonElement>(null);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteConfirmState>(null);

  const {
    items,
    loading,
    toggleItemWithChildren,
    addItem,
    addChildItem,
    addGroup,
    updateItemText,
    togglePinItem,
    moveItem,
    moveChildItem,
    isDuplicate,
    removeItem,
    clearCompleted,
  } = useScratchpad(true, onSyncTrigger, refreshKey);

  useEffect(() => {
    quickInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isCreatingGroup) return;
    groupInputRef.current?.focus();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        groupFormContainerRef.current &&
        !groupFormContainerRef.current.contains(target) &&
        !newGroupBtnRef.current?.contains(target)
      ) {
        setNewGroupName('');
        setIsCreatingGroup(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewGroupName('');
        setIsCreatingGroup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreatingGroup]);

  const isTaskDuplicate = Boolean(newTaskText.trim()) && isDuplicate(newTaskText);
  const isGroupDuplicate = Boolean(newGroupName.trim()) && isDuplicate(newGroupName);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed || isTaskDuplicate) return;
    addItem(trimmed);
    setNewTaskText('');
  };

  const handleCreateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGroupName.trim();
    if (trimmed && !isGroupDuplicate) {
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
  }, [setCollapsedMap]);

  const checkHasCompleted = (itemList: ScratchpadItem[]): boolean => {
    return itemList.some(
      (item) =>
        (!item.isGroup && item.isChecked) ||
        (item.children && item.children.length > 0 && checkHasCompleted(item.children))
    );
  };

  const hasCompleted = checkHasCompleted(items);

  const handleDeleteRequest = useCallback((id: string, isGroup?: boolean, text?: string) => {
    setDeleteConfirmTarget({
      type: isGroup ? 'group' : 'item',
      id,
      name: text || '',
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmTarget) return;
    if (deleteConfirmTarget.type === 'clearCompleted') {
      clearCompleted();
    } else {
      removeItem(deleteConfirmTarget.id);
    }
    setDeleteConfirmTarget(null);
  }, [deleteConfirmTarget, clearCompleted, removeItem]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmTarget(null);
  }, []);

  const pinnedItems = items.filter((item) => Boolean(item.isPinned));
  const unpinnedItems = items.filter((item) => !item.isPinned);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-text">
      {/* View Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-brand bg-bg-surface shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary active:bg-bg-app transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            title={t('common.back', 'Back to Journal')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-base text-text-primary leading-tight truncate">
              {t('scratchpad.title', 'Scratchpad & Notes')}
            </h2>
            <p className="text-[11px] text-text-secondary truncate">
              {t('scratchpad.subtitle', 'Quick persistent task list')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            ref={newGroupBtnRef}
            type="button"
            onClick={() => setIsCreatingGroup((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-bg-app border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <FolderPlus size={15} className="text-accent-brand" />
            <span>{t('scratchpad.newGroup', 'Group')}</span>
          </button>

          {hasCompleted && (
            <button
              type="button"
              onClick={() => setDeleteConfirmTarget({ type: 'clearCompleted', id: '', name: '' })}
              className="p-1.5 rounded-xl border border-border-brand hover:border-red-400 text-xs font-semibold text-text-secondary hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-colors bg-bg-app shadow-xs"
              title={t('scratchpad.clearCompleted', 'Clear completed tasks')}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Quick Add Form */}
        <div className="space-y-2.5">
          <div className="space-y-1">
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <input
                ref={quickInputRef}
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                enterKeyHint="done"
                placeholder={t('scratchpad.addPlaceholder', 'Quick scratch idea or todo...')}
                className={`flex-1 bg-bg-surface border ${
                  isTaskDuplicate ? 'border-red-400 focus:border-red-400' : 'border-border-brand focus:border-accent-brand'
                } rounded-2xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none shadow-xs`}
              />
              <button
                type="submit"
                disabled={!newTaskText.trim() || isTaskDuplicate}
                className="px-4 py-2.5 rounded-2xl bg-accent-brand text-bg-surface font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus size={18} />
              </button>
            </form>
            {isTaskDuplicate && (
              <p className="text-xs text-red-400 pl-2">
                {t('scratchpad.alreadyExists', 'An item with this name already exists')}
              </p>
            )}
          </div>

          {isCreatingGroup && (
            <div ref={groupFormContainerRef} className="space-y-1 animate-fade-in">
              <form
                onSubmit={handleCreateGroup}
                className={`flex items-center gap-2 p-2.5 bg-bg-surface border ${
                  isGroupDuplicate ? 'border-red-400' : 'border-accent-brand/60'
                } rounded-2xl shadow-xs`}
              >
                <Folder size={16} className="text-accent-brand shrink-0" />
                <input
                  ref={groupInputRef}
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNewGroupName('');
                      setIsCreatingGroup(false);
                    }
                  }}
                  enterKeyHint="done"
                  placeholder={t('scratchpad.groupPlaceholder', 'Group name (e.g. Work, Shopping)...')}
                  className="flex-1 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isGroupDuplicate}
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
              {isGroupDuplicate && (
                <p className="text-xs text-red-400 pl-2">
                  {t('scratchpad.alreadyExists', 'An item with this name already exists')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Task Items List */}
        <div className="bg-bg-surface/40 border border-border-brand/40 rounded-3xl p-4 shadow-xs min-h-[300px] flex flex-col justify-between">
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
            <div className="space-y-3">
              {pinnedItems.length > 0 ? (
                <>
                  {/* Pinned Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-accent-brand uppercase tracking-wider select-none">
                      <Pin size={13} className="fill-current" />
                      <span>{t('scratchpad.pinned', 'Pinned')}</span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-md bg-accent-brand/10 border border-accent-brand/30 ml-1">
                        {pinnedItems.length}
                      </span>
                    </div>

                    {pinnedItems.map((item, idx) => (
                      <ScratchpadItemRow
                        key={item.id}
                        item={item}
                        depth={0}
                        isFirst={idx === 0}
                        isLast={idx === pinnedItems.length - 1}
                        collapsedMap={collapsedMap}
                        onToggleCollapse={toggleCollapse}
                        onToggleCheck={toggleItemWithChildren}
                        onAddChild={addChildItem}
                        onUpdateText={updateItemText}
                        onTogglePin={togglePinItem}
                        onMove={moveItem}
                        onMoveChild={moveChildItem}
                        isDuplicate={isDuplicate}
                        onDelete={handleDeleteRequest}
                      />
                    ))}
                  </div>

                  {/* Unpinned Section */}
                  {unpinnedItems.length > 0 && (
                    <div className="space-y-1 pt-3 border-t border-border-brand/30">
                      <div className="flex items-center gap-1.5 px-2 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider select-none">
                        <span>{t('scratchpad.other', 'Other Notes')}</span>
                        <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-md bg-bg-app border border-border-brand/40 ml-1">
                          {unpinnedItems.length}
                        </span>
                      </div>

                      {unpinnedItems.map((item, idx) => (
                        <ScratchpadItemRow
                          key={item.id}
                          item={item}
                          depth={0}
                          isFirst={idx === 0}
                          isLast={idx === unpinnedItems.length - 1}
                          collapsedMap={collapsedMap}
                          onToggleCollapse={toggleCollapse}
                          onToggleCheck={toggleItemWithChildren}
                          onAddChild={addChildItem}
                          onUpdateText={updateItemText}
                          onTogglePin={togglePinItem}
                          onMove={moveItem}
                          onMoveChild={moveChildItem}
                          isDuplicate={isDuplicate}
                          onDelete={handleDeleteRequest}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <ScratchpadItemRow
                      key={item.id}
                      item={item}
                      depth={0}
                      isFirst={idx === 0}
                      isLast={idx === items.length - 1}
                      collapsedMap={collapsedMap}
                      onToggleCollapse={toggleCollapse}
                      onToggleCheck={toggleItemWithChildren}
                      onAddChild={addChildItem}
                      onUpdateText={updateItemText}
                      onTogglePin={togglePinItem}
                      onMove={moveItem}
                      onMoveChild={moveChildItem}
                      isDuplicate={isDuplicate}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <DeleteConfirmModal
          title={
            deleteConfirmTarget.type === 'clearCompleted'
              ? t('scratchpad.clearCompletedConfirmTitle', 'Clear Completed Tasks')
              : deleteConfirmTarget.type === 'group'
              ? t('scratchpad.deleteGroupConfirmTitle', 'Delete Group')
              : t('scratchpad.deleteTaskConfirmTitle', 'Delete Note')
          }
          message={
            deleteConfirmTarget.type === 'clearCompleted'
              ? t('scratchpad.clearCompletedConfirmMessage', 'Are you sure you want to permanently clear all completed tasks? This action cannot be undone.')
              : deleteConfirmTarget.type === 'group'
              ? t('scratchpad.deleteGroupConfirmMessage', {
                  defaultValue: 'Are you sure you want to permanently delete the group "{{name}}" and all of its tasks? This action cannot be undone.',
                  name: deleteConfirmTarget.name,
                })
              : t('scratchpad.deleteTaskConfirmMessage', {
                  defaultValue: 'Are you sure you want to permanently delete "{{name}}"? This action cannot be undone.',
                  name: deleteConfirmTarget.name,
                })
          }
          confirmLabel={
            deleteConfirmTarget.type === 'clearCompleted'
              ? t('scratchpad.clearConfirmButton', 'Clear Completed')
              : t('deleteConfirmModal.deleteButton', 'Delete Permanent')
          }
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default ScratchpadView;
