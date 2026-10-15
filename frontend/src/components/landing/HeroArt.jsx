import { Dumbbell, Flame } from 'lucide-react';

export default function HeroArt() {
  return (
    <div className="hero-art" data-testid="hero-dashboard-preview">
      {/* Sunburst background effect */}
      <div className="sunburst" />

      {/* Edge labels */}
      <div className="art-label label-top">TODAY / 07</div>
      <div className="art-label label-bottom">NO ZERO DAYS</div>

      {/* Routine floating card */}
      <div className="floating-card routine-card">
        <span className="card-kicker">YOUR ROUTINE</span>
        <strong>
          Morning
          <br />
          momentum
        </strong>
        <div className="progress-row">
          <span>4 / 5 done</span>
          <span>80%</span>
        </div>
        <div className="progress-bar">
          <i style={{ width: '80%' }} />
        </div>
      </div>

      {/* Move badge floating card */}
      <div className="floating-card move-card">
        <Dumbbell size={19} strokeWidth={2.5} />
        <span>MOVE</span>
        <b>42 min</b>
      </div>

      {/* Streak floating card */}
      <div className="floating-card streak-card">
        <Flame size={24} fill="currentColor" strokeWidth={2} />
        <strong>07</strong>
        <span>day streak</span>
      </div>
    </div>
  );
}
