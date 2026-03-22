import { useCallback } from 'react';
import { HashRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { useScan } from './hooks/useScan';
import { useRecentScans } from './hooks/useRecentScans';
import { useTheme } from './hooks/useTheme';
import { TERMINAL_STATUSES } from './types/scanner';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ScanProgressBanner } from './components/ScanProgressBanner';
import { ScanResults } from './components/ScanResults';
import { RecentScans } from './components/RecentScans';
import { AboutSection } from './components/AboutSection';
import logoHorizontalDark from '/logo_white_transparent.png';
import logoHorizontalLight from '/logo_black_transparent.png';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="theme-fab"
    >
      <span className="theme-fab-label">
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>
      <span className="theme-fab-icon" key={theme}>
        {isDark ? (
          // Sun
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          // Moon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}

function PageLayout({ children, state, error }: {
  children?: React.ReactNode;
  state?: 'loading' | 'error';
  error?: string | null;
}) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
    >
      <main className={`relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-32 gap-8 ${state ? 'justify-center' : ''}`}>
        {state === 'loading' && (
          <p className="text-gray-400">Loading scan results...</p>
        )}
        {state === 'error' && (
          <>
            <p role="alert" className="text-red-400">{error ?? 'Failed to load scan results.'}</p>
            <Link to="/" className="text-cyan-500 hover:underline">Go back home</Link>
          </>
        )}
        {!state && children}
      </main>
      <ThemeToggle />
    </div>
  );
}

function HomePage() {
  const { scan, isLoading, error, submit, selectScan } = useScan();
  const { scans: recentScans, refresh: refreshRecent } = useRecentScans();
  const { theme } = useTheme();

  const isTerminal     = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning     = scan !== null && !isTerminal;
  const hasAssessments = scan !== null && scan.assessments.length > 0;

  const showFullProgress = isScanning && !hasAssessments;
  const showInlineBanner = isScanning && hasAssessments;
  const showResults      = hasAssessments;

  const handleSubmit = useCallback(async (url: string) => {
    await submit(url);
    refreshRecent();
  }, [submit, refreshRecent]);

  return (
    <PageLayout>
      <div className="text-center space-y-4 max-w-2xl animate-fade-up flex flex-col items-center">
        {/* Logo + name row */}
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? logoHorizontalDark : logoHorizontalLight}
            alt=""
            className="h-10 w-auto flex-shrink-0"
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-base)' }}>
              Website{' '}
              <span style={{ color: 'var(--teal)' }}>Responsibility</span>
              {' '}Scanner
            </span>
            <span
              className="mono text-xs mt-0.5"
              style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}
            >
              Open source · EAA · WSG 1.0
            </span>
          </div>
        </div>

        <h1
          className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight"
          style={{ color: 'var(--text-base)' }}
        >
          Audit for{' '}
          <span style={{ color: 'var(--teal)' }}>accessibility</span>
          <br />
          and{' '}
          <span style={{ color: 'var(--lime)' }}>sustainability</span>.
        </h1>
        <p
          className="text-sm leading-relaxed animate-fade-up delay-100 max-w-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          An open-source tool to assess any website against the European Accessibility Act
          and Web Sustainability Guidelines — then turn findings into practical improvements.
        </p>
      </div>

      <ScanForm onSubmit={handleSubmit} isLoading={isLoading} />

      <RecentScans
        scans={recentScans}
        onSelect={selectScan}
        onRerun={handleSubmit}
        activeScanId={scan?.id}
      />

      {showFullProgress && <ScanProgress scan={scan!} />}

      {error && (
        <p
          role="alert"
          className="mono text-xs"
          style={{ color: 'var(--error-text)' }}
        >
          ⚠ {error}
        </p>
      )}

      {showResults ? (
        <>
          {showInlineBanner && <ScanProgressBanner />}
          <ScanResults scan={scan!} isScanning={isScanning} />
        </>
      ) :  (
        <AboutSection />
      )}
    </PageLayout>
  );
}

function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const { scan, isLoading, error } = useScan(id);
  const isTerminal = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning = scan !== null && !isTerminal;

  if (isLoading) {
    return <PageLayout state="loading" />;
  }

  if (error || !scan) {
    return <PageLayout state="error" error={error} />;
  }

  return (
    <PageLayout>
      {isScanning && <ScanProgressBanner />}
      <ScanResults scan={scan} isScanning={isScanning} />
    </PageLayout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan/:id" element={<ScanPage />} />
      </Routes>
    </HashRouter>
  );
}
