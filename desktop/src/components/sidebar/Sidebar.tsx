import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  History,
  Search as SearchIcon,
  Settings as SettingsIcon,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Info,
  Bug,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { SidebarBrandHeader } from "./SidebarBrandHeader";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarProps {
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  onOpenHelp: () => void;
}

export function Sidebar({
  onOpenAbout,
  onOpenFeedback,
  onOpenHelp
}: SidebarProps) {
  const { t } = useTranslation();

  const {
    view,
    navigateToView: setView,
    config,
    toggleTheme,
    sidebarCollapsed: isCollapsed,
  } = useAppStore();

  const { ollamaConnected } = useOllamaStore();

  const [hoverPeekVisible, setHoverPeekVisible] = useState(false);
  const hideTimeoutRef = useRef<any | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Sync state if permanent collapse state changes
  useEffect(() => {
    if (!isCollapsed) {
      setHoverPeekVisible(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
  }, [isCollapsed]);

  const handleMouseEnterTrigger = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoverPeekVisible(true);
  };

  const handleMouseLeaveTrigger = () => {
    if (!hideTimeoutRef.current && hoverPeekVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setHoverPeekVisible(false);
        hideTimeoutRef.current = null;
      }, 300);
    }
  };

  const handleMouseEnterSidebar = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveSidebar = () => {
    if (!hideTimeoutRef.current && hoverPeekVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setHoverPeekVisible(false);
        hideTimeoutRef.current = null;
      }, 300);
    }
  };

  return (
    <>
      {/* Spacer div to reserve space in flex layout when sidebar is permanently expanded */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-0" : "w-64"
        }`}
      />

      <aside
        onMouseEnter={isCollapsed ? handleMouseEnterSidebar : undefined}
        onMouseLeave={isCollapsed ? handleMouseLeaveSidebar : undefined}
        className={`w-64 border-r border-border-brand bg-bg-surface flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed
            ? hoverPeekVisible
              ? "fixed left-0 top-0 bottom-0 z-50 shadow-2xl translate-x-0"
              : "fixed left-0 top-0 bottom-0 z-50 shadow-none -translate-x-full border-r-0"
            : "fixed left-0 top-0 bottom-0 z-30 translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header: Logo, Title, Subtitle, Collapse Toggle */}
          <SidebarBrandHeader
            isCollapsed={isCollapsed}
            onToggle={() => setHoverPeekVisible(false)}
          />

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <SidebarNavItem
              icon={<BookOpen className="h-4.5 w-4.5" />}
              label={t("sidebar.navJournalEditor")}
              onClick={() => { if (config.journal_dir) setView("journal"); }}
              active={view === "journal"}
              disabled={!config.journal_dir}
            />
            <SidebarNavItem
              icon={<History className="h-4.5 w-4.5" />}
              label={t("sidebar.navTimeline")}
              onClick={() => { if (config.journal_dir) setView("timeline"); }}
              active={view === "timeline"}
              disabled={!config.journal_dir}
            />
            <SidebarNavItem
              icon={<SearchIcon className="h-4.5 w-4.5" />}
              label={t("sidebar.navSearch")}
              onClick={() => { if (config.journal_dir) setView("search"); }}
              active={view === "search"}
              disabled={!config.journal_dir}
            />
            <SidebarNavItem
              icon={<MessageSquare className="h-4.5 w-4.5" />}
              label={t("sidebar.navChat")}
              onClick={() => { if (config.journal_dir) setView("chat"); }}
              active={view === "chat"}
              disabled={!config.journal_dir || !ollamaConnected}
              title={!ollamaConnected ? t("sidebar.navChatTooltipDisconnected") : t("sidebar.navChatTooltipConnected")}
            />
            <SidebarNavItem
              icon={<Sparkles className="h-4.5 w-4.5" />}
              label={t("sidebar.navReflection")}
              onClick={() => { if (config.journal_dir) setView("reflection"); }}
              active={view === "reflection"}
              disabled={!config.journal_dir || !ollamaConnected}
              title={!ollamaConnected ? t("sidebar.navReflectionTooltipDisconnected") : t("sidebar.navReflectionTooltipConnected")}
            />
            <SidebarNavItem
              icon={<SettingsIcon className="h-4.5 w-4.5" />}
              label={t("sidebar.navSettings")}
              onClick={() => setView("settings")}
              active={view === "settings"}
            />
          </nav>
        </div>

        {/* Footer info & Theme Toggle */}
        <div className="p-4 border-t border-border-brand bg-bg-app/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Light/Dark Toggle */}
              <button
                onClick={() => toggleTheme()}
                onMouseDown={(e) => e.preventDefault()}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors flex items-center justify-center cursor-pointer"
                title={t("sidebar.toggleThemeTooltip")}
              >
                {config.theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {/* Bug Report */}
              <button
                onClick={onOpenFeedback}
                onMouseDown={(e) => e.preventDefault()}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors flex items-center justify-center cursor-pointer"
                title={t("sidebar.reportBugTooltip")}
              >
                <Bug className="h-4.5 w-4.5" />
              </button>

              {/* Info / About */}
              <button
                onClick={onOpenAbout}
                onMouseDown={(e) => e.preventDefault()}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors flex items-center justify-center cursor-pointer"
                title={t("sidebar.openAboutTooltip")}
              >
                <Info className="h-4.5 w-4.5" />
              </button>

              {/* Feature Guide */}
              <button
                onClick={onOpenHelp}
                onMouseDown={(e) => e.preventDefault()}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors flex items-center justify-center cursor-pointer"
                title="Feature Guide"
              >
                <HelpCircle className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Invisible trigger zone at the very left edge of the screen */}
      {isCollapsed && (
        <div
          onMouseEnter={handleMouseEnterTrigger}
          onMouseLeave={handleMouseLeaveTrigger}
          className="fixed left-0 top-0 bottom-0 w-3 z-40 bg-transparent cursor-default"
        />
      )}
    </>
  );
}
