import { Check, ArrowUpRight, Loader2, Clock, Plus } from 'lucide-react';

const CATEGORY_COLORS = {
  MOVE: 'cyan',
  FOCUS: 'yellow',
  ENERGY: 'pink',
  general: 'purple',
  GENERAL: 'purple',
};

const CATEGORY_TAGS = {
  MOVE: 'MOVE',
  FOCUS: 'FOCUS',
  ENERGY: 'ENERGY',
  general: 'HABIT',
  GENERAL: 'HABIT',
};

export default function TodayPanel({
  taskLogs = [],
  loading = false,
  onToggle,
  onViewAll,
  activeRoutine,
  onOpenCreate,
}) {
  const completedCount = taskLogs.filter((l) => l.status === 'COMPLETED').length;
  const total = taskLogs.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="neo-panel-card today-panel">
        <div className="panel-head">
          <div>
            <span className="panel-label">TODAY'S MOVES</span>
            <h2><strong>—</strong> <small>loading…</small></h2>
          </div>
        </div>
        <div className="task-list" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={24} className="spin-icon" />
        </div>
      </div>
    );
  }

  if (!activeRoutine) {
    return (
      <div className="neo-panel-card today-panel">
        <div className="panel-head">
          <div>
            <span className="panel-label">TODAY'S MOVES</span>
            <h2><strong>0</strong> <small>/ 0 complete</small></h2>
          </div>
        </div>
        <div className="task-list" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-subtle)', marginBottom: '16px' }}>
            No active routine yet. Create one or activate a blueprint to start your day!
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="neo-button primary-button"
              onClick={onOpenCreate}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Routine</span>
            </button>
            <button
              type="button"
              className="neo-button"
              onClick={onViewAll}
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                background: 'var(--paper)',
                border: '2px solid var(--ink)',
              }}
            >
              Browse Routines
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-panel-card today-panel">
      <div className="panel-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span className="panel-label">TODAY'S MOVES</span>
            <span
              style={{
                font: '700 11px "DM Mono", monospace',
                color: 'var(--ink-subtle)',
                background: 'var(--paper)',
                border: '1.5px solid var(--ink)',
                padding: '1px 6px',
              }}
            >
              {activeRoutine.name}
            </span>
          </div>

          <h2>
            <strong>{completedCount}</strong> <small>/ {total} complete</small>
          </h2>
        </div>
        <div className="score-badge" aria-label={`Progress score ${percent}%`}>
          {percent >= 80 ? 'ON FIRE 🔥' : percent >= 50 ? 'ON A ROLL' : percent > 0 ? 'GETTING STARTED' : "LET'S GO"}
        </div>
      </div>

      <div className="task-list">
        {taskLogs.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ink-subtle)' }}>
            <p>No tasks scheduled for today in this routine.</p>
            <button
              type="button"
              className="neo-button"
              onClick={onViewAll}
              style={{
                marginTop: '10px',
                fontSize: '12px',
                padding: '6px 14px',
                background: 'var(--paper)',
                border: '2px solid var(--ink)',
              }}
            >
              Manage Routine Tasks
            </button>
          </div>
        ) : (
          taskLogs.map((log) => {
            const isDone = log.status === 'COMPLETED';
            const category = (log.routineTask?.category || 'general').toUpperCase();
            const color = CATEGORY_COLORS[category] || 'purple';
            const tag = CATEGORY_TAGS[category] || 'HABIT';
            const timeRange =
              log.startTimeSnapshot && log.endTimeSnapshot
                ? `${log.startTimeSnapshot} - ${log.endTimeSnapshot}`
                : null;

            return (
              <button
                key={log.id}
                type="button"
                className={`task-row ${isDone ? 'completed' : ''}`}
                onClick={() => onToggle(log)}
                data-testid={`task-item-${log.id}`}
                aria-label={`Toggle task: ${log.taskTitleSnapshot}`}
              >
                <span className={`task-check ${isDone ? color : ''}`}>
                  {isDone && <Check size={14} strokeWidth={3} />}
                </span>

                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div className="task-title">{log.taskTitleSnapshot}</div>
                  {timeRange && (
                    <div
                      style={{
                        font: '500 11px "DM Mono", monospace',
                        color: 'var(--ink-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                      }}
                    >
                      <Clock size={11} />
                      <span>{timeRange}</span>
                    </div>
                  )}
                </div>

                <span className={`task-tag ${color}`}>{tag}</span>
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="view-all"
        onClick={onViewAll}
        data-testid="view-all-routines"
      >
        <span>Manage all routines</span>
        <ArrowUpRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
