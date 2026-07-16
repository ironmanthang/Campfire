import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OllamaGuide() {
  const { t } = useTranslation();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="p-4 rounded-lg bg-bg-app border border-border-brand/60 text-xs space-y-2.5 animate-fade-in">
      <p className="text-text-secondary leading-relaxed">
        {t("settingsView.ollamaCliInstructions")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="flex flex-col gap-1.5 p-2.5 rounded-md border border-border-brand/30 bg-bg-input/50">
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
            <span>{t("settingsView.cloudModel")}</span>
            <button
              onClick={() => handleCopy("ollama run glm-5.2:cloud")}
              className="hover:text-accent-brand transition-colors p-0.5 text-text-secondary cursor-pointer"
              title={t("settingsView.copyCommand")}
            >
              {copiedCommand === "ollama run glm-5.2:cloud" ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <code className="font-mono text-[11px] text-accent-brand select-all break-all bg-bg-app/40 p-1.5 rounded border border-border-brand/10">
            ollama run glm-5.2:cloud
          </code>
        </div>

        <div className="flex flex-col gap-1.5 p-2.5 rounded-md border border-border-brand/30 bg-bg-input/50">
          <div className="flex items-center justify-between text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
            <span>{t("settingsView.localModel")}</span>
            <button
              onClick={() => handleCopy("ollama run qwen3.6:27b")}
              className="hover:text-accent-brand transition-colors p-0.5 text-text-secondary cursor-pointer"
              title={t("settingsView.copyCommand")}
            >
              {copiedCommand === "ollama run qwen3.6:27b" ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <code className="font-mono text-[11px] text-accent-brand select-all break-all bg-bg-app/40 p-1.5 rounded border border-border-brand/10">
            ollama run qwen3.6:27b
          </code>
        </div>
      </div>
      <p className="text-text-secondary leading-relaxed">
        {t("settingsView.ollamaWebsite")}
      </p>
      <a
        href="https://ollama.com/search"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-brand text-bg-app rounded-md font-semibold hover:bg-accent-brand-hover transition-colors w-fit text-center"
      >
        {t("settingsView.browseOllamaLibrary")}
      </a>
    </div>
  );
}
