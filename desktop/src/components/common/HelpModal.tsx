import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useResizer } from "../../hooks/useResizer";

import {
  X,
  BookOpen,
  History,
  Search,
  MessageSquare,
  Sparkles,
  Settings,
  Copy,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Save,
  Cloud,
  FileText,
  Database,
  AlertTriangle,
  GitMerge,
  FolderSync,
  Clock,
} from "lucide-react";

import {
  JournalHelpTab,
  TimelineHelpTab,
  SearchHelpTab,
  ChatHelpTab,
  ReflectionHelpTab,
  SettingsHelpTab,
  AutoSaveHelpTab,
  AutoSyncHelpTab,
} from "./help";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpModalPersistedState = {
  activeTab: string;
  openCategories: Record<string, boolean>;
};

const HELP_MODAL_STORAGE_KEY = "campfire_help_modal_state";

function getDefaultOpenCategories(): Record<string, boolean> {
  return {
    "auto-save": true,
    "auto-sync": true,
  };
}

function readHelpModalPersistedState(): HelpModalPersistedState {
  if (typeof window === "undefined") {
    return {
      activeTab: "journal",
      openCategories: getDefaultOpenCategories(),
    };
  }

  try {
    const raw = window.localStorage.getItem(HELP_MODAL_STORAGE_KEY);
    if (!raw) {
      return {
        activeTab: "journal",
        openCategories: getDefaultOpenCategories(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<HelpModalPersistedState>;
    return {
      activeTab: typeof parsed.activeTab === "string" ? parsed.activeTab : "journal",
      openCategories: {
        ...getDefaultOpenCategories(),
        ...(parsed.openCategories && typeof parsed.openCategories === "object"
          ? parsed.openCategories
          : {}),
      },
    };
  } catch {
    return {
      activeTab: "journal",
      openCategories: getDefaultOpenCategories(),
    };
  }
}

function writeHelpModalPersistedState(state: HelpModalPersistedState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HELP_MODAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to persist help modal state:", err);
  }
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t } = useTranslation();
  const persistedState = readHelpModalPersistedState();

  const [activeTab, setActiveTab] = useState<string>(persistedState.activeTab);
  const [copied, setCopied] = useState<boolean>(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(persistedState.openCategories);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const [modalWidth] = useResizer({
    key: "help-modal-width",
    defaultVal: 768,
    mode: "px",
    min: 640,
    max: 1400,
    multiplier: 1,
  });

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    writeHelpModalPersistedState({ activeTab, openCategories });
  }, [activeTab, openCategories]);

  if (!isOpen) return null;

  const handleCopyMarkdown = async () => {
    try {
      const markdown = `# Campfire User Guide

Welcome to Campfire. Here is a guide to the hidden tips, shortcuts, and capabilities across all sections of the app:

## 📝 ${t("help.journal.title")}
${t("help.journal.subtitle")}

- **${t("help.journal.startWritingTitle")}**: ${t("help.journal.startWritingDesc")}
- **${t("help.journal.textZoomTitle")}**: ${t("help.journal.textZoomDesc")} ${t("help.journal.zoomIn")}, ${t("help.journal.zoomOut")}, ${t("help.journal.zoomReset")}.
- **${t("help.journal.dateNavTitle")}**: ${t("help.journal.dateNavDesc1")}Shift${t("help.journal.dateNavDesc2")}
- **${t("help.journal.autosaveTitle")}**: ${t("help.journal.autosaveDesc")}

_${t("help.journal.quote")}_

## 📅 ${t("help.timeline.title")}
${t("help.timeline.subtitle")}

- **${t("help.timeline.cardsTitle")}**: ${t("help.timeline.cardsDesc")}
- **${t("help.timeline.tagsTitle")}**: ${t("help.timeline.tagsDesc1")}#gym${t("help.timeline.tagsDesc2")}
- **${t("help.timeline.clickModesTitle")}**: ${t("help.timeline.clickModesDesc")}
  - ${t("help.timeline.clickOpen")}
  - ${t("help.timeline.clickSelect")}
- **${t("help.timeline.datePickerTitle")}**: ${t("help.timeline.datePickerDesc")}
- **${t("help.timeline.paginationTitle")}**: ${t("help.timeline.paginationDesc")}

_${t("help.timeline.quote")}_

## 🔍 ${t("help.search.title")}
${t("help.search.subtitle")}

- **${t("help.search.modesTitle")}**: ${t("help.search.modesDesc")}
  - ${t("help.search.modeKeyword")}
  - ${t("help.search.modeSemantic")}
- **${t("help.search.tagsTitle")}**: ${t("help.search.tagsDesc")}
- **${t("help.search.readingResultsTitle")}**: ${t("help.search.readingResultsDesc")}
- **${t("help.search.editorTransitionTitle")}**: ${t("help.search.editorTransitionDesc")}
- **${t("help.search.timeWindowTitle")}**: ${t("help.search.timeWindowDesc")}
- **${t("help.search.tagCloudTitle")}**: ${t("help.search.tagCloudDesc")}

_${t("help.search.quote")}_

## 💬 ${t("help.chat.title")}
${t("help.chat.subtitle")}

- **${t("help.chat.companionTitle")}**: ${t("help.chat.companionDesc")}
- **${t("help.chat.strengthsTitle")}**: ${t("help.chat.strengthsDesc")}
  - **${t("help.chat.strengthPatternTitle")}** ${t("help.chat.strengthPatternDesc")}
  - **${t("help.chat.strengthMissingTitle")}** ${t("help.chat.strengthMissingDesc")}
  - **${t("help.chat.strengthGapTitle")}** ${t("help.chat.strengthGapDesc")}
- **${t("help.chat.promptsTitle")}**: ${t("help.chat.promptsDesc")}
  - _${t("help.chat.prompt1")}_
  - _${t("help.chat.prompt2")}_
  - _${t("help.chat.prompt3")}_
  - _${t("help.chat.prompt4")}_

  ${t("help.chat.sparkleNote")}
- **${t("help.chat.controlsTitle")}**: ${t("help.chat.controlsDesc")}
- **${t("help.chat.attachmentsTitle")}**: ${t("help.chat.attachmentsDesc")}
- **${t("help.chat.privacyTitle")}**: ${t("help.chat.privacyDesc")}

_${t("help.chat.quote")}_

## ✨ ${t("help.reflection.title")}
${t("help.reflection.subtitle")}

- **${t("help.reflection.structureTitle")}**: ${t("help.reflection.structureDesc")}
  - ${t("help.reflection.themeRecurring")}
  - ${t("help.reflection.themeEmotional")}
  - ${t("help.reflection.themeProgress")}
  - ${t("help.reflection.themeChallenges")}
  - ${t("help.reflection.themeRecommendations")}
- **${t("help.reflection.dateRangeTitle")}**: ${t("help.reflection.dateRangeDesc")}
- **${t("help.reflection.persistenceTitle")}**: ${t("help.reflection.persistenceDesc")}
- **${t("help.reflection.privacyTitle")}**: ${t("help.reflection.privacyDesc")}

_${t("help.reflection.quote")}_

## ⚙️ ${t("help.config.title")}
${t("help.config.subtitle")}

- **${t("help.config.identityTitle")}**: ${t("help.config.identityDesc")}
  - ${t("help.config.identityName")}
  - ${t("help.config.identityFolder")}
  - ${t("help.config.identityAutosave")}
  - ${t("help.config.identityLanguage")}
- **${t("help.config.heartTitle")}**: ${t("help.config.heartDesc")}
- **${t("help.config.ollamaTitle")}**: ${t("help.config.ollamaDesc")}
- **${t("help.config.syncTitle")}**: ${t("help.config.syncDesc")}
- **${t("help.config.mobileTitle")}**: ${t("help.config.mobileDesc")}
- **${t("help.config.exportTitle")}**: ${t("help.config.exportDesc")}

_${t("help.config.quote")}_

## 💾 ${t("help.autoSave.title")} & ${t("help.autoSync.title")}

### ${t("help.autoSave.title")}
- **${t("help.autoSave.desktopIntervalTitle")}**: ${t("help.autoSave.desktopIntervalDesc")}
- **${t("help.autoSave.desktopLocationTitle")}**: ${t("help.autoSave.desktopLocationDesc")}
- **${t("help.autoSave.desktopManualTitle")}**: ${t("help.autoSave.desktopManualDesc")}
- **${t("help.autoSave.mobileFastTitle")}**: ${t("help.autoSave.mobileFastDesc")}
- **${t("help.autoSave.mobileIndexedDbTitle")}**: ${t("help.autoSave.mobileIndexedDbDesc")}
- **${t("help.autoSave.flushProtectionTitle")}**: ${t("help.autoSave.flushProtectionDesc")}

### ${t("help.autoSync.title")}
- **${t("help.autoSync.offByDefaultTitle")}**: ${t("help.autoSync.offByDefaultDesc")}
- **${t("help.autoSync.oneWriterRuleTitle")}**: ${t("help.autoSync.oneWriterRuleDesc")}
- **${t("help.autoSync.desktopTriggersTitle")}**: ${t("help.autoSync.desktopTriggersDesc")}
- **${t("help.autoSync.mobileTriggersTitle")}**: ${t("help.autoSync.mobileTriggersDesc")}
- **${t("help.autoSync.mergeEngineTitle")}**: ${t("help.autoSync.mergeEngineDesc")}
  - ${t("help.autoSync.mergeNothing")}
  - ${t("help.autoSync.mergeLocalOnly")}
  - ${t("help.autoSync.mergeCloudOnly")}
  - ${t("help.autoSync.mergeBoth")}
  - ${t("help.autoSync.mergeTrick")}
- **${t("help.autoSync.conflictBothKeptTitle")}**: ${t("help.autoSync.conflictBothKeptDesc")}
- **${t("help.autoSync.conflictFrozenTitle")}**: ${t("help.autoSync.conflictFrozenDesc")}
- **${t("help.autoSync.conflictResolveTitle")}**: ${t("help.autoSync.conflictResolveDesc")}
- **${t("help.autoSync.desktopBackupsTitle")}**: ${t("help.autoSync.desktopBackupsDesc")}
- **${t("help.autoSync.backupLimitTitle")}**: ${t("help.autoSync.backupLimitDesc")}
- **${t("help.autoSync.backupRollbackTitle")}**: ${t("help.autoSync.backupRollbackDesc")}
- **${t("help.autoSync.backupOnDemandTitle")}**: ${t("help.autoSync.backupOnDemandDesc")}
- ${t("help.autoSync.mobileNoteDesc")}
`;
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy guide text:", err);
    }
  };

  const mainTabs = [
    { id: "journal", label: t("help.navJournal"), icon: BookOpen },
    { id: "timeline", label: t("help.navTimeline"), icon: History },
    { id: "search", label: t("help.navSearch"), icon: Search },
    { id: "chat", label: t("help.navChat"), icon: MessageSquare },
    { id: "reflection", label: t("help.navReflection"), icon: Sparkles },
    { id: "config", label: t("help.navConfig"), icon: Settings },
  ];

  type SubTab = { id: string; label: string; icon: any };
  const expandableSections: Array<{
    id: string;
    label: string;
    icon: any;
    subTabs: SubTab[];
  }> = [
    {
      id: "auto-save",
      label: t("help.catAutoSave"),
      icon: Save,
      subTabs: [
        { id: "save-desktop", label: t("help.subSaveDesktop"), icon: FileText },
        { id: "save-mobile", label: t("help.subSaveMobile"), icon: FileText },
        { id: "save-flush", label: t("help.subSaveFlush"), icon: Clock },
      ],
    },
    {
      id: "auto-sync",
      label: t("help.catAutoSync"),
      icon: Cloud,
      subTabs: [
        { id: "sync-trigger", label: t("help.subSyncTrigger"), icon: FolderSync },
        { id: "sync-merge", label: t("help.subSyncMerge"), icon: GitMerge },
        { id: "sync-conflict", label: t("help.subSyncConflict"), icon: AlertTriangle },
        { id: "sync-backup", label: t("help.subSyncBackup"), icon: Database },
      ],
    },
  ];

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSubTabActive = (subId: string) => activeTab === subId;

  return (
    <div
      onPointerDown={(e) => {
        const target = e.target as Node;
        pointerStartedInsideRef.current = modalRef.current?.contains(target) ?? false;
        pointerMovedRef.current = false;
        activePointerIdRef.current = e.pointerId;
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        const start = startPosRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) pointerMovedRef.current = true;
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        if (pointerStartedInsideRef.current) {
          pointerStartedInsideRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        activePointerIdRef.current = null;
        startPosRef.current = null;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        style={{ width: modalWidth }}
        className="relative w-full max-w-[95vw] bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-brand/40 bg-bg-app/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent-brand" />
            <h2 className="text-lg font-bold tracking-tight text-text-primary">
              {t("help.headerTitle")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg border border-border-brand/60 bg-bg-surface hover:bg-bg-app text-text-secondary hover:text-text-primary text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent-brand" />
                  <span className="text-accent-brand">{t("help.copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t("help.copyMarkdown")}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-56 border-r border-border-brand/30 bg-bg-app/5 p-3 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-accent-brand text-bg-app"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Divider between Feature Guide and System/Knowledge sections */}
            <div className="my-2 border-t border-border-brand/40" />

            {/* Expandable sections (Auto Save, Auto Sync, etc.) */}
            {expandableSections.map((section) => {
              const SectionIcon = section.icon;
              const isOpen = openCategories[section.id];
              const hasActiveSub = section.subTabs.some((s) => isSubTabActive(s.id));
              return (
                <div key={section.id} className="flex flex-col">
                  <button
                    onClick={() => toggleCategory(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      hasActiveSub
                        ? "text-accent-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <SectionIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{section.label}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-3 pl-2 border-l border-border-brand/30 flex flex-col gap-0.5 mt-0.5 mb-1 animate-fade-in">
                      {section.subTabs.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = isSubTabActive(sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setActiveTab(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                              subActive
                                ? "bg-accent-brand/15 text-accent-brand"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Guide Details View */}
          <div className="flex-1 overflow-y-auto p-6 text-sm text-text-primary">
            {activeTab === "journal" && <JournalHelpTab />}
            {activeTab === "timeline" && <TimelineHelpTab />}
            {activeTab === "search" && <SearchHelpTab />}
            {activeTab === "chat" && <ChatHelpTab />}
            {activeTab === "reflection" && <ReflectionHelpTab />}
            {activeTab === "config" && <SettingsHelpTab />}
            {(activeTab === "auto-save" || activeTab.startsWith("save-")) && (
              <AutoSaveHelpTab subTab={activeTab} />
            )}
            {(activeTab === "auto-sync" || activeTab.startsWith("sync-")) && (
              <AutoSyncHelpTab subTab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
