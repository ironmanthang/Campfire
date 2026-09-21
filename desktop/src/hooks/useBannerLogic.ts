import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { calculateStreak } from "@campfire/core";

export function useBannerLogic(journalDir?: string, journalRefreshKey?: number) {
  const [showDonateBanner, setShowDonateBanner] = useState(false);
  const [bannerReason, setBannerReason] = useState<"count" | "streak" | null>(null);

  const dismissMaybeLater = useCallback(() => {
    sessionStorage.setItem("donate-reminder-maybe-later", "true");
    setShowDonateBanner(false);
  }, []);

  const dismissNeverAsk = useCallback(() => {
    localStorage.setItem("donate-reminder-never-ask", "true");
    setShowDonateBanner(false);
  }, []);

  useEffect(() => {
    if (!journalDir) return;

    const checkStats = async () => {
      const neverAsk = localStorage.getItem("donate-reminder-never-ask") === "true";
      const maybeLater = sessionStorage.getItem("donate-reminder-maybe-later") === "true";
      if (neverAsk || maybeLater) {
        setShowDonateBanner(false);
        return;
      }

      try {
        const list: { date: string }[] = await invoke("list_entries", {
          dirPath: journalDir,
        });
        const count = list.length;
        const dates = list.map((e) => e.date);
        const streak = calculateStreak(dates);

        if (count >= 10 || streak >= 30) {
          setShowDonateBanner(true);
          setBannerReason(count >= 10 ? "count" : "streak");
        } else {
          setShowDonateBanner(false);
        }
      } catch (err) {
        console.error("Failed to check stats for donation banner:", err);
      }
    };

    checkStats();

    window.addEventListener("donate-banner-refresh", checkStats);
    return () => window.removeEventListener("donate-banner-refresh", checkStats);
  }, [journalDir, journalRefreshKey]);

  return {
    showDonateBanner,
    bannerReason,
    dismissMaybeLater,
    dismissNeverAsk,
  };
}
