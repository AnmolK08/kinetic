import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Brand from '@/components/common/Brand';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useLogout } from '@/features/auth/hooks';

export default function DashboardHeader({ user }) {
  const navigate = useNavigate();
  const logout = useLogout();

  const displayName = user?.name || 'Alex';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = today.getDate().toString().padStart(2, '0');

  const handleLogout = () => {
    localStorage.removeItem('kinetic-demo-mode');
    logout.mutate(undefined, {
      onSettled: () => navigate('/login'),
    });
  };

  return (
    <header className="dash-topbar">
      <Brand to="/dashboard" />

      <div className="dash-actions">
        <ThemeToggle />

        <span className="live-dot" aria-hidden="true" />

        <span className="dash-date">
          {dayName}, {monthName} {dayNum}
        </span>

        <button
          type="button"
          className="avatar"
          data-testid="profile-button"
          title={`Signed in as ${displayName}`}
        >
          {initials}
        </button>

        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
          data-testid="logout-button"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={17} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
