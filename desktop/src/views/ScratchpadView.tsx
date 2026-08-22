import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  FolderPlus,
  Folder,
  X,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ScratchpadItem } from "@campfire/core";
import { useScratchpad } from "../hooks/useScratchpad";
import { useResizer } from "../hooks/useResizer";
import { usePersistedState } from "../hooks/usePersistedState";
import { SidebarToggleButton } from "../components/layout/SidebarToggleButton";
import { DragHandles } from "../components/common";
import { useAppStore } from "../store/useAppStore";
import { ScratchpadItemRow } from "./ScratchpadItemRow";

export function ScratchpadView() {
  const { t } = useTranslation();
  const [newTaskText, setNewTaskText] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [collapsedMap, setCollapsedMap] = usePersistedState<Record<string, boolean>>(
    "scratchpad_collapsed_map",
    {}
  );

  const quickInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const { sidebarCollapsed, toggleSidebar } = useAppStore();

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

  const [scratchpadWidth, startDrag] = useResizer({
    key: "scratchpad_view_width",
    defaultVal: 768,
    mode: "px",
  });

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
    setNewTaskText("");
  };

  const handleCreateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGroupName.trim();
    if (trimmed) {
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

  const checkHasCompleted = (itemList: ScratchpadItem[]): boolean => {
    return itemList.some(
      (item) =>
        (!item.isGroup && item.isChecked) ||
        (item.children && item.children.length > 0 && checkHasCompleted(item.children))
    );
  };

  const hasCompleted = checkHasCompleted(items);

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
              onClick={() => setIsCreatingGroup(true)}
              className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FolderPlus className="h-4 w-4 text-accent-brand" />
              <span>{t("scratchpad.newGroup", "New Group")}</span>
            </button>
          </div>
        </div>

        {/* Quick Add Form */}
        <div className="space-y-3">
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <input
              ref={quickInputRef}
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={t("scratchpad.addPlaceholder", "Quick scratch idea or todo...")}
              className="flex-1 bg-bg-surface border border-border-brand rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand shadow-xs"
            />
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="px-4 py-3 rounded-2xl bg-accent-brand text-bg-surface font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="h-4.5 w-4.5" />
              <span className="hidden sm:inline text-xs font-bold">{t("common.add", "Add")}</span>
            </button>
          </form>

          {isCreatingGroup && (
            <form onSubmit={handleCreateGroup} className="flex items-center gap-2 p-3 bg-bg-surface border border-accent-brand/50 rounded-2xl animate-fade-in shadow-sm">
              <Folder className="h-4 w-4 text-accent-brand shrink-0" />
              <input
                ref={groupInputRef}
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t("scratchpad.groupPlaceholder", "Group name (e.g. Work, Shopping)...")}
                className="flex-1 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newGroupName.trim()}
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
          )}
        </div>

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
            <div className="mt-6 pt-4 border-t border-border-brand/40 flex justify-end">
              <button
                onClick={clearCompleted}
                className="px-3 py-1.5 rounded-xl border border-border-brand hover:border-red-400 text-xs font-semibold text-text-secondary hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-colors bg-bg-surface"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("scratchpad.clearCompleted", "Clear completed tasks")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScratchpadView;
