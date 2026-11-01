import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Loader2,
} from 'lucide-react';
import { fetchMonthlyAnalytics } from '@/lib/api';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function MonthlyHeatmap({ fallbackCurrentStreak = 0, fallbackLongestStreak = 0 }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [activeTooltipDay, setActiveTooltipDay] = useState(null);

  const {
    data: stats,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['monthly-analytics', currentMonth, currentYear],
    queryFn: () => fetchMonthlyAnalytics(currentMonth, currentYear),
    staleTime: 30_000,
  });

  const handlePrevMonth = () => {
    setActiveTooltipDay(null);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setActiveTooltipDay(null);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const currentStreak = stats?.currentStreak ?? fallbackCurrentStreak;
  const longestStreak = stats?.longestStreak ?? fallbackLongestStreak;

  // Build calendar matrix
  // Month is 1-indexed for getUTCMonth / Date constructor
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const startingDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

  // Create lookup for stats days by YYYY-MM-DD
  const daysMap = new Map();
  if (stats?.days) {
    for (const d of stats.days) {
      daysMap.set(d.date, d);
    }
  }

  const calendarCells = [];
  // 1. Padding days from previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` });
  }

  // 2. Real days in current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const isoDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayData = daysMap.get(isoDate) || {
      date: isoDate,
      dayNumber: dayNum,
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0,
      isComplete: false,
    };
    calendarCells.push({
      isPadding: false,
      key: isoDate,
      dayNumber: dayNum,
      ...dayData,
    });
  }

  const getHeatmapColorStyle = (cell) => {
    if (cell.isPadding) return { background: 'transparent', border: '1px solid transparent' };
    const pct = cell.completionPercentage || 0;
    const total = cell.totalTasks || 0;

    if (total === 0 || pct === 0) {
      return {
        background: 'var(--paper-card)',
        border: '1.5px solid var(--border-color, rgba(120, 120, 120, 0.25))',
      };
    }
    if (pct === 100) {
      return {
        background: 'var(--cyan)',
        border: '2px solid var(--ink)',
        boxShadow: '2px 2px 0 var(--ink)',
      };
    }
    if (pct >= 70) {
      return {
        background: 'rgba(95, 227, 210, 0.5)',
        border: '2px solid var(--ink)',
      };
    }
    if (pct >= 40) {
      return {
        background: 'rgba(255, 216, 20, 0.5)',
        border: '2px solid var(--ink)',
      };
    }
    return {
      background: 'rgba(255, 179, 0, 0.3)',
      border: '2px solid var(--ink)',
    };
  };

  return (
    <div
      className="neo-panel-card monthly-consistency-heatmap-card"
      style={{
        position: 'relative',
      }}
    >
      {/* ── Title Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} strokeWidth={2.5} color="var(--ink)" />
          <h3
            style={{
              font: '800 20px "Space Grotesk", sans-serif',
              margin: 0,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            Monthly Consistency Heatmap
          </h3>
        </div>
        <div
          className="panel-label"
          style={{
            marginTop: '4px',
            color: 'var(--ink-subtle)',
          }}
        >
          DAILY COMPLETION TRACKING AND STREAKS
        </div>
      </div>

      {/* ── Month Navigation & Streak Badges ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              background: 'none',
              border: 0,
              color: 'var(--ink)',
              cursor: 'pointer',
              padding: '4px',
              display: 'grid',
              placeItems: 'center',
            }}
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              font: '800 17px "Space Grotesk", sans-serif',
              color: 'var(--ink)',
            }}
          >
            <CalendarIcon size={16} strokeWidth={2.5} />
            <span>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            {isFetching && <Loader2 size={13} className="spin-icon" style={{ opacity: 0.6 }} />}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              background: 'none',
              border: 0,
              color: 'var(--ink)',
              cursor: 'pointer',
              padding: '4px',
              display: 'grid',
              placeItems: 'center',
            }}
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Streaks Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              border: '2px solid var(--ink)',
              background: 'var(--orange)',
              color: '#ffffff',
              boxShadow: '2px 2px 0 var(--ink)',
              font: '800 11.5px "DM Mono", monospace',
            }}
          >
            <Flame size={14} strokeWidth={2.5} />
            <span>Current: {currentStreak}d streak</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              border: '2px solid var(--ink)',
              background: 'var(--cyan)',
              color: '#171717',
              boxShadow: '2px 2px 0 var(--ink)',
              font: '800 11.5px "DM Mono", monospace',
            }}
          >
            <Trophy size={14} strokeWidth={2.5} />
            <span>Best: {longestStreak}d</span>
          </div>
        </div>
      </div>

      {/* ── Calendar Table Grid ── */}
      <div
        style={{
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
          padding: '16px',
          overflowX: 'auto',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '10px',
            textAlign: 'center',
          }}
        >
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              style={{
                font: '800 11px "DM Mono", monospace',
                color: 'var(--ink-subtle)',
                letterSpacing: '0.06em',
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
          }}
        >
          {calendarCells.map((cell) => {
            if (cell.isPadding) {
              return (
                <div
                  key={cell.key}
                  style={{
                    minHeight: '58px',
                    background: 'transparent',
                  }}
                />
              );
            }

            const style = getHeatmapColorStyle(cell);
            const isHovered = activeTooltipDay?.date === cell.date;

            return (
              <div
                key={cell.key}
                onMouseEnter={() => setActiveTooltipDay(cell)}
                onMouseLeave={() => setActiveTooltipDay(null)}
                onClick={() =>
                  setActiveTooltipDay(activeTooltipDay?.date === cell.date ? null : cell)
                }
                style={{
                  ...style,
                  minHeight: '58px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    font: '800 11.5px "DM Mono", monospace',
                    color: cell.completionPercentage === 100 ? '#171717' : 'var(--ink)',
                    textAlign: 'left',
                  }}
                >
                  {cell.dayNumber}
                </div>

                {/* Optional mini pill badge if completed */}
                {cell.completionPercentage > 0 && !isHovered && (
                  <div
                    style={{
                      fontSize: '9.5px',
                      fontFamily: '"DM Mono", monospace',
                      fontWeight: 800,
                      color: cell.completionPercentage === 100 ? '#171717' : 'var(--ink)',
                      textAlign: 'right',
                    }}
                  >
                    {cell.completionPercentage}%
                  </div>
                )}

                {/* Popover / Tooltip shown on hover or click */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--paper-card)',
                      border: '2px solid var(--ink)',
                      boxShadow: '3px 3px 0 var(--ink)',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      pointerEvents: 'none',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        font: '800 11px "DM Mono", monospace',
                        color: 'var(--ink)',
                        lineHeight: 1.2,
                      }}
                    >
                      {cell.date}
                    </div>
                    <div
                      style={{
                        font: '700 10px "Plus Jakarta Sans", sans-serif',
                        color: cell.totalTasks > 0 ? (cell.completionPercentage === 100 ? 'var(--cyan)' : 'var(--orange)') : 'var(--ink-subtle)',
                        marginTop: '2px',
                        lineHeight: 1.1,
                      }}
                    >
                      {cell.totalTasks > 0
                        ? `${cell.completedTasks}/${cell.totalTasks} done (${cell.completionPercentage}%)`
                        : 'No routine tracked'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Legend ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '10px',
          marginTop: '16px',
          fontSize: '11px',
          fontFamily: '"DM Mono", monospace',
          fontWeight: 700,
          color: 'var(--ink-subtle)',
        }}
      >
        <span>Less active</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Level 0: Empty / Not tracked */}
          <span
            style={{
              width: '14px',
              height: '14px',
              background: 'var(--paper-card)',
              border: '1.5px solid var(--ink)',
            }}
            title="0% or not tracked"
          />
          {/* Level 1: Low (1-39%) */}
          <span
            style={{
              width: '14px',
              height: '14px',
              background: 'rgba(255, 179, 0, 0.35)',
              border: '1.5px solid var(--ink)',
            }}
            title="1 - 39%"
          />
          {/* Level 2: Medium (40-69%) */}
          <span
            style={{
              width: '14px',
              height: '14px',
              background: 'rgba(255, 216, 20, 0.55)',
              border: '1.5px solid var(--ink)',
            }}
            title="40 - 69%"
          />
          {/* Level 3: High (70-99%) */}
          <span
            style={{
              width: '14px',
              height: '14px',
              background: 'rgba(95, 227, 210, 0.55)',
              border: '1.5px solid var(--ink)',
            }}
            title="70 - 99%"
          />
          {/* Level 4: 100% Crushed */}
          <span
            style={{
              width: '14px',
              height: '14px',
              background: 'var(--cyan)',
              border: '1.5px solid var(--ink)',
              boxShadow: '1.5px 1.5px 0 var(--ink)',
            }}
            title="100% Crushed"
          />
        </div>
        <span>100% Crushed</span>
      </div>
    </div>
  );
}

