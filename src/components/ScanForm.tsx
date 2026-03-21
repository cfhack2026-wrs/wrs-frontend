import { useState, useMemo, type FormEvent } from 'react';

interface ScanFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const EXAMPLE_SITES = [
  'wikipedia.org', 'github.com', 'stackoverflow.com', 'bbc.com', 'nytimes.com',
  'theguardian.com', 'mozilla.org', 'w3.org', 'smashingmagazine.com', 'css-tricks.com',
  'web.dev', 'a11yproject.com', 'eff.org', 'archive.org', 'wordpress.org',
  'drupal.org', 'mit.edu', 'europa.eu', 'gov.uk', 'canada.ca',
  'who.int', 'nature.com', 'medium.com', 'dev.to', 'netlify.com',
  'vercel.com', 'cloudflare.com', 'fastly.com', 'shopify.com', 'stripe.com',
];

function isValidUrl(value: string): boolean {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const { hostname } = new URL(withScheme);
    const parts = hostname.split('.');
    return parts.length >= 2 && parts.every((p) => p.length > 0);
  } catch {
    return false;
  }
}

function normalize(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function ScanForm({ onSubmit, isLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  // Duplicate for seamless loop
  const ticker = useMemo(() => [...EXAMPLE_SITES, ...EXAMPLE_SITES], []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setError('Enter a valid URL — e.g. example.com or https://example.com');
      return;
    }
    setError('');
    onSubmit(normalize(trimmed));
  }

  function handleChange(value: string) {
    setUrl(value);
    if (error) setError('');
  }

  function handleExample(site: string) {
    const full = `https://${site}`;
    setUrl(full);
    setError('');
    onSubmit(full);
  }

  return (
    <div className="w-full max-w-2xl animate-fade-up delay-200">
      <form onSubmit={handleSubmit} aria-label="Scan a website">
        {/* Label */}
        <label
          htmlFor="url-input"
          className="block mono text-xs tracking-widest uppercase mb-3"
          style={{ color: 'var(--accent-text)', letterSpacing: '0.12em' }}
        >
          Target URL
        </label>

        {/* Input row */}
        <div className="flex gap-3">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="https://example.com"
            disabled={isLoading}
            aria-describedby={error ? 'url-error' : undefined}
            aria-invalid={!!error}
            className={`scan-input flex-1${error ? ' error' : ''}`}
          />
          <button type="submit" disabled={isLoading || !url.trim()} className="scan-btn">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Scanning
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                Scan
              </span>
            )}
          </button>
        </div>

        {/* Validation error */}
        {error && (
          <p
            id="url-error"
            role="alert"
            className="mono mt-2 text-xs"
            style={{ color: 'var(--error-text)' }}
          >
            ⚠ {error}
          </p>
        )}
      </form>

      {/* Ticker */}
      <div className="mt-6 text-center">
        <p
          className="mono text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-dim)', letterSpacing: '0.14em' }}
        >
          or try one of these
        </p>

        {/* Fade mask wrapper — clips scroll but not hover scale */}
        <div
          className="relative"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          {/* Inner overflow clip so content doesn't bleed sideways before masking */}
          <div
            className="overflow-hidden py-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); setHoveredSite(null); }}
          >
            <div
              className="flex gap-2 w-max"
              style={{
                animation: 'ticker-scroll 120s linear infinite',
                animationPlayState: paused ? 'paused' : 'running',
              }}
            >
            {ticker.map((site, i) => (
              <button
                key={`${site}-${i}`}
                type="button"
                disabled={isLoading}
                onClick={() => handleExample(site)}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
                className="example-pill shrink-0"
                style={{
                  opacity: hoveredSite === null ? 1 : hoveredSite === site ? 1 : 0.35,
                  transform: hoveredSite === site ? 'translateY(-2px) scale(1.05)' : undefined,
                  color: hoveredSite === site ? 'var(--cyan)' : undefined,
                  borderColor: hoveredSite === site ? 'var(--border-hi)' : undefined,
                  background: hoveredSite === site ? 'rgba(34,211,238,0.12)' : undefined,
                  transition: 'opacity 0.2s, transform 0.2s, color 0.2s, border-color 0.2s, background 0.2s',
                }}
              >
                {site}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
