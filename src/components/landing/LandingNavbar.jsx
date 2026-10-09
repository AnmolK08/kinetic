import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Brand from '@/components/common/Brand';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="site-nav container" data-testid="landing-navigation">
        <Brand />

        <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <a
            href="#features"
            onClick={() => setMenuOpen(false)}
            data-testid="nav-features-link"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMenuOpen(false)}
            data-testid="nav-how-it-works-link"
          >
            How it works
          </a>
          <a
            href="#proof"
            onClick={() => setMenuOpen(false)}
            data-testid="nav-proof-link"
          >
            Why Kinetic
          </a>

          <ThemeToggle className="nav-theme-toggle" />

          <Link
            to="/login"
            className="nav-login"
            onClick={() => setMenuOpen(false)}
            data-testid="nav-login-link"
          >
            <span>Log in</span>
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="mobile-menu-button"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
    </header>
  );
}
