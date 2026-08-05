import React, { useState, useEffect, useRef } from "react";
import { X, StickyNote, Plus, Trash2, CheckSquare, Square, Edit3, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../store/useAppStore";

interface ScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskItem {
  id: string;
  rawLine: string;
  isTask: boolean;
  isChecked: boolean;
  indent: number;
  text: string;
}

export function ScratchpadDrawer({ isOpen, onClose }: ScratchpadDrawerProps) {
  const { t } = useTranslation();
  const { config, handleSync, isDriveConnected } = useAppStore();
  
  const [content, setContent] = useState<string>("");
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [isRawMode, setIsRawMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const triggerDebouncedSync = () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (config.google_drive_auto_sync && config.google_drive_client_id && isDriveConnected) {
        handleSync().catch(console.error);
      }
    }, 1000);
  };

  // Read scratchpad content on open
  useEffect(() => {
    if (!isOpen || !config.journal_dir) return;

    let isMounted = true;
    setLoading(true);
    invoke<string>("read_entry", {
      dirPath: config.journal_dir,
      date: "scratchpad",
    })
      .then((val) => {
        if (isMounted) setContent(val || "");
      })
      .catch((err) => {
        console.error("Failed to read scratchpad:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, config.journal_dir]);

  // Handle Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Save content helper
  const saveContent = async (newContent: string) => {
    setContent(newContent);
    if (!config.journal_dir) return;
    try {
      await invoke("write_entry", {
        dirPath: config.journal_dir,
        date: "scratchpad",
        content: newContent,
      });
      triggerDebouncedSync();
    } catch (err) {
      console.error("Failed to save scratchpad:", err);
    }
  };

  // Parse markdown content into structured lines/tasks
  const parseTasks = (md: string): TaskItem[] => {
    const lines = md.split("\n");
    return lines.map((line, idx) => {
      const match = line.match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const indentStr = match[1];
        const isChecked = match[3].toLowerCase() === "x";
        const text = match[4];
        const indent = Math.floor(indentStr.length / 2);
        return {
          id: `task-${idx}`,
          rawLine: line,
          isTask: true,
          isChecked,
          indent,
          text,
        };
      }
      return {
        id: `line-${idx}`,
        rawLine: line,
        isTask: false,
        isChecked: false,
        indent: 0,
        text: line,
      };
    });
  };

  const parsedItems = parseTasks(content);

  // Toggle checkbox state for a task
  const toggleTask = (index: number) => {
    const lines = content.split("\n");
    const targetLine = lines[index];
    if (!targetLine) return;

    let updatedLine = targetLine;
    if (targetLine.includes("[ ]")) {
      updatedLine = targetLine.replace("[ ]", "[x]");
    } else if (targetLine.includes("[x]")) {
      updatedLine = targetLine.replace("[x]", "[ ]");
    } else if (targetLine.includes("[X]")) {
      updatedLine = targetLine.replace("[X]", "[ ]");
    }

    lines[index] = updatedLine;
    saveContent(lines.join("\n"));
  };

  // Add new task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTaskLine = `- [ ] ${trimmed}`;
    const newContent = content ? `${content.trimEnd()}\n${newTaskLine}` : newTaskLine;
    saveContent(newContent);
    setNewTaskText("");
  };

  // Delete single task/line
  const deleteTask = (index: number) => {
    const lines = content.split("\n");
    lines.splice(index, 1);
    saveContent(lines.join("\n"));
  };

  // Clear completed tasks
  const clearCompleted = () => {
    const lines = content.split("\n");
    const remaining = lines.filter((l) => !l.match(/^\s*[-*]\s*\[[xX]\]/));
    saveContent(remaining.join("\n"));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="fixed top-0 bottom-0 left-0 z-50 w-96 max-w-[90vw] bg-bg-surface border-r border-border-brand shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-brand bg-bg-app/40 select-none">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-accent-brand" />
            <h2 className="font-bold text-text-primary text-base">
              {t("scratchpad.title", "Scratchpad & Notes")}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <button
              onClick={() => setIsRawMode(!isRawMode)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer"
              title={isRawMode ? t("scratchpad.interactiveView", "Switch to Task View") : t("scratchpad.rawView", "Switch to Raw Markdown")}
            >
              {isRawMode ? <ListChecks className="h-4.5 w-4.5 text-accent-brand" /> : <Edit3 className="h-4.5 w-4.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-text-secondary py-8 text-sm">
              {t("common.loading", "Loading...")}
            </div>
          ) : isRawMode ? (
            /* Raw Markdown Editor */
            <div className="h-full flex flex-col">
              <textarea
                value={content}
                onChange={(e) => saveContent(e.target.value)}
                placeholder={t("scratchpad.rawPlaceholder", "Type anything here... Standard Markdown supported.")}
                className="w-full h-full min-h-[300px] resize-none bg-bg-app border border-border-brand rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
              />
            </div>
          ) : (
            /* Interactive Task List View */
            <div className="space-y-2">
              {/* Quick Add Form */}
              <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={t("scratchpad.addPlaceholder", "Quick scratch idea or todo...")}
                  className="flex-1 bg-bg-app border border-border-brand rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
                />
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  className="px-3 py-2 rounded-xl bg-accent-brand text-bg-surface font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {/* Items List */}
              {parsedItems.length === 0 || (parsedItems.length === 1 && !parsedItems[0].text) ? (
                <div className="text-center text-text-secondary py-12 text-sm">
                  <p>{t("scratchpad.empty", "No scratch ideas or tasks yet.")}</p>
                  <p className="text-xs text-text-secondary/70 mt-1">
                    {t("scratchpad.emptyHint", "Add a quick thought above before you forget!")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {parsedItems.map((item, idx) => {
                    if (!item.rawLine.trim()) return null;

                    if (item.isTask) {
                      return (
                        <div
                          key={item.id}
                          style={{ paddingLeft: `${item.indent * 16}px` }}
                          className="group flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-bg-app/60 transition-colors"
                        >
                          <div
                            onClick={() => toggleTask(idx)}
                            className="flex items-start gap-2.5 flex-1 cursor-pointer select-none"
                          >
                            <button
                              type="button"
                              className="mt-0.5 text-accent-brand focus:outline-none"
                            >
                              {item.isChecked ? (
                                <CheckSquare className="h-4.5 w-4.5 opacity-80" />
                              ) : (
                                <Square className="h-4.5 w-4.5 text-text-secondary" />
                              )}
                            </button>
                            <span
                              className={`text-sm break-words leading-relaxed ${
                                item.isChecked
                                  ? "line-through text-text-secondary/60"
                                  : "text-text-primary"
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteTask(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-400 transition-all cursor-pointer"
                            title={t("common.delete", "Delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // Non-task text line
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-2 text-sm text-text-secondary break-words"
                      >
                        <span>{item.text}</span>
                        <button
                          onClick={() => deleteTask(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isRawMode && parsedItems.some((i) => i.isChecked) && (
          <div className="p-3 border-t border-border-brand bg-bg-app/40 flex justify-end">
            <button
              onClick={clearCompleted}
              className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("scratchpad.clearCompleted", "Clear completed tasks")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
