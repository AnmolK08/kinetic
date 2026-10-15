import { LayoutDashboard, Target, Flame, Zap } from 'lucide-react';

export default function DashboardSidebar({ view, setView, streak = 0, score = 0 }) {
  const streakFormatted = String(streak).padStart(2, '0');

  return (
    <>
      {/* ── Mobile Quick Stats Strip (visible only on mobile viewports) ── */}
      <div className="mobile-stats-strip" aria-label="Quick momentum metrics">
        <div className="mobile-stat-pill" data-testid="mobile-streak-pill">
          <Flame size={15} strokeWidth={2.5} color="var(--orange)" />
          <strong>{streakFormatted}</strong>
          <span>DAY STREAK</span>
        </div>
        <div className="mobile-stat-pill" data-testid="mobile-score-pill">
          <Zap size={15} strokeWidth={2.5} color="var(--yellow)" />
          <strong>{score}%</strong>
          <span>WEEKLY SCORE</span>
        </div>
      </div>

      {/* ── Dashboard Sidebar (Desktop: Sticky Left Nav | Mobile: Fixed Bottom Dock) ── */}
      <aside className="dash-sidebar" aria-label="Dashboard navigation">
        <p className="eyebrow">YOUR SPACE</p>

        <button
          type="button"
          className={`side-link ${view === 'today' ? 'active' : ''}`}
          onClick={() => setView('today')}
          data-testid="sidebar-today"
          aria-label="Today's routines"
        >
          <LayoutDashboard size={18} strokeWidth={2.5} />
          <span>Today</span>
        </button>

        <button
          type="button"
          className={`side-link ${view === 'routines' ? 'active' : ''}`}
          onClick={() => setView('routines')}
          data-testid="sidebar-routines"
          aria-label="Manage routines"
        >
          <Target size={18} strokeWidth={2.5} />
          <span>Routines</span>
        </button>

        <button
          type="button"
          className={`side-link ${view === 'progress' ? 'active' : ''}`}
          onClick={() => setView('progress')}
          data-testid="sidebar-progress"
          aria-label="Weekly progress analytics"
        >
          <Flame size={18} strokeWidth={2.5} />
          <span>Progress</span>
        </button>

        <div className="sidebar-bottom">
          <p className="eyebrow">QUICK STATS</p>
          <div className="mini-stat">
            <strong>{streakFormatted}</strong>
            <span>day streak</span>
          </div>
          <div className="mini-stat">
            <strong>{score}%</strong>
            <span>weekly score</span>
          </div>
        </div>
      </aside>
    </>
  );
}

