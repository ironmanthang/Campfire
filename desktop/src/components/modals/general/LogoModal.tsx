import { X, Upload, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface LogoModalProps {
  onClose: () => void;
}

export function LogoModal({ onClose }: LogoModalProps) {
  const { t } = useTranslation();
  const { config, updateConfigField } = useAppStore();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleSelectLogo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"]
        }],
        title: t("sidebar.changeLogoTitle") || "Select Logo Image"
      });
      if (selected && typeof selected === "string") {
        const base64 = await invoke<string>("read_image_as_base64", { path: selected });
        await updateConfigField("custom_logo", base64);
      }
    } catch (err) {
      console.error("Failed to select logo:", err);
    }
  };

  const handleResetLogo = async () => {
    await updateConfigField("custom_logo", "");
  };

  return (
    <div
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="bg-bg-surface border border-border-brand rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Logo Customization</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative group">
            <img
              src={config.custom_logo || "/logo.png?v=2"}
              alt="Logo Preview"
              className="h-24 w-32 rounded-xl object-cover border border-border-brand/40 shadow-inner animate-pulse-slow"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (sibling) {
                  sibling.style.display = "flex";
                }
              }}
            />
            <div className="hidden h-24 w-32 rounded-xl bg-accent-brand flex items-center justify-center text-bg-app font-bold text-3xl">
              {config.custom_title ? config.custom_title.charAt(0).toUpperCase() : "C"}
            </div>
          </div>
          <p className="text-xs text-text-secondary text-center max-w-[250px]">
            Change the sidebar and in-app logo. Standard formats like PNG, JPG, SVG, and WebP are supported.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={handleSelectLogo}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-accent-brand hover:bg-accent-brand/90 text-bg-app font-semibold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Upload className="h-4 w-4" />
            <span>Upload New Logo</span>
          </button>

          {config.custom_logo && (
            <button
              onClick={handleResetLogo}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border-brand hover:border-red-500 hover:text-red-500 text-text-primary font-semibold text-xs transition-all cursor-pointer bg-bg-app/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Default Logo</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl border border-border-brand hover:bg-bg-app/20 text-text-secondary font-semibold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
