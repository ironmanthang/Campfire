import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Shield, Cpu, FileText, Heart, ExternalLink } from "lucide-react";
import { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME } from "../lib/constants";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "app" | "me";
}

export function AboutModal({ isOpen, onClose, initialTab = "app" }: AboutModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"app" | "me">("app");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isQrExpanded) {
          setIsQrExpanded(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isQrExpanded]);

  if (!isOpen) return null;

  // Helper to remove accents and special characters for banking text
  const getCleanTransferMessage = (msg: string) => {
    return msg
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .substring(0, 25);
  };

  const cleanMsg = getCleanTransferMessage(customMessage);
  const addInfoText = cleanMsg ? `Donate Campfire ${cleanMsg}` : "Donate Campfire";

  // Build dynamic URL for VietQR API
  const encodedAccountName = encodeURIComponent(ACCOUNT_NAME);
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?addInfo=${encodeURIComponent(addInfoText)}&accountName=${encodedAccountName}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-brand rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Tab Buttons & Close button */}
        <div className="flex border-b border-border-brand/30 bg-bg-app/10 items-center justify-between relative pr-12">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab("app")}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "app"
                  ? "border-accent-brand text-accent-brand bg-bg-surface/20"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-app/20"
              }`}
            >
              {t("aboutModal.tabAboutApp")}
            </button>
            <button
              onClick={() => setActiveTab("me")}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "me"
                  ? "border-accent-brand text-accent-brand bg-bg-surface/20"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-app/20"
              }`}
            >
              {t("aboutModal.tabAboutMe")}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute right-3.5 p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {activeTab === "app" ? (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-accent-brand flex items-center justify-center gap-2">
                  {t("aboutModal.appTitle")}
                  <span className="text-xs font-mono text-text-secondary bg-bg-app/50 border border-border-brand/40 px-2 py-0.5 rounded-full font-normal select-text">
                    {t("sidebar.version")}
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
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      {t("aboutModal.featureLocalTitle")}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {t("aboutModal.featureLocalDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      {t("aboutModal.featureAiTitle")}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {t("aboutModal.featureAiDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      {t("aboutModal.featureMarkdownTitle")}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {t("aboutModal.featureMarkdownDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-text-primary">
                  {t("aboutModal.meTitle")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("aboutModal.meStory1")}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("aboutModal.meStory2")}
                </p>
              </div>

              {/* Donation Section */}
              <div className="border border-border-brand/40 bg-bg-app/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500/20 shrink-0" />
                  <h4 className="text-sm font-bold text-text-primary">
                    {t("aboutModal.supportTitle")}
                  </h4>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("aboutModal.supportDesc")}
                </p>

                {/* Custom Support Message */}
                <div className="space-y-2 border-t border-border-brand/20 pt-4">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {t("aboutModal.supportMessageLabel")}
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t("aboutModal.supportMessagePlaceholder")}
                    className="w-full px-3 py-2 rounded-xl border border-border-brand/40 bg-bg-input text-text-primary text-xs font-semibold placeholder:text-text-secondary/40 focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/35 outline-none transition-colors"
                  />
                  <div className="flex justify-between items-start text-[10px] text-text-secondary/60 leading-normal gap-4">
                    <span>
                      {t("aboutModal.supportNotifyTip")}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] bg-bg-app/30 border border-border-brand/20 px-1.5 py-0.5 rounded">
                      {customMessage.length}/25
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsQrExpanded(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>{t("aboutModal.donateButton")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox QR Code Expand Modal */}
      {isQrExpanded && (
        <div
          onClick={(e) => {
            e.stopPropagation(); // Prevent propagation so that the parent AboutModal doesn't close!
            setIsQrExpanded(false);
          }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full animate-scale-in"
          >
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={() => setIsQrExpanded(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="relative p-3 bg-white rounded-2xl border border-gray-100">
              <img
                src={qrCodeUrl}
                alt="VietQR Donation Code Large"
                className="h-[360px] w-[360px] md:h-[400px] md:w-[400px] object-contain rounded-xl select-none"
                draggable={false}
              />
            </div>
            
            <div className="text-center mt-5 mb-2 space-y-2">
              <p className="text-sm font-bold text-gray-800">
                {t("aboutModal.scanToPay")}
              </p>
              <div className="flex flex-col gap-1.5 items-center">
                <p className="text-[11px] font-mono text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full inline-block">
                  {t("aboutModal.bankInfo", { bank: BANK_ID, account: ACCOUNT_NO, owner: ACCOUNT_NAME })}
                </p>
                <p className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-md inline-block max-w-[90%] break-all">
                  {t("aboutModal.transferContentLabel", { content: addInfoText })}
                </p>
              </div>
            </div>
          </div>
          
          <span className="text-white/60 text-xs mt-4 animate-pulse">
            {t("aboutModal.clickToClose")}
          </span>
        </div>
      )}
    </div>
  );
}
