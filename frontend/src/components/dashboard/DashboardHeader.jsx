import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail } from 'lucide-react';
import Brand from '@/components/common/Brand';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useLogout } from '@/features/auth/hooks';

export default function DashboardHeader({ user }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user?.name || 'Alex';
  const email = user?.email || 'demo@kinetic.app';
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="dash-topbar">
      <Brand to="/dashboard" />

      <div className="dash-actions">
        <ThemeToggle />

        <span className="live-dot" aria-hidden="true" />

        <span className="dash-date">
          {dayName}, {monthName} {dayNum}
        </span>

        {/* Profile Dropdown Container */}
        <div
          ref={dropdownRef}
          className="profile-dropdown-container"
          style={{ position: 'relative' }}
          onMouseEnter={() => setProfileOpen(true)}
          onMouseLeave={() => setProfileOpen(false)}
        >
          <button
            type="button"
            className="avatar"
            data-testid="profile-button"
            title={`Signed in as ${displayName}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {initials}
          </button>

          {profileOpen && (
            <div
              className="profile-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: 'var(--paper-card)',
                border: 'var(--line)',
                boxShadow: 'var(--shadow)',
                padding: '16px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    background: 'var(--yellow)',
                    color: '#171717',
                    border: '2px solid var(--ink)',
                    boxShadow: '2px 2px 0 var(--ink)',
                    font: '800 14px "DM Mono", monospace',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      font: '800 15px "Space Grotesk", sans-serif',
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      font: '500 12px "DM Mono", monospace',
                      color: 'var(--ink-subtle)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {email}
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: '1px',
                  background: 'var(--ink)',
                  opacity: 0.15,
                  margin: '2px 0',
                }}
              />

              <button
                type="button"
                onClick={handleLogout}
                data-testid="logout-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  border: '2px solid var(--ink)',
                  boxShadow: '3px 3px 0 var(--ink)',
                  font: '800 13px "Plus Jakarta Sans", sans-serif',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease, color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff4d4f';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--paper)';
                  e.currentTarget.style.color = 'var(--ink)';
                }}
              >
                <LogOut size={16} strokeWidth={2.5} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
