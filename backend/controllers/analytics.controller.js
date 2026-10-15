import * as analyticsService from '../services/routine-analytics.service.js';

export const getOverview = async (req, res, next) => {
  try {
    const weeklyStats = await analyticsService.getWeeklyStats(req.user.id);
    res.json({
      success: true,
      data: {
        score: weeklyStats.weeklyScore,
        currentStreak: weeklyStats.currentStreak,
        longestStreak: weeklyStats.longestStreak,
        movementMinutesToday: weeklyStats.movementMinutesToday,
        activeDays: weeklyStats.activeDays,
        totalTasks: weeklyStats.totalTasks,
        completedTasks: weeklyStats.completedTasks,
        days: weeklyStats.days,
        categoryBreakdown: weeklyStats.categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
