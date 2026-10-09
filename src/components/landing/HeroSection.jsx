import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import HeroArt from '@/components/landing/HeroArt';

export default function HeroSection() {
  return (
    <section className="hero container" aria-label="Hero">
      <div className="hero-copy">
        <p className="eyebrow" data-testid="hero-eyebrow">
          <span className="eyebrow-dot" />
          MAKE YOUR DAY COUNT
        </p>

        <h1 data-testid="hero-heading">
          Your life,
          <br />
          <span>in motion.</span>
        </h1>

        <p className="hero-text">
          Kinetic is the colorful command center for the things you want to do more of — move,
          focus, and show up.
        </p>

        <div className="hero-actions">
          <Link
            to="/login"
            className="neo-button primary-button"
            data-testid="hero-start-button"
          >
            <span>Start moving</span>
            <ArrowUpRight size={19} strokeWidth={2.5} />
          </Link>

          <a
            href="#how-it-works"
            className="text-link"
            data-testid="hero-how-link"
          >
            <span>See how it works</span>
            <ChevronRight size={17} strokeWidth={2.5} />
          </a>
        </div>

        <div className="hero-note">
          <div className="avatar-stack" aria-hidden="true">
            <span>J</span>
            <span>M</span>
            <span>R</span>
          </div>
          <p>
            <strong>12,400+</strong> people are building momentum
          </p>
        </div>
      </div>

      <HeroArt />
    </section>
  );
}
