import routineQueue from '../queues/routine.queue.js';
import prisma from '../config/prisma.js';

export const initRoutineWorker = () => {
  routineQueue.on('process', async (job) => {
    switch (job.type) {
      case 'TASK_COMPLETED': {
        const { userId, taskId, routineDayId } = job.data;
        console.log(`[WORKER] Processing TASK_COMPLETED for user: ${userId}, task: ${taskId}`);

        // Check if all tasks for the day are complete
        const day = await prisma.routineDay.findUnique({
          where: { id: routineDayId },
        });

        if (day && day.totalTasks > 0 && day.completedTasks >= day.totalTasks) {
          console.log(`🎉 [WORKER] Day ${day.date.toISOString()} fully completed for user: ${userId}!`);
          await routineQueue.add('DAY_COMPLETED_MILESTONE', { userId, routineDayId });
        }
        break;
      }

      case 'DAY_COMPLETED_MILESTONE': {
        const { userId } = job.data;
        console.log(`🏆 [WORKER] Streak milestone checked for user: ${userId}`);
        break;
      }

      default:
        console.log(`[WORKER] Unknown job type: ${job.type}`);
    }
  });

  console.log('👷 Background routine worker initialized and listening for jobs.');
};

initRoutineWorker();
