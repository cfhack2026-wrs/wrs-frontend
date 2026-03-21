import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import logoHorizontalDark from '/logo_horizontal_dark.png';
import logoHorizontalLight from '/logo_horizontal_light.png';
import { useTheme } from './hooks/useTheme';
import { useScan } from './hooks/useScan';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ScanProgressBanner } from './components/ScanProgressBanner';
import { ScanResults } from './components/ScanResults';
import { AboutModal } from './components/AboutModal';

const TERMINAL_STATUSES = ['completed', 'completed_with_errors', 'failed'];

function HomePage() {
  const { theme, toggle } = useTheme();
  const { scan, isLoading, error, submit } = useScan();
  const [showAbout, setShowAbout] = useState(false);

  const isTerminal     = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning     = scan !== null && !isTerminal;
  const hasAssessments = scan !== null && scan.assessments.length > 0;

  const showFullProgress = isScanning && !hasAssessments;
  const showInlineBanner = isScanning && hasAssessments;
  const showResults      = hasAssessments;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
    >
      {/* Grid backdrop */}
      <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-a w-[700px] h-[700px] -top-64 -right-64"
          style={{ background: 'rgba(34,211,238,0.12)' }} />
        <div className="orb orb-b w-[500px] h-[500px] top-1/2 -left-48"
          style={{ background: 'rgba(99,102,241,0.10)' }} />
        <div className="orb orb-c w-[600px] h-[600px] bottom-0 left-1/2 -translate-x-1/2"
          style={{ background: 'rgba(34,211,238,0.07)' }} />
      </div>

      {/* Header */}
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
          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            aria-label="About this project"
            title="About this project"
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(148,163,184,0.7)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(148,163,184,0.7)',
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

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-24 gap-8">

        {/* Hero text */}
        <div className="text-center space-y-3 max-w-xl animate-fade-up">
          <p
            className="mono text-xs uppercase tracking-widest"
            style={{ color: 'var(--cyan)', letterSpacing: '0.15em' }}
          >
            Web Responsibility Scanner
          </p>
          <h2
            className="text-4xl font-semibold tracking-tight leading-tight"
            style={{ color: 'var(--text-base)' }}
          >
            Audit any website.<br />
            <span style={{ color: 'var(--text-dim)' }}>Instantly.</span>
          </h2>
          <p
            className="text-sm leading-relaxed animate-fade-up delay-100"
            style={{ color: 'var(--text-muted)' }}
          >
            Checks accessibility, performance, security, SEO, and code quality
            in a single scan.
          </p>
        </div>

        <ScanForm onSubmit={submit} isLoading={isLoading} />

        {showFullProgress && <ScanProgress scan={scan!} />}

        {error && (
          <p
            role="alert"
            className="mono text-xs"
            style={{ color: 'rgba(248,113,113,0.9)' }}
          >
            ⚠ {error}
          </p>
        )}

        {showResults && (
          <>
            {showInlineBanner && <ScanProgressBanner />}
            <ScanResults scan={scan!} isScanning={isScanning} />
          </>
        )}
      </main>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const { theme, toggle } = useTheme();
  const { scan, isLoading, error } = useScan(id);
  const [showAbout, setShowAbout] = useState(false);

  const isTerminal = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning = scan !== null && !isTerminal;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
      >
        <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-a w-[700px] h-[700px] -top-64 -right-64"
            style={{ background: 'rgba(34,211,238,0.12)' }} />
          <div className="orb orb-b w-[500px] h-[500px] top-1/2 -left-48"
            style={{ background: 'rgba(99,102,241,0.10)' }} />
          <div className="orb orb-c w-[600px] h-[600px] bottom-0 left-1/2 -translate-x-1/2"
            style={{ background: 'rgba(34,211,238,0.07)' }} />
        </div>
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
            <button
              onClick={() => setShowAbout(true)}
              aria-label="About this project"
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(148,163,184,0.7)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
            </button>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(148,163,184,0.7)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.75rem',
              }}
            >
              {theme === 'dark' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                  </svg>
                  light
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                  dark
                </>
              )}
            </button>
          </div>
        </header>
        <main className="relative z-10 flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading scan results...</p>
        </main>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
      >
        <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-a w-[700px] h-[700px] -top-64 -right-64"
            style={{ background: 'rgba(34,211,238,0.12)' }} />
          <div className="orb orb-b w-[500px] h-[500px] top-1/2 -left-48"
            style={{ background: 'rgba(99,102,241,0.10)' }} />
          <div className="orb orb-c w-[600px] h-[600px] bottom-0 left-1/2 -translate-x-1/2"
            style={{ background: 'rgba(34,211,238,0.07)' }} />
        </div>
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
            <button
              onClick={() => setShowAbout(true)}
              aria-label="About this project"
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(148,163,184,0.7)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
            </button>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(148,163,184,0.7)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.75rem',
              }}
            >
              {theme === 'dark' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                  </svg>
                  light
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                  dark
                </>
              )}
            </button>
          </div>
        </header>
        <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-24 gap-8">
          <p className="text-red-400">Failed to load scan results.</p>
          <Link to="/" className="text-cyan-500 hover:underline">Go back home</Link>
        </main>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
    >
      {/* Grid backdrop */}
      <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="orb orb-a w-[700px] h-[700px] -top-64 -right-64"
          style={{ background: 'rgba(34,211,238,0.12)' }} />
        <div className="orb orb-b w-[500px] h-[500px] top-1/2 -left-48"
          style={{ background: 'rgba(99,102,241,0.10)' }} />
        <div className="orb orb-c w-[600px] h-[600px] bottom-0 left-1/2 -translate-x-1/2"
          style={{ background: 'rgba(34,211,238,0.07)' }} />
      </div>

      {/* Header */}
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
          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            aria-label="About this project"
            title="About this project"
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(148,163,184,0.7)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(148,163,184,0.7)',
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

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-24 gap-8">
        {isScanning && <ScanProgressBanner />}
        <ScanResults scan={scan} isScanning={isScanning} />
      </main>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan/:id" element={<ScanPage />} />
        <Route path="/:id" element={<ScanPage />} />
      </Routes>
    </BrowserRouter>
  );
}