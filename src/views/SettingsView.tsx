import { useState, useEffect } from "react";
import { useResizer } from "../hooks/useResizer";
import { useTranslation } from "react-i18next";
import { SidebarToggleButton } from "../components/SidebarToggleButton";
import { DragHandles } from "../components/common";
import {
  SectionWrapper,
  IdentitySection,
  OllamaSection,
  LegacyExportSection
} from "../components/settings";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";

const AVAILABLE_SECTIONS = ["identity", "ollama", "legacy"];

export function SettingsView() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const {
    config,
    updateConfigField,
    sidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const {
    ollamaConnected
  } = useOllamaStore();

  const [settingsWidth, startDrag] = useResizer({
    key: "settings_width",
    defaultVal: 672,
    mode: "px",
  });

  useEffect(() => {
    let order = config.config_section_order || [];
    order = order.filter(s => AVAILABLE_SECTIONS.includes(s));
    const missing = AVAILABLE_SECTIONS.filter(s => !order.includes(s));
    setSections([...order, ...missing]);
  }, [config.config_section_order]);

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    setSections(newSections);
    updateConfigField("config_section_order", newSections);
  };

  const toggleCollapse = (key: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderSection = (key: string, index: number) => {
    const isCollapsed = !!collapsedSections[key];
    const isFirst = index === 0;
    const isLast = index === sections.length - 1;

    let title = "";
    let badge = "";
    let content: React.ReactNode = null;

    switch (key) {
      case "identity":
        title = t("settingsView.identityTitle");
        badge = t("settingsView.identityBadge");
        content = <IdentitySection />;
        break;

      case "ollama":
        title = t("settingsView.ollamaLink");
        badge = ollamaConnected 
          ? t("settingsView.ollamaStatusConnected") 
          : t("settingsView.ollamaStatusDisconnected");
        content = <OllamaSection />;
        break;



      case "legacy":
        if (!config.journal_dir) return null;
        title = t("settingsView.legacyManagement");
        badge = t("settingsView.exportBadge");
        content = <LegacyExportSection />;
        break;

      default:
        return null;
    }

    return (
      <SectionWrapper
        key={key}
        sectionKey={key}
        index={index}
        isCollapsed={isCollapsed}
        onToggle={() => toggleCollapse(key)}
        title={title}
        badge={badge}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={() => moveSection(index, "up")}
        onMoveDown={() => moveSection(index, "down")}
      >
        {content}
      </SectionWrapper>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="relative mx-auto w-full px-8 py-8 min-h-full flex flex-col space-y-6"
        style={{ maxWidth: `${settingsWidth}px` }}
      >
        <DragHandles startDrag={startDrag} />

        {/* Title */}
        <div className="flex items-start gap-4">
          <SidebarToggleButton
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            className="mt-1"
          />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("settingsView.title")}</h2>
            <p className="text-sm text-text-secondary mt-1">
              {t("settingsView.subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in">
          {sections.map((sectionKey, index) => renderSection(sectionKey, index))}
        </div>
      </div>
    </div>
  );
}
