import prisma from '../config/prisma.js';
import { getUtcDateOnly, DAY_NAMES } from '../utils/dates.js';

async function main() {
  console.log('🌱 Starting Kinetic database seed...');

  // 1. Create or upsert Demo User
  const demoUserId = 'demo-user-01';
  const user = await prisma.user.upsert({
    where: { id: demoUserId },
    update: {
      name: 'Alex',
      email: 'demo@kinetic.app',
    },
    create: {
      id: demoUserId,
      email: 'demo@kinetic.app',
      name: 'Alex',
      password: 'password123',
    },
  });
  console.log(`👤 Upserted demo user: ${user.name} (${user.id})`);

  // 2. Check if routine exists
  let routine = await prisma.routine.findFirst({
    where: { userId: user.id, isArchived: false },
  });

  if (!routine) {
    routine = await prisma.routine.create({
      data: {
        userId: user.id,
        name: 'Daily Rhythm & Energy',
        description: 'Core morning, focus, and movement habits to maintain high daily momentum.',
        isActive: true,
        tasks: {
          create: [
            {
              title: '10 min morning stretch',
              description: 'Gentle spinal warm-up and hip mobility',
              startTime: '07:00',
              endTime: '07:15',
              category: 'MOVE',
              daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              priority: 1,
              isActive: true,
            },
            {
              title: 'Write down 3 priorities',
              description: 'Select non-negotiable needle movers before looking at emails',
              startTime: '08:00',
              endTime: '08:15',
              category: 'FOCUS',
              daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              priority: 2,
              isActive: true,
            },
            {
              title: 'Take a proper lunch break',
              description: 'Step away from screen and eat mindfully without work distractions',
              startTime: '12:30',
              endTime: '13:00',
              category: 'ENERGY',
              daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
              priority: 3,
              isActive: true,
            },
            {
              title: 'Evening walk',
              description: 'Brisk 30-minute outdoor walk for recovery and cortisol reduction',
              startTime: '18:00',
              endTime: '18:30',
              category: 'MOVE',
              daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              priority: 4,
              isActive: true,
            },
          ],
        },
      },
      include: { tasks: true },
    });
    console.log(`📋 Created routine: ${routine.name} with ${routine.tasks.length} tasks`);
  }

  // 3. Create historical RoutineDay entries for the past 6 days + today
  const routineTasks = await prisma.routineTask.findMany({
    where: { routineId: routine.id, isActive: true },
    orderBy: { priority: 'asc' },
  });

  const today = getUtcDateOnly();

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setUTCDate(today.getUTCDate() - i);
    const dayOfWeek = DAY_NAMES[targetDate.getUTCDay()];

    const applicableTasks = routineTasks.filter((t) => t.daysOfWeek.includes(dayOfWeek));
    if (applicableTasks.length === 0) continue;

    // Past 5 days complete, yesterday complete, today partial (2 done)
    const isToday = i === 0;
    const isYesterday = i === 1;
    const shouldCompleteAll = i > 1;

    let existingDay = await prisma.routineDay.findUnique({
      where: {
        userId_routineId_date: {
          userId: user.id,
          routineId: routine.id,
          date: targetDate,
        },
      },
    });

    if (!existingDay) {
      const completedCount = shouldCompleteAll
        ? applicableTasks.length
        : isYesterday
          ? applicableTasks.length
          : Math.min(2, applicableTasks.length);

      const percentage = Math.round((completedCount / applicableTasks.length) * 100);

      existingDay = await prisma.routineDay.create({
        data: {
          userId: user.id,
          routineId: routine.id,
          date: targetDate,
          totalTasks: applicableTasks.length,
          completedTasks: completedCount,
          completionPercentage: percentage,
          taskLogs: {
            create: applicableTasks.map((t, idx) => {
              const isTaskDone = idx < completedCount;
              return {
                routineTaskId: t.id,
                userId: user.id,
                taskTitleSnapshot: t.title,
                startTimeSnapshot: t.startTime,
                endTimeSnapshot: t.endTime,
                status: isTaskDone ? 'COMPLETED' : 'PENDING',
                completedAt: isTaskDone ? targetDate : null,
              };
            }),
          },
        },
      });

      console.log(`📅 Created routine day for ${targetDate.toISOString().slice(0, 10)}: ${percentage}%`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
