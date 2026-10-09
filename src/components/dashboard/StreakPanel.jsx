import { Flame } from 'lucide-react';

const WEEK_DAYS = [
  { day: 'M', filled: true },
  { day: 'T', filled: true },
  { day: 'W', filled: true },
  { day: 'T', filled: true },
  { day: 'F', filled: true },
  { day: 'S', filled: false },
  { day: 'S', filled: false },
];

export default function StreakPanel() {
  return (
    <div className="neo-panel-card streak-panel">
      <span className="panel-label">ACTIVE STREAK</span>

      <div className="streak-number">
        <Flame size={32} fill="currentColor" strokeWidth={2} />
        <span>07</span>
      </div>

      <p>days of showing up consecutively</p>

      <div className="week-dots" aria-label="Weekly streak progression">
        {WEEK_DAYS.map((item, i) => (
          <span
            key={i}
            className={item.filled ? 'filled' : ''}
            title={`${item.day}: ${item.filled ? 'Completed' : 'Pending'}`}
          >
            {item.day}
          </span>
        ))}
      </div>

      <p className="streak-note">✳ 5 OF 7 DAYS THIS WEEK</p>
    </div>
  );
}
