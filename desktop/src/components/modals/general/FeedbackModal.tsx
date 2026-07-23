import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Send, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t, i18n } = useTranslation();
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && status !== "sending") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, status]);

  // Check rate limit status when modal opens, or reset status when modal closes
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      const lastTimestamp = localStorage.getItem("lastFeedbackTimestamp");
      if (lastTimestamp) {
        const timePassed = Date.now() - Number(lastTimestamp);
        const limit = 2 * 60 * 1000; // 2 minutes rate limit
        if (timePassed < limit) {
          setTimeRemaining(limit - timePassed);
        } else {
          setTimeRemaining(0);
        }
      } else {
        setTimeRemaining(0);
      }
    } else {
      setStatus("idle");
    }
  }, [isOpen]);

  // Countdown timer for active rate limit feedback
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.ceil((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  if (!isOpen) return null;

  // Gather system details
  const getDiagnosticsData = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: i18n.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localTime: new Date().toISOString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || timeRemaining > 0) return;

    setStatus("sending");

    const diagnostics = includeDiagnostics ? getDiagnosticsData() : null;

    try {
      const resultStr = await invoke<string>("submit_feedback", {
        description,
        userEmail: email.trim() || "Anonymous",
        appVersion: "v1.0.0",
        systemPlatform: diagnostics?.platform || null,
        userAgent: diagnostics?.userAgent || null,
        screenResolution: diagnostics ? `${diagnostics.screenWidth}x${diagnostics.screenHeight}` : null,
        appLanguage: diagnostics?.language || null,
        timeZone: diagnostics?.timeZone || null,
        submissionTime: diagnostics?.localTime || null,
      });

      const data = JSON.parse(resultStr);

      if (data.success === "true" || data.success === true) {
        setStatus("success");
        setDescription("");
        setEmail("");
        localStorage.setItem("lastFeedbackTimestamp", String(Date.now()));
      } else {
        console.error("FormSubmit response error:", data);
        setStatus("error");
      }
    } catch (err) {
      console.error("FormSubmit connection error:", err);
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status !== "sending") {
      onClose();
    }
  };

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
        handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-brand rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex border-b border-border-brand/30 bg-bg-app/10 items-center justify-between p-4 relative pr-12">
          <h3 className="text-md font-bold text-text-primary flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-brand animate-pulse" />
            {t("feedbackModal.title")}
          </h3>
          <button
            onClick={handleClose}
            disabled={status === "sending"}
            className="absolute right-3.5 p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-scale-in">
              <CheckCircle className="h-14 w-14 text-emerald-500" />
              <h4 className="text-md font-bold text-text-primary">
                {t("feedbackModal.successMessage")}
              </h4>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="p-3.5 rounded-xl bg-red-950/10 border border-red-500/20 text-xs text-red-200 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p>{t("feedbackModal.errorMessage")}</p>
                </div>
              )}

              {timeRemaining > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>{t("feedbackModal.rateLimitMessage", { time: formatTimeRemaining(timeRemaining) })}</p>
                </div>
              )}

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">
                  {t("feedbackModal.descLabel")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("feedbackModal.descPlaceholder")}
                  disabled={status === "sending" || timeRemaining > 0}
                  className="w-full h-32 bg-bg-app/40 border border-border-brand/40 focus:border-accent-brand focus:outline-none rounded-xl p-3 text-sm text-text-primary placeholder:text-text-secondary/60 resize-none transition-colors disabled:opacity-50"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">
                  {t("feedbackModal.emailLabel")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("feedbackModal.emailPlaceholder")}
                  disabled={status === "sending" || timeRemaining > 0}
                  className="w-full bg-bg-app/40 border border-border-brand/40 focus:border-accent-brand focus:outline-none rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Diagnostics Checkbox */}
              <label className="flex items-start gap-3 p-3 bg-bg-app/20 border border-border-brand/10 rounded-xl cursor-pointer hover:bg-bg-app/30 transition-colors">
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  disabled={status === "sending" || timeRemaining > 0}
                  className="mt-0.5 rounded border-border-brand bg-bg-app text-accent-brand focus:ring-accent-brand"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-text-primary block leading-none">
                    {t("feedbackModal.includeDiagnostics")}
                  </span>
                  <span className="text-xs text-text-secondary leading-normal flex items-center gap-1">
                    <FileText className="h-3 w-3 shrink-0" />
                    {t("feedbackModal.diagnosticsHelp")}
                  </span>
                </div>
              </label>

              {/* Real form submit helper fields to bypass FormSubmit features if needed */}
              <input type="hidden" name="_subject" value="Campfire Feedback/Bug Report" />
              <input type="hidden" name="_captcha" value="false" />
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-brand/40 bg-bg-app/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={status === "sending"}
            className="px-5 py-2 rounded-xl bg-bg-surface border border-border-brand hover:border-accent-brand text-xs font-bold text-text-primary transition-all cursor-pointer disabled:opacity-50"
          >
            {t("feedbackModal.close")}
          </button>

          {status !== "success" && (
            <button
              onClick={handleSubmit}
              disabled={status === "sending" || timeRemaining > 0 || !description.trim()}
              className="px-5 py-2 rounded-xl bg-accent-brand hover:bg-accent-brand/90 disabled:bg-accent-brand/50 text-bg-app font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-app border-t-transparent" />
                  <span>{t("feedbackModal.sending")}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{t("feedbackModal.sendButton")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
