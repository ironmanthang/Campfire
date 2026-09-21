import {
  getLocalYYYYMMDD,
  getYesterdayYYYYMMDD,
  isOlderThanYesterday,
} from "@campfire/core";
import i18n from "../i18n";

export { getLocalYYYYMMDD, getYesterdayYYYYMMDD, isOlderThanYesterday };

export const formatToDDMMYY = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
};

export type DatePreset = { label: string; start: string; end: string };

export const getDatePresets = (earliestDate?: string): DatePreset[] => {
  const today = getLocalYYYYMMDD();
  const d = (offset: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - offset);
    return getLocalYYYYMMDD(dt);
  };
  const thisYearStart = `${new Date().getFullYear()}-01-01`;
  const allStart = earliestDate || today;
  return [
    { label: "All",     start: allStart,      end: today },
    { label: "7d",      start: d(7),          end: today },
    { label: "30d",     start: d(30),         end: today },
    { label: "3m",      start: d(90),         end: today },
    { label: "This yr", start: thisYearStart, end: today },
  ];
};
