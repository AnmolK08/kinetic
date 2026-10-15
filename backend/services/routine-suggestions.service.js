import prisma from '../config/prisma.js';

export const getRoutineSuggestions = async (userId) => {
  const activeRoutine = await prisma.routine.findFirst({
    where: { userId, isActive: true, isArchived: false },
    include: { tasks: { where: { isActive: true } } },
  });

  const categoriesInUse = new Set((activeRoutine?.tasks || []).map((t) => t.category.toUpperCase()));

  const templates = [
    {
      id: 'sug-morning-momentum',
      name: 'Morning Momentum',
      description: 'Kickstart cognitive flow and physical readiness before deep work.',
      category: 'ENERGY',
      suggestedTasks: [
        { title: 'Hydrate (500ml water + electrolytes)', startTime: '07:00', endTime: '07:10', category: 'ENERGY' },
        { title: '10 min morning mobility stretch', startTime: '07:15', endTime: '07:25', category: 'MOVE' },
        { title: 'Write down 3 daily priorities', startTime: '07:30', endTime: '07:45', category: 'FOCUS' },
      ],
    },
    {
      id: 'sug-deep-focus-rhythm',
      name: 'Deep Focus Block',
      description: 'Zero distraction block with tactical breaks to protect willpower.',
      category: 'FOCUS',
      suggestedTasks: [
        { title: 'Clear inbox & notifications', startTime: '09:00', endTime: '09:15', category: 'FOCUS' },
        { title: '90-minute deep work sprint', startTime: '09:15', endTime: '10:45', category: 'FOCUS' },
        { title: 'Step away from screen & walk', startTime: '10:45', endTime: '11:00', category: 'MOVE' },
      ],
    },
    {
      id: 'sug-evening-wind-down',
      name: 'Evening Restoration',
      description: 'Signal parasympathetic nervous system for restorative sleep.',
      category: 'ENERGY',
      suggestedTasks: [
        { title: 'Evening brisk walk', startTime: '18:30', endTime: '19:00', category: 'MOVE' },
        { title: 'Review tomorrow’s task queue', startTime: '20:30', endTime: '20:45', category: 'FOCUS' },
        { title: 'Digital sunset & read 15 pages', startTime: '21:30', endTime: '22:00', category: 'ENERGY' },
      ],
    },
  ];

  const smartTips = [];
  if (!categoriesInUse.has('MOVE')) {
    smartTips.push({
      type: 'HABIT_GAP',
      message: 'Adding a 10-minute MOVE habit before 10:00 AM boosts dopamine and focus by 23%.',
    });
  }
  if (!categoriesInUse.has('FOCUS')) {
    smartTips.push({
      type: 'OPTIMIZATION',
      message: 'Plan your top 3 needle-moving tasks the night before to eliminate morning decision fatigue.',
    });
  }
  if (smartTips.length === 0) {
    smartTips.push({
      type: 'STREAK_MOMENTUM',
      message: 'Great balance across Move, Focus, and Energy habits. Keep your morning rhythm unbroken!',
    });
  }

  return {
    recommendations: templates,
    tips: smartTips,
    activeCategories: Array.from(categoriesInUse),
  };
};
