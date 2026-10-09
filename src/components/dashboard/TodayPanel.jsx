import { Check, ArrowUpRight } from 'lucide-react';

export default function TodayPanel({ tasks, done, toggle, onViewAll }) {
  const percent = Math.round((done.length / Math.max(tasks.length, 1)) * 100);

  return (
    <div className="neo-panel-card today-panel">
      <div className="panel-head">
        <div>
          <span className="panel-label">TODAY'S ROUTINE</span>
          <h2>
            {done.length} / {tasks.length} <small>completed</small>
          </h2>
        </div>
        <div className="score-badge" aria-label={`Progress score ${percent}%`}>
          {percent}%
        </div>
      </div>

      <div className="task-list">
        {tasks.map((task, index) => {
          const isDone = done.includes(index);
          return (
            <button
              key={index}
              type="button"
              className={`task-row ${isDone ? 'completed' : ''}`}
              onClick={() => toggle(index)}
              data-testid={`task-item-${index}`}
              aria-label={`Toggle task: ${task.title}`}
            >
              <span className={`task-check ${isDone ? task.color : ''}`}>
                {isDone && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="task-title">{task.title}</span>
              <span className={`task-tag ${task.color}`}>{task.tag}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="view-all"
        onClick={onViewAll}
        data-testid="view-all-routines"
      >
        <span>View all {tasks.length} routines</span>
        <ArrowUpRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
