import { ArrowUpRight, HeartPulse, Flame, Target } from 'lucide-react';

function FeatureCard({ color, icon, title, text }) {
  return (
    <article className={`feature-card ${color}`} data-testid={`feature-${color}`}>
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowUpRight className="feature-arrow" size={22} strokeWidth={2.5} />
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section className="feature-section container" id="features">
      <div className="section-intro">
        <p className="eyebrow">THE WHOLE PICTURE</p>
        <h2>
          Small wins.
          <br />
          <em>Big energy.</em>
        </h2>
        <p>One simple space for the daily actions that add up to a life you actually want.</p>
      </div>

      <div className="feature-grid">
        <FeatureCard
          color="yellow"
          icon={<Target size={24} strokeWidth={2.5} />}
          title="Make it visible"
          text="Turn vague intentions into clear, doable actions."
        />
        <FeatureCard
          color="cyan"
          icon={<HeartPulse size={24} strokeWidth={2.5} />}
          title="Move your way"
          text="Log workouts, walks, and the movement that feels good."
        />
        <FeatureCard
          color="orange"
          icon={<Flame size={24} strokeWidth={2.5} />}
          title="Keep the spark"
          text="Streaks that motivate you, never guilt-trip you."
        />
      </div>
    </section>
  );
}
