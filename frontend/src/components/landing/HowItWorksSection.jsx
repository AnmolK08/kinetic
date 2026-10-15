function StepItem({ num, title, text }) {
  return (
    <div className="step">
      <span className="step-num">{num}</span>
      <div className="step-body">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="container how-inner">
        <div className="how-intro">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>
            Less planning.
            <br />
            <em>More doing.</em>
          </h2>
        </div>

        <div className="steps">
          <StepItem
            num="01"
            title="Pick your moves"
            text="Choose the habits, tasks, and workouts that matter right now."
          />
          <StepItem
            num="02"
            title="Check in daily"
            text="A quick tap keeps your progress real and your energy high."
          />
          <StepItem
            num="03"
            title="Watch it stack"
            text="See the proof that consistency beats perfection every time."
          />
        </div>
      </div>
    </section>
  );
}
