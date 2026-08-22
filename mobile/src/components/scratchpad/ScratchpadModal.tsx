import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useScratchpad } from '../../hooks/useScratchpad';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { handleManualClose } = useModalBackHandler(isOpen, onClose);
  const [newTaskText, setNewTaskText] = useState<string>('');
  
  const {
    items,
    loading,
    toggleItem,
    addItem,
    removeItem,
    clearCompleted,
  } = useScratchpad(isOpen);

  const openTimeRef = useRef<number>(performance.now());

  useEffect(() => {
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

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setNewTaskText('');
  };

  const hasCompleted = items.some(
    (i) => i.isChecked || (i.children && i.children.some((c) => c.isChecked))
  );

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[85vh] h-[600px] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-brand bg-bg-app/40 select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-brand/10 text-accent-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-6 6z" />
                <path d="M15 15v6l6-6h-6z" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="13" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-base leading-tight">
                {t('scratchpad.title', 'Scratchpad & Notes')}
              </h2>
              <p className="text-xs text-text-secondary">
                {t('scratchpad.subtitle', 'Quick persistent task list')}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="text-center text-text-secondary py-8 text-sm">
              {t('common.loading', 'Loading...')}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quick Add Form */}
              <form onSubmit={handleAddTask} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={t('scratchpad.addPlaceholder', 'Quick scratch idea or todo...')}
                  className="flex-1 bg-bg-app border border-border-brand rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-brand"
                />
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-accent-brand text-bg-surface font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={18} />
                </button>
              </form>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center text-text-secondary py-12 text-sm">
                  <p>{t('scratchpad.empty', 'No scratch ideas or tasks yet.')}</p>
                  <p className="text-xs text-text-secondary/70 mt-1">
                    {t('scratchpad.emptyHint', 'Add a quick thought above before you forget!')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => (
                    <React.Fragment key={item.id}>
                      <div className="group flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-bg-app/60 transition-colors">
                        <div
                          onClick={() => toggleItem(item.id)}
                          className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                        >
                          <button type="button" className="mt-0.5 text-accent-brand focus:outline-none">
                            {item.isChecked ? (
                              <CheckSquare size={18} className="opacity-80" />
                            ) : (
                              <Square size={18} className="text-text-secondary" />
                            )}
                          </button>
                          <span
                            className={`text-sm break-words leading-relaxed ${
                              item.isChecked
                                ? 'line-through text-text-secondary/60'
                                : 'text-text-primary'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-text-secondary hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.children?.map((child) => (
                        <div
                          key={child.id}
                          style={{ paddingLeft: '16px' }}
                          className="group flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-bg-app/60 transition-colors"
                        >
                          <div
                            onClick={() => toggleItem(child.id)}
                            className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                          >
                            <button type="button" className="mt-0.5 text-accent-brand focus:outline-none">
                              {child.isChecked ? (
                                <CheckSquare size={18} className="opacity-80" />
                              ) : (
                                <Square size={18} className="text-text-secondary" />
                              )}
                            </button>
                            <span
                              className={`text-sm break-words leading-relaxed ${
                                child.isChecked
                                  ? 'line-through text-text-secondary/60'
                                  : 'text-text-primary'
                              }`}
                            >
                              {child.text}
                            </span>
                          </div>

                          <button
                            onClick={() => removeItem(child.id)}
                            className="p-1 text-text-secondary hover:text-red-400 transition-colors cursor-pointer shrink-0"
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasCompleted && (
          <div className="p-3 px-5 border-t border-border-brand bg-bg-app/40 flex justify-end shrink-0">
            <button
              onClick={clearCompleted}
              className="text-xs font-medium text-text-secondary hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              {t('scratchpad.clearCompleted', 'Clear completed tasks')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
