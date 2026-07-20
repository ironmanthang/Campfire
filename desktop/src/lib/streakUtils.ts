import { getLocalYYYYMMDD } from "./dateUtils";

/**
 * Calculates the current consecutive writing streak in days.
 * A streak is maintained if the user writes an entry either today or yesterday,
 * and increments for each consecutive previous day that has a written entry.
 * 
 * @param dates Array of date strings in YYYY-MM-DD format
 * @returns Number of consecutive days in the streak
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Filter out any invalid formats and keep unique dates, sorted descending (most recent first)
  const uniqueDates = Array.from(new Set(dates))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();

  if (uniqueDates.length === 0) return 0;

  const todayStr = getLocalYYYYMMDD();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalYYYYMMDD(yesterday);

  const mostRecent = uniqueDates[0];

  // If the most recent entry is neither today nor yesterday, the streak is broken (0)
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i] + "T12:00:00");
    const next = new Date(uniqueDates[i + 1] + "T12:00:00");
    
    const diffTime = current.getTime() - next.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      // Streak broken
      break;
    }
  }

  return streak;
}
