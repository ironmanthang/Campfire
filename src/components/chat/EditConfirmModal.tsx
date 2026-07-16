import { AlertTriangle } from "lucide-react";

interface EditConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function EditConfirmModal({ onCancel, onConfirm }: EditConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-yellow-500">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h3 className="text-lg font-bold text-text-primary">Edit Message</h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          Are you sure you want to edit this message?
          <br /><br />
          This will <strong className="text-red-500">delete this message and all subsequent responses</strong>, copying its text and attachments back into the chat input bar so you can modify and resend them.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-brand hover:border-accent-brand text-xs font-semibold text-text-primary hover:bg-bg-surface/50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-accent-brand hover:bg-accent-brand-hover text-xs font-semibold text-bg-app shadow-sm transition-all cursor-pointer"
          >
            Confirm & Edit
          </button>
        </div>
      </div>
    </div>
  );
}
