import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = true }) {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      data-testid="theme-toggle-button"
      aria-label="Toggle dark theme"
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      {dark ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />}
      {showLabel && <span>{dark ? 'LIGHT' : 'DARK'}</span>}
    </button>
  );
}
