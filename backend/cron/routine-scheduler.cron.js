import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { getUtcDateOnly, DAY_NAMES } from '../utils/dates.js';

/**
 * Daily Routine Day Initialization
 * Runs at 00:01 every day to pre-initialize today's RoutineDay records
 * for all active routines across all users.
 */
export const runDailyRoutineInitialization = async () => {
  try {
    const today = getUtcDateOnly();
    const dayOfWeek = DAY_NAMES[today.getUTCDay()];

    console.log(`[CRON] Starting Daily Routine Initialization for ${today.toISOString()} (${dayOfWeek})`);

    const activeRoutines = await prisma.routine.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      include: {
        tasks: {
          where: {
            isActive: true,
            daysOfWeek: { has: dayOfWeek },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    for (const routine of activeRoutines) {
      const existingDay = await prisma.routineDay.findUnique({
        where: {
          userId_routineId_date: {
            userId: routine.userId,
            routineId: routine.id,
            date: today,
          },
        },
      });

      if (!existingDay) {
        await prisma.$transaction(async (tx) => {
          const day = await tx.routineDay.create({
            data: {
              userId: routine.userId,
              routineId: routine.id,
              date: today,
              totalTasks: routine.tasks.length,
              completedTasks: 0,
              completionPercentage: 0,
            },
          });

          if (routine.tasks.length > 0) {
            await tx.routineTaskLog.createMany({
              data: routine.tasks.map((task) => ({
                routineDayId: day.id,
                routineTaskId: task.id,
                userId: routine.userId,
                taskTitleSnapshot: task.title,
                startTimeSnapshot: task.startTime,
                endTimeSnapshot: task.endTime,
                status: 'PENDING',
              })),
            });
          }
        });
      }
    }

    console.log(`[CRON] Routine initialization completed for ${activeRoutines.length} active routines.`);
  } catch (err) {
    console.error('[CRON] Error during daily routine initialization:', err);
  }
};

export const initCronJobs = () => {
  // Run every midnight at 00:01
  cron.schedule('1 0 * * *', () => {
    runDailyRoutineInitialization();
  });

  console.log('⏰ Scheduled cron: Daily Routine Initializer at 00:01 every midnight.');
};
