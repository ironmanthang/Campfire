import i18n from "../i18n";

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

export const getLocalYYYYMMDD = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type DatePreset = { label: string; start: string; end: string };

export const getDatePresets = (): DatePreset[] => {
  const today = getLocalYYYYMMDD();
  const d = (offset: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - offset);
    return getLocalYYYYMMDD(dt);
  };
  const thisYearStart = `${new Date().getFullYear()}-01-01`;
  return [
    { label: "All",     start: "2010-01-01",   end: today },
    { label: "7d",      start: d(7),          end: today },
    { label: "30d",     start: d(30),         end: today },
    { label: "3m",      start: d(90),         end: today },
    { label: "This yr", start: thisYearStart, end: today },
  ];
};

