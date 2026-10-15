import { Flame } from 'lucide-react';

export default function StreakPanel({ currentStreak = 0, days = [] }) {
  const streakStr = String(currentStreak).padStart(2, '0');

  // Build week dots from real analytics days
  const weekDots = days.length > 0
    ? days.map((d) => ({
        day: d.dayLetter || d.dayName?.[0] || '?',
        filled: d.isCompleted || false,
      }))
    : [
        { day: 'M', filled: false },
        { day: 'T', filled: false },
        { day: 'W', filled: false },
        { day: 'T', filled: false },
        { day: 'F', filled: false },
        { day: 'S', filled: false },
        { day: 'S', filled: false },
      ];

  const filledCount = weekDots.filter((d) => d.filled).length;

  return (
    <div className="neo-panel-card streak-panel">
      <span className="panel-label">ACTIVE STREAK</span>

      <div className="streak-number">
        <Flame size={32} fill="currentColor" strokeWidth={2} />
        <span>{streakStr}</span>
      </div>

      <p>days of showing up consecutively</p>

      <div className="week-dots" aria-label="Weekly streak progression">
        {weekDots.map((item, i) => (
          <span
            key={i}
            className={item.filled ? 'filled' : ''}
            title={`${item.day}: ${item.filled ? 'Completed' : 'Pending'}`}
          >
            {item.day}
          </span>
        ))}
      </div>

      <p className="streak-note">✳ {filledCount} OF 7 DAYS THIS WEEK</p>
    </div>
  );
}
