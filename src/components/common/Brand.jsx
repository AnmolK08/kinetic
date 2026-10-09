import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Brand({ dark = false, to = '/' }) {
  return (
    <Link
      to={to}
      className={`brand ${dark ? 'brand-dark' : ''}`}
      data-testid="brand-home"
      aria-label="KINETIC Home"
    >
      <span className="brand-mark">
        <Zap size={18} fill="currentColor" strokeWidth={2.5} />
      </span>
      <span className="brand-text">
        KINETIC<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
