import { useState } from "react";
import { Copy, Check, QrCode, Smartphone, Apple, HelpCircle, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";

export function PwaSection() {
  const { t } = useTranslation();
  const { showNotification } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"ios" | "android">("ios");

  // The PWA URL is intentionally read-only and locked to the canonical deployment address.
  const CANONICAL_PWA_URL = "https://app-campfire.pages.dev/";
  const pwaUrl = CANONICAL_PWA_URL;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pwaUrl);
      setCopied(true);
      showNotification(t("settingsView.pwaLinkCopied", { defaultValue: "Link copied to clipboard!" }), "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      showNotification("Failed to copy link", "error");
    }
  };

  // Generate QR Code with matching colors: dark background, brand color for modules
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pwaUrl)}&color=d97706&bgcolor=1a1a1a`;

  return (
    <div className="space-y-6">
      {/* URL Input field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">
          {t("settingsView.pwaUrlLabel", { defaultValue: "Mobile App URL" })}
        </label>
        <div className="flex gap-2.5">
          <input
            type="text"
            readOnly
            value={pwaUrl}
            className="flex-1 px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-secondary text-sm overflow-x-auto select-all cursor-default focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 border border-border-brand bg-bg-surface/30 hover:bg-bg-app rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            title={t("settingsView.pwaCopyLink", { defaultValue: "Copy Link" })}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-accent-brand" />
                <span className="text-xs text-accent-brand font-semibold">
                  {t("settingsView.pwaLinkCopied", { defaultValue: "Copied!" })}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-text-secondary" />
                <span className="text-xs text-text-primary">
                  {t("settingsView.pwaCopyLink", { defaultValue: "Copy Link" })}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: QR Code & Setup instructions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-border-brand/40">
        
        {/* QR Code Column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-bg-surface/30 border border-border-brand/30 rounded-xl space-y-3 text-center min-h-[250px]">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-brand">
            <QrCode className="h-4.5 w-4.5" />
            <span>{t("settingsView.pwaQrCodeLabel", { defaultValue: "Scan to Open" })}</span>
          </div>
          
          <div className="relative w-[180px] h-[180px] bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
            {!qrLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-brand border-t-transparent" />
              </div>
            )}
            <img
              src={qrCodeUrl}
              alt="PWA QR Code"
              onLoad={() => setQrLoaded(true)}
              className={`w-[180px] h-[180px] transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
          
          <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">
            {t("settingsView.pwaQrCodeLabel", { defaultValue: "Scan with your phone" })}
          </p>
        </div>

        {/* Installation Instructions Column */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4.5 w-4.5 text-accent-brand" />
            <h4 className="font-semibold text-sm text-text-primary">
              {t("settingsView.pwaInstallInstructions", { defaultValue: "Installation Guide (Make it Linkless/Standalone)" })}
            </h4>
          </div>

          <div className="p-3 bg-bg-surface/50 border border-border-brand/35 rounded-xl text-xs text-text-secondary leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-accent-brand shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-text-primary block mb-0.5">
                {t("settingsView.pwaLinklessTitle", { defaultValue: "What is 'Linkless' (Standalone) mode?" })}
              </span>
              <p>
                {t("settingsView.pwaLinklessDesc", {
                  defaultValue: "Adding the page to your Home Screen installs it as a Progressive Web App (PWA). It launches in full screen without the browser address bar, navigation buttons, or tabs, behaving exactly like a native app!"
                })}
              </p>
            </div>
          </div>

          {/* iOS / Android tabs matching settings sub-tabs styling */}
          <div className="flex border-b border-border-brand/30">
            <button
              onClick={() => setActiveTab("ios")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ios"
                  ? "border-accent-brand text-accent-brand bg-accent-brand/5"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface/20"
              } rounded-t-lg`}
            >
              <Apple className="h-3.5 w-3.5" />
              iOS (Apple Safari)
            </button>
            <button
              onClick={() => setActiveTab("android")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "android"
                  ? "border-accent-brand text-accent-brand bg-accent-brand/5"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface/20"
              } rounded-t-lg`}
            >
              <Globe className="h-3.5 w-3.5" />
              Android (Google Chrome)
            </button>
          </div>

          {/* OS Tab Content */}
          <div className="pt-2 text-xs space-y-3 leading-relaxed text-text-primary bg-bg-surface/10 p-3 rounded-lg border border-border-brand/20">
            {activeTab === "ios" ? (
              <div className="space-y-2">
                <p className="font-semibold text-text-primary">
                  {t("settingsView.pwaIosInstructionsTitle", { defaultValue: "Instructions for iPhone & iPad:" })}
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-1 text-text-secondary">
                  <li>
                    {t("settingsView.pwaIosStep1", { defaultValue: "Open Safari and navigate to your PWA link (or scan the QR code)." })}
                  </li>
                  <li>
                    {t("settingsView.pwaIosStep2", { defaultValue: "Tap the Share button (the arrow-in-box icon) in the bottom navigation toolbar." })}
                  </li>
                  <li>
                    {t("settingsView.pwaIosStep3", { defaultValue: "Scroll down the sharing sheet and select Add to Home Screen." })}
                  </li>
                  <li>
                    {t("settingsView.pwaIosStep4", { defaultValue: "Tap Add in the top-right corner to confirm." })}
                  </li>
                  <li>
                    {t("settingsView.pwaIosStep5", { defaultValue: "Open the new Campfire icon on your Home Screen. It will load instantly in fullscreen standalone mode without browser bars!" })}
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-text-primary">
                  {t("settingsView.pwaAndroidInstructionsTitle", { defaultValue: "Instructions for Android Devices:" })}
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-1 text-text-secondary">
                  <li>
                    {t("settingsView.pwaAndroidStep1", { defaultValue: "Open Chrome and navigate to your PWA link (or scan the QR code)." })}
                  </li>
                  <li>
                    {t("settingsView.pwaAndroidStep2", { defaultValue: "Tap the Menu button (three vertical dots ⋮) in the top-right corner." })}
                  </li>
                  <li>
                    {t("settingsView.pwaAndroidStep3", { defaultValue: "Select Add to Home screen or Install app." })}
                  </li>
                  <li>
                    {t("settingsView.pwaAndroidStep4", { defaultValue: "Confirm by tapping Add or Install in the system prompt." })}
                  </li>
                  <li>
                    {t("settingsView.pwaAndroidStep5", { defaultValue: "Open Campfire from your Home Screen. It will launch as a standalone, distraction-free app!" })}
                  </li>
                </ol>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
