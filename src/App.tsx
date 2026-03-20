import { useScan } from './hooks/useScan';
import { ScanForm } from './components/ScanForm';
import { ScanProgress } from './components/ScanProgress';
import { ScanResults } from './components/ScanResults';

const TERMINAL_STATUSES = ['completed', 'completed_with_errors', 'failed'];

export default function App() {
  const { scan, isLoading, error, submit, reset } = useScan();

  const showResults = scan !== null && TERMINAL_STATUSES.includes(scan.status);
  const showProgress = scan !== null && !showResults;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Website Responsibility Scanner
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-16 gap-8">
        {!showResults && (
          <>
            <div className="text-center space-y-2 max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight">
                Audit any website
              </h2>
              <p className="text-gray-400">
                Check for accessibility, performance, security, SEO, and code quality issues.
              </p>
            </div>

            <ScanForm onSubmit={submit} isLoading={isLoading} />

            {showProgress && <ScanProgress scan={scan} />}

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
          </>
        )}

        {showResults && (
          <ScanResults scan={scan} onReset={reset} />
        )}
      </main>
    </div>
  );
}
