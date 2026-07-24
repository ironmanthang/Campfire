import { useTranslation } from "react-i18next";
import { APP_VERSION } from "../../lib/appVersion";
import {
  Shield,
  BookOpen,
  Calendar,
  Search as SearchIcon,
  MessageSquare,
  Sparkles,
  Cloud,
  Palette
} from "lucide-react";

type AboutModalKey =
  | "featureLocalTitle" | "featureLocalDesc"
  | "featureJournalTitle" | "featureJournalDesc"
  | "featureTimelineTitle" | "featureTimelineDesc"
  | "featureSearchTitle" | "featureSearchDesc"
  | "featureChatTitle" | "featureChatDesc"
  | "featureReflectionTitle" | "featureReflectionDesc"
  | "featureSyncTitle" | "featureSyncDesc"
  | "featureThemeTitle" | "featureThemeDesc";

type IconKey = "local" | "journal" | "timeline" | "search" | "chat" | "reflection" | "sync" | "theme";

interface Feature {
  iconKey: IconKey;
  titleKey: AboutModalKey;
  descKey: AboutModalKey;
}

const FEATURES: Feature[] = [
  { iconKey: "local", titleKey: "featureLocalTitle", descKey: "featureLocalDesc" },
  { iconKey: "journal", titleKey: "featureJournalTitle", descKey: "featureJournalDesc" },
  { iconKey: "timeline", titleKey: "featureTimelineTitle", descKey: "featureTimelineDesc" },
  { iconKey: "search", titleKey: "featureSearchTitle", descKey: "featureSearchDesc" },
  { iconKey: "chat", titleKey: "featureChatTitle", descKey: "featureChatDesc" },
  { iconKey: "reflection", titleKey: "featureReflectionTitle", descKey: "featureReflectionDesc" },
  { iconKey: "sync", titleKey: "featureSyncTitle", descKey: "featureSyncDesc" },
  { iconKey: "theme", titleKey: "featureThemeTitle", descKey: "featureThemeDesc" },
];

function FeatureIcon({ iconKey }: { iconKey: IconKey }) {
  const className = "h-5 w-5";
  switch (iconKey) {
    case "local": return <Shield className={className} />;
    case "journal": return <BookOpen className={className} />;
    case "timeline": return <Calendar className={className} />;
    case "search": return <SearchIcon className={className} />;
    case "chat": return <MessageSquare className={className} />;
    case "reflection": return <Sparkles className={className} />;
    case "sync": return <Cloud className={className} />;
    case "theme": return <Palette className={className} />;
  }
}

export function AboutAppTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-accent-brand flex items-center justify-center gap-2">
          {t("aboutModal.appTitle")}
          <span className="text-xs font-mono text-text-secondary bg-bg-app/50 border border-border-brand/40 px-2 py-0.5 rounded-full font-normal select-text">
            {t("sidebar.version", { version: APP_VERSION })}
          </span>
        </h3>
        <p className="text-sm font-medium text-text-secondary leading-relaxed px-4">
          {t("aboutModal.appTagline")}
        </p>
      </div>

      <blockquote className="border-l-4 border-accent-brand bg-bg-app/20 p-4 rounded-r-xl text-sm italic text-text-secondary leading-relaxed">
        "{t("aboutModal.appDesc")}"
      </blockquote>

      <div className="space-y-4 pt-2">
        {FEATURES.map((feature) => (
          <div key={feature.iconKey} className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
              <FeatureIcon iconKey={feature.iconKey} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                {t(`aboutModal.${feature.titleKey}` as const)}
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {t(`aboutModal.${feature.descKey}` as const)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
