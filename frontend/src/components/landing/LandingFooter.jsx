import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Brand from '@/components/common/Brand';

export default function LandingFooter() {
  return (
    <footer className="site-footer container">
      <Brand />
      <p className="footer-tagline">Make your day count.</p>
      <Link to="/login" className="footer-cta" data-testid="footer-cta">
        <span>Get started</span>
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </Link>
    </footer>
  );
}
