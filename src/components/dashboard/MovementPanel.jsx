const CHART_BARS = [
  { day: 'M', height: '45%' },
  { day: 'T', height: '60%' },
  { day: 'W', height: '80%' },
  { day: 'T', height: '35%' },
  { day: 'F', height: '90%', isToday: true },
  { day: 'S', height: '0%' },
  { day: 'S', height: '0%' },
];

export default function MovementPanel() {
  return (
    <div className="neo-panel-card movement-panel">
      <span className="panel-label">MOVEMENT TIME</span>

      <div className="movement-number">
        42 <span>min</span>
      </div>

      <p className="movement-sub">Logged workouts & walks today</p>

      <div className="bar-chart" aria-label="Movement chart past 7 days">
        {CHART_BARS.map((col, i) => (
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
