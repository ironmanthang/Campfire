import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Heart, ExternalLink, Download } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [donationTab, setDonationTab] = useState<'vietqr' | 'kofi'>('kofi');
  const [customMessage, setCustomMessage] = useState('');
  const { handleManualClose } = useModalBackHandler(isOpen, onClose);

  const openTimeRef = React.useRef<number>(performance.now());

  React.useEffect(() => {
    if (isOpen) {
      openTimeRef.current = performance.now();
    }
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (performance.now() - openTimeRef.current < 350) {
      return;
    }
    handleManualClose();
  };

  if (!isOpen) return null;

  // Clean Vietnamese accents & special characters for bank transfer content
  const getCleanTransferMessage = (msg: string) => {
    return msg
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .substring(0, 25);
  };

  const cleanMsg = getCleanTransferMessage(customMessage);
  const addInfoText = cleanMsg ? `Donate Campfire ${cleanMsg}` : 'Donate Campfire';
  const vietQrUrl = `https://img.vietqr.io/image/vietcombank-9949420500-compact.png?addInfo=${encodeURIComponent(addInfoText)}&accountName=NGUYEN%20NHU%20THANG`;

  const handleKofiClick = () => {
    window.open('https://ko-fi.com/thang504', '_blank');
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(vietQrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-Campfire-${addInfoText.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download QR:', e);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-brand bg-bg-app/10">
          <h2 className="text-lg font-bold tracking-tight text-text-primary m-0 flex items-center gap-2">
            <Heart size={18} className="text-red-500 fill-red-500/20" />
            <span>{t("donate.modalTitle")}</span>
          </h2>
          <button onClick={handleManualClose} className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          <p className="text-xs text-text-secondary leading-relaxed">
            {t("donate.modalBody")}
          </p>

          {/* Donation Tabs Switcher */}
          <div className="border border-border-brand/40 bg-bg-app/20 rounded-2xl p-4 space-y-4">
            <div className="flex border-b border-border-brand/20 pb-2">
              <button
                onClick={() => setDonationTab('vietqr')}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 ${
                  donationTab === 'vietqr'
                    ? 'border-accent-brand text-accent-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {t("donate.tabVietQr")}
              </button>
              <button
                onClick={() => setDonationTab('kofi')}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 ${
                  donationTab === 'kofi'
                    ? 'border-accent-brand text-accent-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {t("donate.tabKofi")}
              </button>
            </div>

            {donationTab === 'vietqr' ? (
              <div className="space-y-4 text-center">
                <p className="text-xs text-text-secondary text-left leading-relaxed">
                  {t("donate.vietQrBody")}
                </p>

                {/* Custom Support Message Input (VietQR only) */}
                <div className="space-y-1 text-left bg-bg-app/40 border border-border-brand/30 rounded-xl p-3">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {t("donate.supportMessageLabel")}
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t("donate.supportMessagePlaceholder")}
                    className="w-full px-3 py-1.5 rounded-lg border border-border-brand/40 bg-bg-surface text-text-primary text-xs font-medium placeholder:text-text-secondary/40 focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/35 outline-none transition-all"
                  />
                </div>

                <div className="inline-block p-2 bg-white rounded-xl border border-border-brand/20 relative group">
                  <img
                    src={vietQrUrl}
                    alt={t("donate.vietQrImageAlt")}
                    className="w-48 h-48 mx-auto object-contain rounded"
                  />
                </div>
                
                {/* Download QR Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-app border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download QR</span>
                  </button>
                </div>

                <div className="text-[10px] text-left text-text-secondary space-y-1 bg-bg-app/40 p-3 rounded-lg border border-border-brand/10 font-mono">
                  <div><strong>{t("donate.vietQrBank")}:</strong> Vietcombank</div>
                  <div><strong>{t("donate.vietQrAccount")}:</strong> 9949420500</div>
                  <div><strong>{t("donate.vietQrOwner")}:</strong> NGUYEN NHU THANG</div>
                  <div><strong>{t("donate.vietQrContent")}:</strong> {addInfoText}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t("donate.kofiBody")}
                </p>

                <button
                  onClick={handleKofiClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{t("donate.kofiButton")}</span>
                  <ExternalLink size={16} />
                </button>

                {/* Trust Badges */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="text-[9px] text-text-secondary font-semibold uppercase tracking-wider">{t("donate.kofiSupports")}:</span>
                    <span className="text-[9px] text-text-secondary font-medium">{t("donate.kofiSupportsList")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
