import { LayoutDashboard, Target, Flame } from 'lucide-react';

export default function DashboardSidebar({ view, setView }) {
  return (
    <aside className="dash-sidebar" aria-label="Dashboard navigation">
      <p className="eyebrow">YOUR SPACE</p>

      <button
        type="button"
        className={`side-link ${view === 'today' ? 'active' : ''}`}
        onClick={() => setView('today')}
        data-testid="sidebar-today"
      >
        <LayoutDashboard size={18} strokeWidth={2.5} />
        <span>Today</span>
      </button>

      <button
        type="button"
        className={`side-link ${view === 'routines' ? 'active' : ''}`}
        onClick={() => setView('routines')}
        data-testid="sidebar-routines"
      >
        <Target size={18} strokeWidth={2.5} />
        <span>Routines</span>
      </button>

      <button
        type="button"
        className={`side-link ${view === 'progress' ? 'active' : ''}`}
        onClick={() => setView('progress')}
        data-testid="sidebar-progress"
      >
        <Flame size={18} strokeWidth={2.5} />
        <span>Progress</span>
      </button>

      <div className="sidebar-bottom">
        <p className="eyebrow">QUICK STATS</p>
        <div className="mini-stat">
          <strong>07</strong>
          <span>day streak</span>
        </div>
        <div className="mini-stat">
          <strong>82%</strong>
          <span>weekly score</span>
        </div>
      </div>
    </aside>
  );
}
