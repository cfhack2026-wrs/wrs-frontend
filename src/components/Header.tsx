import { Link } from 'react-router-dom';
import logoHorizontalDark from '/logo_white_transparent.png';
import logoHorizontalLight from '/logo_black_transparent.png';
import { useTheme } from '../hooks/useTheme';

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <Link to="/" className="flex items-center gap-4">
        <img
          src={theme === 'dark' ? logoHorizontalDark : logoHorizontalLight}
          alt="Website Responsibility Scanner"
          className="h-18 w-auto"
        />
        <span className="hidden sm:block text-2xl font-bold" style={{ color: 'var(--ui-text)' }}>
          Website Responsibility Scanner
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative focus:outline-none focus-visible:ring-2 rounded-full"
          style={{
            width: '68px',
            height: '34px',
            flexShrink: 0,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {/* thumb with active icon */}
          <span
            aria-hidden="true"
            className="absolute rounded-full flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              top: '2px',
              left: '3px',
              transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(0)',
              background: 'var(--ui-muted)',
              transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--navy)"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ width: '16px', height: '16px' }}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--navy)"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ width: '16px', height: '16px' }}>
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            )}
          </span>
          {/* inactive icon on opposite side */}
          <span
            aria-hidden="true"
            className="absolute flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              top: '2px',
              left: theme === 'dark' ? '3px' : '37px',
            }}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.7)' }}>
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ width: '16px', height: '16px', color: 'rgba(0,0,0,0.25)' }}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </header>
  );
}