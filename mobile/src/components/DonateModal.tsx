import React, { useState } from 'react';
import { X, Heart, ExternalLink } from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const [donationTab, setDonationTab] = useState<'vietqr' | 'kofi'>('kofi');
  const [showHonorPrompt, setShowHonorPrompt] = useState(false);

  if (!isOpen) return null;

  const handleKofiClick = () => {
    window.open('https://ko-fi.com/thang504', '_blank');
    setShowHonorPrompt(true);
  };

  const handleDeclareDonated = () => {
    localStorage.setItem('has_donated', 'true');
    setShowHonorPrompt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-brand bg-bg-app/10">
          <h2 className="text-lg font-bold tracking-tight text-text-primary m-0 flex items-center gap-2">
            <Heart size={18} className="text-red-500 fill-red-500/20" />
            <span>Support Campfire</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-app transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <p className="text-xs text-text-secondary leading-relaxed">
            I plan to keep Campfire completely free, offline, and independent. If the app brings value to your day, please consider supporting development!
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
                VietQR (VND)
              </button>
              <button
                onClick={() => setDonationTab('kofi')}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 ${
                  donationTab === 'kofi'
                    ? 'border-accent-brand text-accent-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Ko-fi (USD)
              </button>
            </div>

            {donationTab === 'vietqr' ? (
              <div className="space-y-4 text-center">
                <p className="text-xs text-text-secondary text-left leading-relaxed">
                  Scan the QR code below using any Vietnamese banking app to support:
                </p>
                <div className="inline-block p-2 bg-white rounded-xl border border-border-brand/20">
                  <img
                    src="https://img.vietqr.io/image/vietcombank-9949420500-compact.png?addInfo=Donate%20Campfire&accountName=NGUYEN%20NHU%20THANG"
                    alt="VietQR Donation Code"
                    className="w-48 h-48 mx-auto object-contain rounded"
                  />
                </div>
                <div className="text-[10px] text-left text-text-secondary space-y-1 bg-bg-app/40 p-3 rounded-lg border border-border-brand/10 font-mono">
                  <div><strong>Bank:</strong> Vietcombank</div>
                  <div><strong>Account:</strong> 9949420500</div>
                  <div><strong>Owner:</strong> NGUYEN NHU THANG</div>
                  <div><strong>Content:</strong> Donate Campfire</div>
                </div>
                <button
                  onClick={() => setShowHonorPrompt(true)}
                  className="w-full py-2.5 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-xs transition-all"
                >
                  I've completed the transfer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  For international supporters. Payments are processed securely via Ko-fi & PayPal, supporting Apple Pay, Google Pay, cards, and PayPal.
                </p>
                <button
                  onClick={handleKofiClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <span>Buy me a Boba on Ko-fi 🧋</span>
                  <ExternalLink size={16} />
                </button>

                {/* Trust Badges */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="text-[9px] text-text-secondary font-semibold uppercase tracking-wider">Supports:</span>
                    <span className="text-[9px] text-text-secondary font-medium">Apple Pay, Google Pay, Visa, Mastercard, PayPal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Honor System Modal */}
      {showHonorPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-brand rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-accent-brand/10 text-accent-brand">
              <Heart className="h-8 w-8 animate-pulse text-red-500 fill-red-500/20" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Thank You!</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              We opened the support link or displayed the transfer details. Did your donation go through?
            </p>
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeclareDonated}
                className="w-full py-2.5 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Yes, I donated! 🎉
              </button>
              <button
                onClick={() => setShowHonorPrompt(false)}
                className="w-full py-2.5 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-text-primary text-xs font-bold transition-all cursor-pointer"
              >
                Not yet / Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
