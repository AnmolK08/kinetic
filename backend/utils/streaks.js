import { formatDateIso } from './dates.js';

/**
 * Calculates current streak and longest streak from routine days.
 * A day qualifies if completionPercentage >= 100 (or completedTasks > 0 and completedTasks === totalTasks).
 */
export const calculateStreaks = (routineDays) => {
  if (!routineDays || routineDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  // Sort chronologically ascending
  const sorted = [...routineDays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;
  let totalActiveDays = 0;

  for (const day of sorted) {
    const isCompleted = day.totalTasks > 0 && day.completedTasks >= day.totalTasks;
    if (isCompleted) {
      totalActiveDays++;
      const curDate = new Date(day.date);

      if (prevDate) {
        const diffDays = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      } else {
        runningStreak = 1;
      }

      prevDate = curDate;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // Not complete
      runningStreak = 0;
      prevDate = null;
    }
  }

  // Check if current streak extends to today or yesterday
  if (prevDate) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const diffFromToday = Math.round((today - prevDate) / (1000 * 60 * 60 * 24));
    // If completed today (0) or yesterday (1), streak is alive
    if (diffFromToday <= 1) {
      currentStreak = runningStreak;
    } else {
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalActiveDays,
  };
};
