export const getLocalYYYYMMDD = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayYYYYMMDD = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalYYYYMMDD(d);
};

export const isOlderThanYesterday = (dateStr: string): boolean => {
  if (!dateStr || dateStr === 'scratchpad') return false;
  const yesterday = getYesterdayYYYYMMDD();
  return dateStr < yesterday;
};
