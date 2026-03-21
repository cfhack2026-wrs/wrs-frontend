import { Link } from 'react-router-dom';
import logoHorizontalDark from '/logo_horizontal_dark.png';
import logoHorizontalLight from '/logo_horizontal_light.png';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onAboutClick: () => void;
}

export function Header({ onAboutClick }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <h1>
        <Link to="/">
          <img
            src={theme === 'dark' ? logoHorizontalDark : logoHorizontalLight}
            alt="Website Responsibility Scanner"
            className="h-9 w-auto"
          />
        </Link>
      </h1>

      <div className="flex items-center gap-2">
        <Link
          to="/about"
          className="flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--ui-muted)',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Über diesen Scanner
        </Link>

        <button
          onClick={onAboutClick}
          aria-label="About this project"
          title="About this project"
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--ui-muted)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4m0-4h.01" />
          </svg>
        </button>

        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--ui-muted)',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.75rem',
          }}
        >
          {theme === 'dark' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
              light
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              dark
            </>
          )}
        </button>
      </div>
    </header>
  );
}