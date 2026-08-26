import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, HardDrive, Cloud, Layers } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface ScratchpadConflictModalProps {
  onResolve: (choice: 'local' | 'remote' | 'both') => void;
}

export const ScratchpadConflictModal: React.FC<ScratchpadConflictModalProps> = ({
  onResolve,
}) => {
  const { t } = useTranslation();
  const { handleManualClose } = useModalBackHandler(true, () => onResolve('both'));

  return (
    <div
      onClick={handleManualClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 cursor-default"
      >
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h3 className="text-lg font-bold text-text-primary">
            {t('scratchpadConflict.title', 'Scratchpad Sync Conflict')}
          </h3>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          {t(
            'scratchpadConflict.description',
            'Your scratchpad was modified on both this device and Google Drive at the exact same time. Choose which version you want to keep:'
          )}
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onResolve('local')}
            className="w-full flex items-center justify-between p-3 bg-bg-app hover:bg-bg-surface border border-border-brand/60 hover:border-accent-brand rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <HardDrive size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t('scratchpadConflict.keepLocal', 'Keep Local Version')}
                </div>
                <div className="text-xs text-text-secondary">
                  {t('scratchpadConflict.keepLocalDesc', 'Overwrite cloud with this device')}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('remote')}
            className="w-full flex items-center justify-between p-3 bg-bg-app hover:bg-bg-surface border border-border-brand/60 hover:border-accent-brand rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Cloud size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t('scratchpadConflict.keepRemote', 'Keep Cloud Version')}
                </div>
                <div className="text-xs text-text-secondary">
                  {t('scratchpadConflict.keepRemoteDesc', 'Overwrite this device with cloud')}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('both')}
            className="w-full flex items-center justify-between p-3 bg-accent-brand/10 hover:bg-accent-brand/20 border border-accent-brand/40 rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Layers size={18} className="text-accent-brand shrink-0" />
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {t('scratchpadConflict.keepBoth', 'Keep Both (Recommended)')}
                </div>
                <div className="text-xs text-text-secondary">
                  {t('scratchpadConflict.keepBothDesc', 'Combine notes from both versions')}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
