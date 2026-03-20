export function ScanProgressBanner() {
  return (
    <div role="status" aria-live="polite" className="w-full max-w-4xl">
      <div
        className="rounded-xl px-4 py-3 space-y-2.5"
        style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}
      >
        <p className="mono text-xs" style={{ color: 'var(--cyan)' }}>
          Scanning — more checks in progress…
        </p>
        <div
          className="h-px w-full overflow-hidden relative"
          style={{ background: 'rgba(34,211,238,0.1)' }}
        >
          <div
            className="scan-sweep absolute inset-y-0 w-1/4"
            style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)' }}
          />
        </div>
      </div>
    </div>
  );
}
