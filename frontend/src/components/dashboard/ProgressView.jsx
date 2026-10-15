import { ChevronLeft, Flame, Zap, Award, Activity, Target } from 'lucide-react';

export default function ProgressView({ weeklyStats, done = 0, total = 0, onBack }) {
  const score = weeklyStats?.weeklyScore ?? 0;
  const currentStreak = weeklyStats?.currentStreak ?? 0;
  const longestStreak = weeklyStats?.longestStreak ?? 0;
  const activeDays = weeklyStats?.activeDays ?? 0;
  const totalTasks = weeklyStats?.totalTasks ?? total;
  const completedTasks = weeklyStats?.completedTasks ?? done;
  const movementMinutesWeek = weeklyStats?.movementMinutesWeek ?? 0;
  const categoryBreakdown = weeklyStats?.categoryBreakdown || {};
  const days = weeklyStats?.days || [];

  return (
    <div className="progress-view" data-testid="progress-view">
      {/* ── Hero Score Banner ── */}
      <div className="progress-hero">
        <div>
          <span className="panel-label">WEEKLY SCORE</span>
          <div className="progress-score">
            {score}<span>%</span>
          </div>
          <p>
            {score >= 80
              ? "You're operating at elite consistency. Keep pushing!"
              : score >= 50
              ? "Great momentum building this week. Stay the course!"
              : "Every routine completed builds momentum. Take the next step!"}
          </p>
        </div>
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(var(--yellow, #ffd814) 0% ${score}%, #1e1e24 ${score}% 100%)`,
          }}
        >
          <strong>{score}%</strong>
          <span>THIS WEEK</span>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="progress-cards">
        <div className="neo-panel-card">
          <span className="panel-label">TASKS COMPLETED</span>
          <strong>
            {completedTasks} / {totalTasks}
          </strong>
          <p>Routines completed across the week.</p>
        </div>

        <div className="neo-panel-card">
          <span className="panel-label">STREAK MOMENTUM</span>
          <strong>{currentStreak} days</strong>
          <p>Best streak: {longestStreak} days uninterrupted.</p>
        </div>

        <div className="neo-panel-card">
          <span className="panel-label">ACTIVE DAYS</span>
          <strong>{activeDays} / 7</strong>
          <p>{movementMinutesWeek} min of movement logged.</p>
        </div>
      </div>

      {/* ── 7-Day Performance Grid ── */}
      <div className="neo-panel-card" style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="panel-label">7-DAY BREAKDOWN</span>
            <h3 style={{ margin: '4px 0 0', font: '800 20px "Space Grotesk", sans-serif' }}>
              Daily Consistency
            </h3>
          </div>
          <span className="score-badge">REAL-TIME</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '12px',
          }}
        >
          {days.map((d, idx) => {
            const pct = d.completionPercentage ?? 0;
            return (
              <div
                key={idx}
                style={{
                  border: d.isToday ? '3px solid var(--ink)' : '2px solid rgba(120, 120, 120, 0.3)',
                  boxShadow: d.isToday ? '4px 4px 0 var(--yellow)' : 'none',
                  padding: '12px 8px',
                  textAlign: 'center',
                  background: d.isToday ? 'var(--paper-card)' : 'transparent',
                }}
              >
                <div style={{ font: '800 12px "DM Mono", monospace', color: 'var(--ink-subtle)' }}>
                  {d.dayName?.slice(0, 3)?.toUpperCase() || d.dayLetter}
                </div>
                <div
                  style={{
                    font: '900 22px "Space Grotesk", sans-serif',
                    margin: '6px 0',
                    color: pct === 100 ? 'var(--cyan)' : pct > 0 ? 'var(--yellow)' : 'var(--ink)',
                  }}
                >
                  {pct}%
                </div>
                <div style={{ font: '600 11px "Plus Jakarta Sans", sans-serif', opacity: 0.7 }}>
                  {d.completedTasks}/{d.totalTasks} done
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="neo-panel-card">
        <span className="panel-label">HABIT PILLARS</span>
        <h3 style={{ margin: '6px 0 16px', font: '800 20px "Space Grotesk", sans-serif' }}>
          Performance by Dimension
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { key: 'MOVE', label: 'Movement & Body', color: 'var(--cyan)', icon: Activity },
            { key: 'FOCUS', label: 'Deep Focus & Work', color: 'var(--yellow)', icon: Target },
            { key: 'ENERGY', label: 'Energy & Recovery', color: 'var(--pink)', icon: Zap },
            { key: 'GENERAL', label: 'General Habits', color: 'var(--purple)', icon: Award },
          ].map(({ key, label, color, icon: Icon }) => {
            const data = categoryBreakdown[key] || { completed: 0, total: 0 };
            const catPct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

            return (
              <div
                key={key}
                style={{
                  border: '2px solid var(--ink)',
                  padding: '16px',
                  background: 'var(--paper)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      display: 'grid',
                      placeItems: 'center',
                      background: color,
                      color: '#171717',
                      border: '1.5px solid #171717',
                    }}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  <span style={{ font: '700 13px "Space Grotesk", sans-serif' }}>{label}</span>
                </div>

                <div style={{ font: '800 24px "Space Grotesk", sans-serif', margin: '4px 0' }}>
                  {catPct}%
                </div>
                <div style={{ font: '500 12px "DM Mono", monospace', color: 'var(--ink-subtle)' }}>
                  {data.completed} of {data.total} tasks completed
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="back-today"
        onClick={onBack}
        data-testid="progress-back-button"
      >
        <ChevronLeft size={17} strokeWidth={2.5} />
        <span>Back to today</span>
      </button>
    </div>
  );
}
