import React, { useState, useRef, useCallback } from "react";
import {
  Trash2,
  FolderPlus,
  Sparkles,
  Pin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCompletedItems, countCompletedTasks } from "@campfire/core";
import { useScratchpad } from "../hooks/useScratchpad";
import { useResizer } from "../hooks/useResizer";
import { usePersistedState } from "../hooks/usePersistedState";
import { SidebarToggleButton } from "../components/layout/SidebarToggleButton";
import { DragHandles } from "../components/common";
import { useAppStore } from "../store/useAppStore";
import { ScratchpadItemRow } from "../components/scratchpad/ScratchpadItemRow";
import { ScratchpadQuickAdd } from "../components/scratchpad/ScratchpadQuickAdd";
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

  const pinnedItems = items.filter((item) => Boolean(item.isPinned));
  const unpinnedItems = items.filter((item) => !item.isPinned);

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
          ) : (
            <div className="space-y-3">
              {pinnedItems.length > 0 ? (
                <>
                  {/* Pinned Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-accent-brand uppercase tracking-wider select-none">
                      <Pin className="h-3.5 w-3.5 fill-current" />
                      <span>{t("scratchpad.pinned", "Pinned")}</span>
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
                        <span>{t("scratchpad.other", "Other Notes")}</span>
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
