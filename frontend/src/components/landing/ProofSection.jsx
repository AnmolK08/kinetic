export default function ProofSection() {
  return (
    <section className="proof-section container" id="proof">
      {/* Stat Card */}
      <div className="proof-card">
        <p className="eyebrow">THE KINETIC EFFECT</p>
        <div className="big-stat">
          87<span>%</span>
        </div>
        <p className="stat-desc">
          of Kinetic people say they feel more in control of their week.
        </p>
        <span className="proof-source">BASED ON OUR 2024 COMMUNITY PULSE</span>
      </div>

      {/* Quote Card */}
      <div className="quote-card">
        <div className="quote-mark" aria-hidden="true">““</div>
        <blockquote>
          Kinetic makes progress feel like something I get to celebrate, not something I have to
          chase.
        </blockquote>
        <p className="quote-author">
          <strong>MARIA S.</strong> <span>— KINETIC MEMBER SINCE 2023</span>
        </p>
      </div>
    </section>
  );
}
