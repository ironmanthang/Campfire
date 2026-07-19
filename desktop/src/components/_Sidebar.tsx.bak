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
  ChevronLeft,
  Info,
  Bug,
  Heart,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface SidebarProps {
  onOpenAbout: (tab?: "app" | "me") => void;
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
    toggleSidebar,
    updateConfigField
  } = useAppStore();

  const { ollamaConnected } = useOllamaStore();

  const [hoverPeekVisible, setHoverPeekVisible] = useState(false);
  const hideTimeoutRef = useRef<any | null>(null);

  const [localTitle, setLocalTitle] = useState(config.custom_title || t("sidebar.title"));
  const [localSubtitle, setLocalSubtitle] = useState(config.custom_subtitle || t("sidebar.subtitle"));

  // Sync state if config fields change
  useEffect(() => {
    setLocalTitle(config.custom_title || t("sidebar.title"));
  }, [config.custom_title, t]);

  useEffect(() => {
    setLocalSubtitle(config.custom_subtitle || t("sidebar.subtitle"));
  }, [config.custom_subtitle, t]);

  const handleSaveTitle = async () => {
    const trimmed = localTitle.trim();
    if (trimmed !== config.custom_title) {
      await updateConfigField("custom_title", trimmed);
    }
  };

  const handleSaveSubtitle = async () => {
    const trimmed = localSubtitle.trim();
    if (trimmed !== config.custom_subtitle) {
      await updateConfigField("custom_subtitle", trimmed);
    }
  };

  const handleSelectLogo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"]
        }],
        title: t("sidebar.changeLogoTitle") || "Select Logo Image"
      });
      if (selected && typeof selected === "string") {
        const base64 = await invoke<string>("read_image_as_base64", { path: selected });
        await updateConfigField("custom_logo", base64);
      }
    } catch (err) {
      console.error("Failed to select logo:", err);
    }
  };

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
      }, 300); // 300ms grace period before closing
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
      }, 300); // 300ms grace period before closing
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
        {/* App Logo/Title */}
        <div className="py-5 pl-4 pr-3 border-b border-border-brand flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo with Hover Edit Overlay */}
            <div className="relative group cursor-pointer shrink-0" onClick={handleSelectLogo}>
              <img
                src={config.custom_logo || "/logo.png?v=2"}
                alt="Campfire Logo"
                className="h-12 w-16 rounded-lg object-cover border border-border-brand/40 group-hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (sibling) {
                    sibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden h-12 w-16 rounded-lg bg-accent-brand flex items-center justify-center text-bg-app font-bold text-xl">
                {localTitle ? localTitle.charAt(0).toUpperCase() : "C"}
              </div>
              {/* Hover Edit Overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold uppercase tracking-wider select-none">
                Edit
              </div>
            </div>

            {/* Editable Title & Subtitle */}
            <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="font-bold tracking-tight text-md bg-transparent border-0 p-0.5 m-0 focus:outline-none focus:ring-1 focus:ring-accent-brand/40 rounded hover:bg-bg-app/40 w-full cursor-pointer focus:cursor-text text-text-primary truncate"
                title={t("sidebar.editTitleTooltip") || "Click to edit title"}
              />
              <input
                type="text"
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                onBlur={handleSaveSubtitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="text-xs text-text-secondary bg-transparent border-0 p-0.5 m-0 focus:outline-none focus:ring-1 focus:ring-accent-brand/40 rounded hover:bg-bg-app/40 w-full cursor-pointer focus:cursor-text truncate"
                title={t("sidebar.editSubtitleTooltip") || "Click to edit subtitle"}
              />
            </div>
          </div>
          <button
            onClick={() => {
              toggleSidebar();
              if (isCollapsed) {
                setHoverPeekVisible(false);
              }
            }}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          >
            <ChevronLeft className={`h-4.5 w-4.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => {
              if (config.journal_dir) setView("journal");
            }}
            disabled={!config.journal_dir}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "journal"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              } ${!config.journal_dir ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            {t("sidebar.navJournalEditor")}
          </button>

          <button
            onClick={() => {
              if (config.journal_dir) setView("timeline");
            }}
            disabled={!config.journal_dir}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "timeline"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              } ${!config.journal_dir ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <History className="h-4.5 w-4.5" />
            {t("sidebar.navTimeline")}
          </button>

          <button
            onClick={() => {
              if (config.journal_dir) setView("search");
            }}
            disabled={!config.journal_dir}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "search"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              } ${!config.journal_dir ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <SearchIcon className="h-4.5 w-4.5" />
            {t("sidebar.navSearch")}
          </button>

          {/* AI CLI CLONE TABS */}
          <button
            onClick={() => {
              if (config.journal_dir) setView("chat");
            }}
            disabled={!config.journal_dir || !ollamaConnected}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "chat"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              } ${!config.journal_dir || !ollamaConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!ollamaConnected ? t("sidebar.navChatTooltipDisconnected") : t("sidebar.navChatTooltipConnected")}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            {t("sidebar.navChat")}
          </button>

          <button
            onClick={() => {
              if (config.journal_dir) setView("reflection");
            }}
            disabled={!config.journal_dir || !ollamaConnected}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "reflection"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              } ${!config.journal_dir || !ollamaConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!ollamaConnected ? t("sidebar.navReflectionTooltipDisconnected") : t("sidebar.navReflectionTooltipConnected")}
          >
            <Sparkles className="h-4.5 w-4.5" />
            {t("sidebar.navReflection")}
          </button>

          <button
            onClick={() => setView("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "settings"
                ? "bg-accent-brand text-bg-app"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
              }`}
          >
            <SettingsIcon className="h-4.5 w-4.5" />
            {t("sidebar.navSettings")}
          </button>
        </nav>
      </div>

      {/* Footer info & Theme Toggle */}
      <div className="p-4 border-t border-border-brand bg-bg-app/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Light Toggle */}
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
              onClick={() => onOpenAbout("app")}
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

          {/* Donation Heart */}
          <button
            onClick={() => onOpenAbout("me")}
            onMouseDown={(e) => e.preventDefault()}
            className="p-2 rounded-lg hover:bg-red-500/10 flex items-center justify-center cursor-pointer donate-heart-btn"
            title={t("sidebar.donateTooltip") || "Support me :D"}
          >
            <Heart className="h-4.5 w-4.5 donate-heart animate-heartbeat" />
          </button>
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
