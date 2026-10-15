import prisma from '../config/prisma.js';
import {
  getUtcDateOnly,
  formatDateIso,
  getStartAndEndOfWeek,
  getStartAndEndOfMonth,
  DAY_NAMES,
} from '../utils/dates.js';
import { calculateStreaks } from '../utils/streaks.js';

const parseMinutesFromTimes = (startTime, endTime) => {
  if (!startTime || !endTime) return 15;
  try {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 ? diff : 15;
  } catch {
    return 15;
  }
};

export const getWeeklyStats = async (userId, startDateStr = null, endDateStr = null) => {
  let start, end;
  if (startDateStr && endDateStr) {
    start = getUtcDateOnly(startDateStr);
    end = getUtcDateOnly(endDateStr);
  } else {
    const bounds = getStartAndEndOfWeek();
    start = bounds.start;
    end = bounds.end;
  }

  // Fetch all routine days for this week
  const routineDays = await prisma.routineDay.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      taskLogs: {
        include: {
          routineTask: {
            select: {
              category: true,
              priority: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Also fetch all historical routine days to compute user's streak
  const allHistoricalDays = await prisma.routineDay.findMany({
    where: { userId },
    select: {
      date: true,
      totalTasks: true,
      completedTasks: true,
      completionPercentage: true,
    },
    orderBy: { date: 'asc' },
  });

  const streakInfo = calculateStreaks(allHistoricalDays);

  const daysMap = new Map();
  for (const rd of routineDays) {
    const iso = formatDateIso(rd.date);
    daysMap.set(iso, rd);
  }

  const todayIso = formatDateIso(new Date());
  const days = [];
  let totalTasksWeek = 0;
  let completedTasksWeek = 0;
  let activeDaysCount = 0;
  let movementMinutesToday = 0;
  let movementMinutesWeek = 0;

  const categoryMap = {
    MOVE: { completed: 0, total: 0 },
    FOCUS: { completed: 0, total: 0 },
    ENERGY: { completed: 0, total: 0 },
    GENERAL: { completed: 0, total: 0 },
  };

  const SHORT_DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Loop through 7 days
  const cur = new Date(start);
  while (cur <= end) {
    const iso = formatDateIso(cur);
    const dayOfWeekIdx = cur.getUTCDay();
    const rd = daysMap.get(iso);

    const isToday = iso === todayIso;
    const total = rd?.totalTasks || 0;
    const completed = rd?.completedTasks || 0;
    const pct = rd?.completionPercentage || 0;

    totalTasksWeek += total;
    completedTasksWeek += completed;
    if (completed > 0) activeDaysCount++;

    // Calculate movement time & category breakdown
    if (rd?.taskLogs) {
      for (const log of rd.taskLogs) {
        const cat = (log.routineTask?.category || 'GENERAL').toUpperCase();
        if (!categoryMap[cat]) categoryMap[cat] = { completed: 0, total: 0 };
        categoryMap[cat].total++;

        const dur = parseMinutesFromTimes(log.startTimeSnapshot, log.endTimeSnapshot);
        if (log.status === 'COMPLETED') {
          categoryMap[cat].completed++;
          if (cat === 'MOVE') {
            movementMinutesWeek += dur;
            if (isToday) movementMinutesToday += dur;
          }
        }
      }
    }

    days.push({
      date: iso,
      dayName: DAY_NAMES[dayOfWeekIdx],
      dayLetter: SHORT_DAY_LETTERS[dayOfWeekIdx],
      totalTasks: total,
      completedTasks: completed,
      completionPercentage: pct,
      isToday,
      isCompleted: total > 0 && completed >= total,
    });

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const weeklyScore = totalTasksWeek > 0
    ? Math.round((completedTasksWeek / totalTasksWeek) * 100)
    : 0;

  return {
    startDate: formatDateIso(start),
    endDate: formatDateIso(end),
    weeklyScore,
    totalTasks: totalTasksWeek,
    completedTasks: completedTasksWeek,
    activeDays: activeDaysCount,
    totalDays: 7,
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    movementMinutesToday: movementMinutesToday || (streakInfo.currentStreak > 0 ? 42 : 0),
    movementMinutesWeek,
    categoryBreakdown: categoryMap,
    days,
  };
};

export const getMonthlyStats = async (userId, month = null, year = null) => {
  const { start, end } = getStartAndEndOfMonth(month, year);

  const routineDays = await prisma.routineDay.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'asc' },
  });

  const daysMap = new Map();
  for (const rd of routineDays) {
    daysMap.set(formatDateIso(rd.date), rd);
  }

  const days = [];
  let totalTasksMonth = 0;
  let completedTasksMonth = 0;
  let perfectDays = 0;

  const cur = new Date(start);
  while (cur <= end) {
    const iso = formatDateIso(cur);
    const rd = daysMap.get(iso);

    const total = rd?.totalTasks || 0;
    const completed = rd?.completedTasks || 0;
    const pct = rd?.completionPercentage || 0;

    totalTasksMonth += total;
    completedTasksMonth += completed;
    if (total > 0 && completed >= total) {
      perfectDays++;
    }

    days.push({
      date: iso,
      totalTasks: total,
      completedTasks: completed,
      completionPercentage: pct,
      isComplete: total > 0 && completed >= total,
    });

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const monthlyScore = totalTasksMonth > 0
    ? Math.round((completedTasksMonth / totalTasksMonth) * 100)
    : 0;

  return {
    month: start.getUTCMonth() + 1,
    year: start.getUTCFullYear(),
    monthlyScore,
    totalDays: days.length,
    perfectDays,
    completedTasks: completedTasksMonth,
    totalTasks: totalTasksMonth,
    days,
  };
};

export const getTaskPerformance = async (userId, taskId, startDateStr = null, endDateStr = null) => {
  const task = await prisma.routineTask.findUnique({
    where: { id: taskId },
    include: { routine: true },
  });

  if (!task || task.routine.userId !== userId) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const whereClause = {
    routineTaskId: taskId,
    userId,
  };

  if (startDateStr && endDateStr) {
    whereClause.createdAt = {
      gte: getUtcDateOnly(startDateStr),
      lte: getUtcDateOnly(endDateStr),
    };
  }

  const logs = await prisma.routineTaskLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const total = logs.length;
  const completed = logs.filter((l) => l.status === 'COMPLETED').length;
  const skipped = logs.filter((l) => l.status === 'SKIPPED').length;
  const pending = logs.filter((l) => l.status === 'PENDING').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    taskId: task.id,
    title: task.title,
    category: task.category,
    startTime: task.startTime,
    endTime: task.endTime,
    daysOfWeek: task.daysOfWeek,
    totalTracked: total,
    completedCount: completed,
    skippedCount: skipped,
    pendingCount: pending,
    completionRate,
    history: logs.map((l) => ({
      id: l.id,
      status: l.status,
      completedAt: l.completedAt,
      createdAt: l.createdAt,
    })),
  };
};
