export default function MovementPanel({ movementMinutesToday = 0, days = [] }) {
  // Build chart bars from real weekly data
  const chartBars = days.length > 0
    ? days.map((d) => {
        const pct = d.completionPercentage ?? 0;
        return {
          day: d.dayLetter || d.dayName?.[0] || '?',
          height: `${Math.min(pct, 100)}%`,
          isToday: d.isToday || false,
        };
      })
    : [
        { day: 'M', height: '0%' },
        { day: 'T', height: '0%' },
        { day: 'W', height: '0%' },
        { day: 'T', height: '0%' },
        { day: 'F', height: '0%' },
        { day: 'S', height: '0%' },
        { day: 'S', height: '0%' },
      ];

  return (
    <div className="neo-panel-card movement-panel">
      <span className="panel-label">MOVEMENT TIME</span>

      <div className="movement-number">
        {movementMinutesToday} <span>min</span>
      </div>

      <p className="movement-sub">Logged workouts &amp; walks today</p>

      <div className="bar-chart" aria-label="Completion chart past 7 days">
        {chartBars.map((col, i) => (
          <div key={i} className="bar-column">
            <i
              style={{ height: col.height }}
              className={col.isToday ? 'today-bar' : ''}
              title={`${col.day}: ${col.height}`}
            />
            <span>{col.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
