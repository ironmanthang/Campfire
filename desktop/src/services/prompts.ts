import { formatToDDMMYY, getLocalYYYYMMDD } from "../lib/dateUtils";
import i18n from "../i18n";
import { AppConfig } from "../types";

export const getSystemInstruction = (
  userName: string,
  startDate: string,
  endDate: string,
  chatContextText: string,
  config?: AppConfig
): string => {
  const today = new Date();
  const currentDateStr = getLocalYYYYMMDD(today);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const dayOfWeek = today.toLocaleDateString(locale, { weekday: "long" });

  let rawInstruction = "";
  const mode = config?.system_instruction_mode || "default";

  if (mode === "override") {
    rawInstruction = config?.custom_system_instruction || "";
  } else {
    const defaultRaw = i18n.t("chatView.systemInstruction", { returnObjects: true });
    const defaultStr = Array.isArray(defaultRaw)
      ? defaultRaw.join("\n")
      : (defaultRaw as string);

    if (mode === "append" && config?.custom_system_instruction) {
      rawInstruction = defaultStr + "\n\n### ADDITIONAL USER DIRECTIVES:\n" + config.custom_system_instruction;
    } else {
      rawInstruction = defaultStr;
    }
  }

  return rawInstruction
    .replace(/\{userName\}/g, userName || i18n.t("settingsView.unknown"))
    .replace(/\{startDate\}/g, formatToDDMMYY(startDate))
    .replace(/\{endDate\}/g, formatToDDMMYY(endDate))
    .replace(/\{currentDate\}/g, formatToDDMMYY(currentDateStr))
    .replace(/\{dayOfWeek\}/g, dayOfWeek)
    .replace(/\{context\}/g, chatContextText);
};

