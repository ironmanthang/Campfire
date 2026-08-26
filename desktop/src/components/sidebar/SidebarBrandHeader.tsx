import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { LogoModal } from "../modals/general/LogoModal";

interface SidebarBrandHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SidebarBrandHeader({ isCollapsed, onToggle }: SidebarBrandHeaderProps) {
  const { t } = useTranslation();
  const { config, updateConfigField, toggleSidebar } = useAppStore();

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const localTitleRef = useRef<HTMLInputElement>(null);
  const localSubtitleRef = useRef<HTMLInputElement>(null);

  // Sync inputs if config changes externally
  useEffect(() => {
    if (localTitleRef.current) {
      localTitleRef.current.value = config.custom_title || t("sidebar.title");
    }
  }, [config.custom_title, t]);

  useEffect(() => {
    if (localSubtitleRef.current) {
      localSubtitleRef.current.value = config.custom_subtitle || t("sidebar.subtitle");
    }
  }, [config.custom_subtitle, t]);

  const handleSaveTitle = async () => {
    const trimmed = localTitleRef.current?.value.trim() ?? "";
    if (trimmed !== config.custom_title) {
      await updateConfigField("custom_title", trimmed);
    }
  };

  const handleSaveSubtitle = async () => {
    const trimmed = localSubtitleRef.current?.value.trim() ?? "";
    if (trimmed !== config.custom_subtitle) {
      await updateConfigField("custom_subtitle", trimmed);
    }
  };

  const localTitle = config.custom_title || t("sidebar.title");
  const localSubtitle = config.custom_subtitle || t("sidebar.subtitle");

  return (
    <div className="py-5 pl-4 pr-3 border-b border-border-brand flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Logo with Hover Edit Overlay */}
        <div className="relative group cursor-pointer shrink-0" onClick={() => setIsLogoModalOpen(true)}>
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
          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase tracking-wider select-none">
            Edit
          </div>
        </div>

        {/* Editable Title & Subtitle */}
        <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              ref={localTitleRef}
              type="text"
              defaultValue={localTitle}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="font-bold tracking-tight text-md bg-transparent border-0 p-0.5 m-0 focus:outline-none focus:ring-1 focus:ring-accent-brand/40 rounded hover:bg-bg-app/40 w-full cursor-pointer focus:cursor-text text-text-primary truncate"
              title={t("sidebar.editTitleTooltip") || "Click to edit title"}
            />
            {import.meta.env.DEV && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-amber-500/25 text-amber-400 border border-amber-500/40 uppercase tracking-widest" title="Development Environment (Isolated AppData)">
                DEV
              </span>
            )}
          </div>
          <input
            ref={localSubtitleRef}
            type="text"
            defaultValue={localSubtitle}
            onBlur={handleSaveSubtitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="text-xs text-text-secondary bg-transparent border-0 p-0.5 m-0 focus:outline-none focus:ring-1 focus:ring-accent-brand/40 rounded hover:bg-bg-app/40 w-full cursor-pointer focus:cursor-text truncate"
            title={t("sidebar.editSubtitleTooltip") || "Click to edit subtitle"}
          />
        </div>
      </div>
      <button
        onClick={() => {
          toggleSidebar();
          if (isCollapsed) onToggle();
        }}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors cursor-pointer shrink-0"
        title={isCollapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
      >
        <ChevronLeft className={`h-4.5 w-4.5 transition-transform duration-150 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {isLogoModalOpen && (
        <LogoModal onClose={() => setIsLogoModalOpen(false)} />
      )}
    </div>
  );
}
