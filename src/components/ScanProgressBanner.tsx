export function ScanProgressBanner() {
  return (
    <div role="status" aria-live="polite" className="w-full max-w-4xl">
      <div className="rounded-xl border border-indigo-200/50 dark:border-indigo-500/20
                      bg-indigo-50/50 dark:bg-indigo-500/10 px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          Scanning — more checks in progress…
        </p>
        <div className="h-1 w-full rounded-full bg-indigo-200 dark:bg-indigo-800 overflow-hidden">
          <div className="h-full w-full rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
