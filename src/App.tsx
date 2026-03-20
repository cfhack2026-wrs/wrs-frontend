import { useTheme } from './hooks/useTheme';
import { useScan } from './hooks/useScan';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ScanResults } from './components/ScanResults';
import { ScoreDashboard } from './components/ScoreDashboard';

const TERMINAL_STATUSES = ['completed', 'completed_with_errors', 'failed'];

export default function App() {
  const { theme, toggle } = useTheme();
  const { scan, isLoading, error, submit } = useScan();

  const showResults = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const showProgress = scan !== null && !showResults;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col relative overflow-hidden transition-colors duration-300">

      {/* Animated background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="blob blob-1 w-[600px] h-[600px] bg-indigo-400/15 dark:bg-indigo-600/20 -top-48 -right-48" />
        <div className="blob blob-2 w-[500px] h-[500px] bg-violet-400/15 dark:bg-violet-600/20 top-1/3 -left-48" />
        <div className="blob blob-3 w-[550px] h-[550px] bg-blue-400/10 dark:bg-blue-500/15 bottom-0 left-1/2 -translate-x-1/2" />
        <div className="blob blob-4 w-[400px] h-[400px] bg-purple-400/10 dark:bg-purple-500/15 top-1/2 right-0" />
      </div>

      <header className="relative border-b border-gray-200 dark:border-white/10 px-6 py-4 backdrop-blur-sm flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          Website Responsibility Scanner
        </h1>
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {theme === 'dark' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              Dark
            </>
          )}
        </button>
      </header>

      <main className="relative flex-1 flex flex-col items-center px-4 pt-12 pb-24 gap-6">
        <div className="text-center space-y-1 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-600 dark:text-gray-400">
            Audit any website
          </h2>
        </div>

        <ScanForm onSubmit={submit} isLoading={isLoading} />

        {showProgress && <ScanProgress scan={scan} />}

        {error && (
          <p role="alert" className="text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        {showResults ? (
          <ScanResults scan={scan} />
        ) : (
          !isLoading && <ScoreDashboard />
        )}
      </main>
    </div>
  );
}
