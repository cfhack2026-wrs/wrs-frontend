import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import logoHorizontalDark from '/logo_horizontal_dark.png';
import logoHorizontalLight from '/logo_horizontal_light.png';

export function AboutPage() {
  const { theme } = useTheme();

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-16 pb-24 gap-10 max-w-3xl mx-auto w-full">

      {/* Hero */}
      <div className="text-center space-y-4 animate-fade-up">
        <img
          src={theme === 'dark' ? logoHorizontalDark : logoHorizontalLight}
          alt="Website Responsibility Scanner"
          className="h-12 w-auto mx-auto"
        />
        <p className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--cyan)', letterSpacing: '0.15em' }}>
          Über diesen Scanner
        </p>
        <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Ein verantwortungsvolles Web sollte für alle zugänglich sein – und niemanden einen Arm und ein Bein kosten.
          Der WRS macht Nachhaltigkeits- und Barrierefreiheitsprüfungen einfach, transparent und umsetzbar.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-fade-up">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">🌱</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Nachhaltigkeit</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Seitengewicht, Bild- &amp; Script-Optimierung, Caching und Green-Hosting-Checks –
            um den CO₂-Fußabdruck deiner Website zu reduzieren.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">♿</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Barrierefreiheit</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            WCAG-Konformitätsprüfungen, damit deine Website für alle funktioniert – auch für Menschen mit
            Behinderungen – und die EAA-Anforderungen erfüllt.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">⚡</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Performance</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Core Web Vitals, Ladezeiten und Rendering-Metriken, die direkt die Nutzererfahrung
            und das Suchmaschinen-Ranking beeinflussen.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">🔒</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Sicherheit</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            HTTP-Sicherheits-Header, HTTPS-Konfiguration und grundlegende Schwachstellen –
            für eine sichere Grundlage.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="w-full rounded-2xl p-6 border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-base)' }}>Was den WRS auszeichnet</h2>
        <ul className="space-y-3">
          {[
            'Klare, verständliche Erklärungen zu jedem gefundenen Problem',
            'Konkrete Lösungshinweise – nicht nur eine Punktzahl',
            'Modulare Architektur: eigene Checks hinzufügbar',
            'Self-hostable und 100 % Open Source',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--cyan)' }} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 animate-fade-up"
        style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Ein CloudFest 2026 Hackathon-Projekt
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/cfhack2026-wrs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 rounded"
            style={{ color: 'var(--cyan)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
          <Link
            to="/"
            className="text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            Zurück zum Scanner
          </Link>
        </div>
      </div>
    </main>
  );
}
