import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME } from "../../../lib/constants";
import { useResizer } from "../../../hooks/useResizer";
import { AboutMeTab } from "../../about/AboutMeTab";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t, i18n } = useTranslation();
  const [donationTab, setDonationTab] = useState<"vietqr" | "kofi">("vietqr");
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const [modalWidth, startResize, resetModalWidth] = useResizer({
    key: "support-modal-width",
    defaultVal: 512,
    mode: "px",
    min: 480,
    max: 1400,
    multiplier: 1,
  });

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDonationTab(i18n.language === "vi" ? "vietqr" : "kofi");
      setIsQrExpanded(false);
      setCustomMessage("");
    }
  }, [isOpen, i18n.language]);

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

  const handleKofiClick = async () => {
    try {
      await openUrl("https://ko-fi.com/thang504");
    } catch (err) {
      console.error("Failed to open Ko-fi link:", err);
    }
  };

  const handleCloseQr = () => {
    setIsQrExpanded(false);
  };

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
      onPointerDown={(e) => {
        const target = e.target as Node;
        pointerStartedInsideRef.current = modalRef.current?.contains(target) ?? false;
        pointerMovedRef.current = false;
        activePointerIdRef.current = e.pointerId;
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        const start = startPosRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) pointerMovedRef.current = true;
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        if (pointerStartedInsideRef.current) {
          pointerStartedInsideRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        activePointerIdRef.current = null;
        startPosRef.current = null;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: modalWidth }}
        className="relative bg-bg-surface border border-border-brand rounded-2xl max-w-[95vw] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex border-b border-border-brand/30 bg-bg-app/10 items-center justify-between relative pr-12">
          <div className="flex flex-1 items-center px-4 py-3">
            <h2 className="text-sm font-semibold text-accent-brand">
              {t("aboutModal.tabAboutMe")}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="absolute right-3.5 p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin select-text">
          <AboutMeTab
            donationTab={donationTab}
            setDonationTab={setDonationTab}
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            onVietQrDonate={() => setIsQrExpanded(true)}
            onKofiDonate={handleKofiClick}
          />
        </div>

        {/* Right-edge resize handle (double-click resets to default) */}
        <div
          onMouseDown={startResize}
          onDoubleClick={resetModalWidth}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
          title="Drag to resize · double-click to reset"
        >
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150" />
        </div>
      </div>

      {/* Lightbox QR Code Expand Modal */}
      {isQrExpanded && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseQr();
          }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full animate-scale-in"
          >
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={handleCloseQr}
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
                <p className="text-[0.6875rem] font-mono text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full inline-block">
                  {t("aboutModal.bankInfo", { bank: BANK_ID, account: ACCOUNT_NO, owner: ACCOUNT_NAME })}
                </p>
                <p className="text-[0.625rem] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-md inline-block max-w-[90%] break-all">
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
