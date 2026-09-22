import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Trash2,
  FolderPlus,
  Sparkles,
  Pin,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCompletedItems, countCompletedTasks, ScratchpadItem } from "@campfire/core";
import { useScratchpad } from "../hooks/useScratchpad";
import { useResizer } from "../hooks/useResizer";
import { usePersistedState } from "../hooks/usePersistedState";
import { SidebarToggleButton } from "../components/layout/SidebarToggleButton";
import { DragHandles } from "../components/common";
import { useAppStore } from "../store/useAppStore";
import { ScratchpadItemRow } from "../components/scratchpad/ScratchpadItemRow";
import { ScratchpadQuickAdd } from "../components/scratchpad/ScratchpadQuickAdd";
import { ScratchpadSearchBar } from "../components/scratchpad/ScratchpadSearchBar";
import { filterItemTree, countMatches } from "../components/scratchpad/scratchpadSearchUtils";
import { DeleteConfirmModal } from "../components/modals/data_management/DeleteConfirmModal";
import { ClearCompletedModal } from "../components/modals/data_management/ClearCompletedModal";

type DeleteConfirmState =
  | { type: 'item'; id: string; name: string }
  | { type: 'group'; id: string; name: string }
  | null;

export function ScratchpadView() {
  const { t } = useTranslation();
  const [newTaskText, setNewTaskText] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [collapsedMap, setCollapsedMap] = usePersistedState<Record<string, boolean>>(
    "scratchpad_collapsed_map",
    {}
  );

  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const newGroupBtnRef = useRef<HTMLButtonElement>(null);

  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteConfirmState>(null);
  const [isClearCompletedModalOpen, setIsClearCompletedModalOpen] = useState(false);

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
    clearSelectedCompleted,
  } = useScratchpad(true);

  const [scratchpadWidth, startDrag] = useResizer({
    key: "scratchpad_view_width",
    defaultVal: 768,
    mode: "px",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearching(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { displayItems, expandedGroupIds, matchedCount } = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) {
      return {
        displayItems: items,
        expandedGroupIds: new Set<string>(),
        matchedCount: 0,
      };
    }
    const expIds = new Set<string>();
    const res: ScratchpadItem[] = [];
    for (const item of items) {
      const matchRes = filterItemTree(item, q, expIds);
      if (matchRes.matched) {
        res.push(matchRes.filteredItem);
      }
    }
    return {
      displayItems: res,
      expandedGroupIds: expIds,
      matchedCount: countMatches(res),
    };
  }, [items, searchFilter]);

  const effectiveCollapsedMap = useMemo(() => {
    if (!searchFilter.trim() || expandedGroupIds.size === 0) return collapsedMap;
    const merged = { ...collapsedMap };
    expandedGroupIds.forEach((id) => {
      merged[id] = false;
    });
    return merged;
  }, [collapsedMap, searchFilter, expandedGroupIds]);

  const isTaskDuplicate = Boolean(newTaskText.trim()) && isDuplicate(newTaskText);
  const isGroupDuplicate = Boolean(newGroupName.trim()) && isDuplicate(newGroupName);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed || isTaskDuplicate) return;
    addItem(trimmed);
    setNewTaskText("");
  };

  const handleCreateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGroupName.trim();
    if (trimmed && !isGroupDuplicate) {
      addGroup(trimmed);
      setNewGroupName("");
      setIsCreatingGroup(false);
    }
  };

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, [setCollapsedMap]);

  const completedCount = countCompletedTasks(items);

  const handleDeleteRequest = useCallback((id: string, isGroup?: boolean, text?: string) => {
    setDeleteConfirmTarget({
      type: isGroup ? 'group' : 'item',
      id,
      name: text || '',
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmTarget) return;
    removeItem(deleteConfirmTarget.id);
    setDeleteConfirmTarget(null);
  }, [deleteConfirmTarget, removeItem]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmTarget(null);
  }, []);

  const displayPinned = displayItems.filter((item) => Boolean(item.isPinned));
  const displayUnpinned = displayItems.filter((item) => !item.isPinned);

  const renderItemRow = (item: ScratchpadItem, idx: number, list: ScratchpadItem[]) => (
    <ScratchpadItemRow
      key={item.id}
      item={item}
      depth={0}
      isFirst={idx === 0}
      isLast={idx === list.length - 1}
      collapsedMap={effectiveCollapsedMap}
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
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="relative mx-auto w-full px-8 py-8 min-h-full flex flex-col space-y-6"
        style={{ maxWidth: `${scratchpadWidth}px` }}
      >
        <DragHandles startDrag={startDrag} />

        {/* View Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <SidebarToggleButton
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={toggleSidebar}
              className="mt-1"
            />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {t("scratchpad.title", "Scratchpad & Notes")}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {t("scratchpad.subtitle", "Quick persistent tasks, notes, and scratch ideas")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSearching((prev) => {
                  const next = !prev;
                  if (!next) setSearchFilter("");
                  else setTimeout(() => searchInputRef.current?.focus(), 50);
                  return next;
                });
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isSearching || searchFilter
                  ? "bg-accent-brand/10 border-accent-brand text-accent-brand"
                  : "bg-bg-surface border-border-brand hover:border-accent-brand text-text-primary"
              }`}
              title={t("scratchpad.searchTooltip", "Filter notes (Ctrl+F)")}
            >
              <Search className="h-4 w-4" />
              <span>{t("scratchpad.search", "Search")}</span>
            </button>

            {completedCount > 0 && (
              <button
                onClick={() => setIsClearCompletedModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-border-brand hover:border-red-400 text-xs font-semibold text-text-secondary hover:text-red-400 flex items-center gap-2 cursor-pointer transition-colors bg-bg-surface shadow-xs"
              >
                <Trash2 className="h-4 w-4" />
                <span>
                  {t("scratchpad.clearCompleted", "Clear completed tasks")} ({completedCount})
                </span>
              </button>
            )}

            <button
              ref={newGroupBtnRef}
              onClick={() => setIsCreatingGroup((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FolderPlus className="h-4 w-4 text-accent-brand" />
              <span>{t("scratchpad.newGroup", "New Group")}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearching && (
          <ScratchpadSearchBar
            searchInputRef={searchInputRef}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            onClose={() => setIsSearching(false)}
            matchedCount={matchedCount}
          />
        )}

        {/* Quick Add Form */}
        <ScratchpadQuickAdd
          newTaskText={newTaskText}
          setNewTaskText={setNewTaskText}
          onAddTask={handleAddTask}
          isTaskDuplicate={isTaskDuplicate}
          isCreatingGroup={isCreatingGroup}
          setIsCreatingGroup={setIsCreatingGroup}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          onCreateGroup={handleCreateGroup}
          isGroupDuplicate={isGroupDuplicate}
          newGroupBtnRef={newGroupBtnRef}
        />

        {/* Task Items List */}
        <div className="flex-1 bg-bg-surface/40 border border-border-brand/40 rounded-3xl p-5 shadow-xs min-h-[360px] flex flex-col justify-between">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              {t("common.loading", "Loading...")}
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary py-16 select-none">
              <Sparkles className="h-10 w-10 text-border-brand mb-3 animate-pulse" />
              <p className="text-sm font-semibold">{t("scratchpad.empty", "No scratch ideas or tasks yet.")}</p>
              <p className="text-xs text-text-secondary/70 mt-1 max-w-xs">
                {t("scratchpad.emptyHint", "Add a quick thought above before you forget!")}
              </p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary py-16 select-none">
              <Search className="h-8 w-8 text-border-brand mb-2 opacity-60" />
              <p className="text-sm font-semibold">{t("scratchpad.noSearchResults", "No notes match your filter.")}</p>
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="mt-2 text-xs text-accent-brand hover:underline cursor-pointer"
              >
                {t("scratchpad.clearFilter", "Clear filter")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayPinned.length > 0 ? (
                <>
                  {/* Pinned Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-accent-brand uppercase tracking-wider select-none">
                      <Pin className="h-3.5 w-3.5 fill-current" />
                      <span>{t("scratchpad.pinned", "Pinned")}</span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-md bg-accent-brand/10 border border-accent-brand/30 ml-1">
                        {displayPinned.length}
                      </span>
                    </div>

                    {displayPinned.map((item, idx) => renderItemRow(item, idx, displayPinned))}
                  </div>

                  {/* Unpinned Section */}
                  {displayUnpinned.length > 0 && (
                    <div className="space-y-1 pt-3 border-t border-border-brand/30">
                      <div className="flex items-center gap-1.5 px-2 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider select-none">
                        <span>{t("scratchpad.other", "Other Notes")}</span>
                        <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-md bg-bg-app border border-border-brand/40 ml-1">
                          {displayUnpinned.length}
                        </span>
                      </div>

                      {displayUnpinned.map((item, idx) => renderItemRow(item, idx, displayUnpinned))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  {displayItems.map((item, idx) => renderItemRow(item, idx, displayItems))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Clear Completed Interactive Review Modal */}
      {isClearCompletedModalOpen && (
        <ClearCompletedModal
          completedItems={getCompletedItems(items)}
          onCancel={() => setIsClearCompletedModalOpen(false)}
          onConfirm={(idsToDelete, idsToUncheck) => {
            clearSelectedCompleted(idsToDelete, idsToUncheck);
            setIsClearCompletedModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal for Groups/Items */}
      {deleteConfirmTarget && (
        <DeleteConfirmModal
          title={
            deleteConfirmTarget.type === 'group'
              ? t("scratchpad.deleteGroupConfirmTitle", "Delete Group")
              : t("scratchpad.deleteTaskConfirmTitle", "Delete Note")
          }
          message={
            deleteConfirmTarget.type === 'group'
              ? t("scratchpad.deleteGroupConfirmMessage", {
                  defaultValue: "Are you sure you want to permanently delete the group \"{{name}}\" and all of its subtasks? This action is permanent and cannot be undone.",
                  name: deleteConfirmTarget.name,
                })
              : t("scratchpad.deleteTaskConfirmMessage", {
                  defaultValue: "Are you sure you want to permanently delete \"{{name}}\"? This action is permanent and cannot be undone.",
                  name: deleteConfirmTarget.name,
                })
          }
          confirmLabel={t("deleteConfirmModal.deleteButton", "Delete Permanent")}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default ScratchpadView;
