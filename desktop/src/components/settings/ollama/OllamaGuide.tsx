import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";

export function OllamaGuide() {
  const { t } = useTranslation();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="p-4 rounded-lg bg-bg-app border border-border-brand/60 text-xs space-y-4 animate-fade-in">
      {/* 3-step plain-English primer */}
      <ol className="space-y-2.5 text-text-secondary leading-relaxed">
        <li className="flex gap-2.5">
          <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-accent-brand/15 text-accent-brand text-xs font-bold flex items-center justify-center">1</span>
          <div className="space-y-0.5">
            <p className="font-semibold text-text-primary text-sm">
              {t("settingsView.ollamaStep1Title", { defaultValue: "Install Ollama" })}
            </p>
            <p>
              {t("settingsView.ollamaStep1Desc", {
                defaultValue:
                  "Click the Download Ollama button above. Run the installer like any other program. On macOS/Linux it's a single command in Terminal.",
              })}
            </p>
          </div>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-accent-brand/15 text-accent-brand text-xs font-bold flex items-center justify-center">2</span>
          <div className="space-y-0.5">
            <p className="font-semibold text-text-primary text-sm">
              {t("settingsView.ollamaStep2Title", { defaultValue: "Open a Terminal" })}
            </p>
            <p>
              {t("settingsView.ollamaStep2Desc", {
                defaultValue:
                  'On Windows: press the Windows key, type "cmd", press Enter. On macOS: press Cmd+Space, type "Terminal", press Enter.',
              })}
            </p>
          </div>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-accent-brand/15 text-accent-brand text-xs font-bold flex items-center justify-center">3</span>
          <div className="space-y-0.5">
            <p className="font-semibold text-text-primary text-sm">
              {t("settingsView.ollamaStep3Title", { defaultValue: "Paste a command and press Enter" })}
            </p>
            <p>
              {t("settingsView.ollamaStep3Desc", {
                defaultValue:
                  "Pick a model below, click the copy icon, then paste it into the Terminal. The first run will download the model (a few GBs if it's a local model). After that it's instant.",
              })}
            </p>
          </div>
        </li>
      </ol>

      {/* Model cards (with plain-English hints) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="flex flex-col rounded-md border border-border-brand/30 bg-bg-input/50 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5 text-xs text-text-secondary uppercase tracking-wider font-semibold">
            <span>{t("settingsView.cloudModel")}</span>
            <button
              onClick={() => handleCopy("ollama run minimax-m3:cloud")}
              className="hover:text-accent-brand transition-colors p-0.5 text-text-secondary cursor-pointer"
              title={t("settingsView.copyCommand")}
            >
              {copiedCommand === "ollama run minimax-m3:cloud" ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <code className="font-mono text-sm text-accent-brand select-all break-all bg-bg-app/40 px-2.5 py-1.5 border-t border-border-brand/10">
            ollama run minimax-m3:cloud
          </code>
          <p className="px-2.5 py-1.5 text-xs text-text-secondary leading-snug border-t border-border-brand/10">
            {t("settingsView.ollamaCloudHint", {
              defaultValue:
                "Runs on Ollama's servers. Needs internet. No GPU required.",
            })}
          </p>
        </div>

        <div className="flex flex-col rounded-md border border-border-brand/30 bg-bg-input/50 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5 text-xs text-text-secondary uppercase tracking-wider font-semibold">
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
          <code className="font-mono text-sm text-accent-brand select-all break-all bg-bg-app/40 px-2.5 py-1.5 border-t border-border-brand/10">
            ollama run qwen3.6:27b
          </code>
          <p className="px-2.5 py-1.5 text-xs text-text-secondary leading-snug border-t border-border-brand/10">
            {t("settingsView.ollamaLocalHint", {
              defaultValue:
                "Runs entirely on your computer. Private, but needs ~16 GB RAM and a decent GPU for speed.",
            })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => openUrl("https://ollama.com/search")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-brand text-bg-app rounded-md font-semibold hover:bg-accent-brand-hover transition-colors w-fit text-center cursor-pointer"
      >
        {t("settingsView.browseOllamaLibrary")}
      </button>
    </div>
  );
}
