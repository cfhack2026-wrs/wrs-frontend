import { useState } from 'react';
import { HashRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { useScan } from './hooks/useScan';
import { TERMINAL_STATUSES } from './types/scanner';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ScanProgressBanner } from './components/ScanProgressBanner';
import { ScanResults } from './components/ScanResults';
import { AboutModal } from './components/AboutModal';
import { Header } from './components/Header';

function PageLayout({ children, state, error, showAbout, setShowAbout }: {
  children?: React.ReactNode;
  state?: 'loading' | 'error';
  error?: string | null;
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--navy)', color: 'var(--text-base)' }}
    >

      <Header onAboutClick={() => setShowAbout(true)} />
      <main className={`relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-24 gap-8 ${state ? 'justify-center' : ''}`}>
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
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

function HomePage() {
  const { scan, isLoading, error, submit } = useScan();
  const [showAbout, setShowAbout] = useState(false);

  const isTerminal     = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning     = scan !== null && !isTerminal;
  const hasAssessments = scan !== null && scan.assessments.length > 0;

  const showFullProgress = isScanning && !hasAssessments;
  const showInlineBanner = isScanning && hasAssessments;
  const showResults      = hasAssessments;

  return (
    <PageLayout showAbout={showAbout} setShowAbout={setShowAbout}>
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
          style={{ color: 'var(--error-text)' }}
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
    </PageLayout>
  );
}

function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const { scan, isLoading, error } = useScan(id);
  const [showAbout, setShowAbout] = useState(false);

  const isTerminal = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const isScanning = scan !== null && !isTerminal;

  if (isLoading) {
    return <PageLayout state="loading" showAbout={showAbout} setShowAbout={setShowAbout} />;
  }

  if (error || !scan) {
    return <PageLayout state="error" error={error} showAbout={showAbout} setShowAbout={setShowAbout} />;
  }

  return (
    <PageLayout showAbout={showAbout} setShowAbout={setShowAbout}>
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
