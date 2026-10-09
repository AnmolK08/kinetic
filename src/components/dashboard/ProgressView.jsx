import { ChevronLeft } from 'lucide-react';

export default function ProgressView({ done, total, onBack }) {
  return (
    <div className="progress-view" data-testid="progress-view">
      <div className="progress-hero">
        <div>
          <span className="panel-label">WEEKLY SCORE</span>
          <div className="progress-score">
            82<span>%</span>
          </div>
          <p>You&apos;re ahead of last week by 12%.</p>
        </div>
        <div className="progress-ring" style={{ '--progress': '82%' }}>
          <strong>82%</strong>
          <span>THIS WEEK</span>
        </div>
      </div>

      <div className="progress-cards">
        <div className="neo-panel-card">
          <span className="panel-label">ROUTINES DONE</span>
          <strong>
            {done}/{total}
          </strong>
          <p>Keep showing up.</p>
        </div>
        <div className="neo-panel-card">
          <span className="panel-label">BEST STREAK</span>
          <strong>12 days</strong>
          <p>Your next milestone.</p>
        </div>
        <div className="neo-panel-card">
          <span className="panel-label">ACTIVE DAYS</span>
          <strong>5 / 7</strong>
          <p>Strong, steady energy.</p>
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
