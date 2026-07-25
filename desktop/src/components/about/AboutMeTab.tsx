import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { VietQrPanel } from "./VietQrPanel";
import { KofiPanel } from "./KofiPanel";

interface AboutMeTabProps {
  donationTab: "vietqr" | "kofi";
  setDonationTab: (tab: "vietqr" | "kofi") => void;
  customMessage: string;
  setCustomMessage: (val: string) => void;
  onVietQrDonate: () => void;
  onKofiDonate: () => void;
}

export function AboutMeTab({
  donationTab,
  setDonationTab,
  customMessage,
  setCustomMessage,
  onVietQrDonate,
  onKofiDonate,
}: AboutMeTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-text-primary">
          {t("aboutModal.meTitle")}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t("aboutModal.meStory")}
        </p>
      </div>

      {/* Bridge: from personal story → donation CTA. Softens the pivot,
          reassures that feedback is always free, and signals the *value*
          of donating (priority notification). */}
      <div className="flex items-start gap-2.5 pl-3 border-l-2 border-accent-brand/40 -mt-1">
        <Mail className="h-3.5 w-3.5 text-accent-brand/80 mt-0.5 shrink-0" />
        <p className="text-xs italic text-text-secondary/90 leading-relaxed">
          {t("aboutModal.feedbackBridge")}
        </p>
      </div>

      {/* Donation Tabs Switcher */}
      <div className="border border-border-brand/40 bg-bg-app/20 rounded-2xl p-5 space-y-4">
        <div className="flex border-b border-border-brand/20 pb-2">
          <button
            onClick={() => setDonationTab("vietqr")}
            className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 ${
              donationTab === "vietqr"
                ? "border-accent-brand text-accent-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("aboutModal.donateTabVietQR")}
          </button>
          <button
            onClick={() => setDonationTab("kofi")}
            className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 ${
              donationTab === "kofi"
                ? "border-accent-brand text-accent-brand"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("aboutModal.donateTabKofi")}
          </button>
        </div>

        {donationTab === "vietqr" ? (
          <VietQrPanel
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            onDonateClick={onVietQrDonate}
            characterLimit={50}
          />
        ) : (
          <KofiPanel
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            onDonateClick={onKofiDonate}
            characterLimit={50}
          />
        )}
      </div>
    </div>
  );
}
