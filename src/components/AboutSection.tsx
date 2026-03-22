export function AboutSection() {
  return (
    <div className="flex flex-col items-center gap-8 max-w-3xl w-full">

      {/* Intro */}
      <div className="text-center space-y-3 animate-fade-up">
        <p className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--cyan)', letterSpacing: '0.15em' }}>
          About this project
        </p>
        <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
          One scan, two perspectives. Check any website for accessibility barriers
          and environmental impact — then get clear, actionable steps to improve both.
        </p>
      </div>

      {/* Focus areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-fade-up">
        <div
          className="rounded-2xl p-5 border"
          style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl" aria-hidden="true">♿</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Accessibility</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Automated WCAG checks for contrast, ARIA, keyboard navigation, and more.
            Findings are explained in plain language with fix guidance.
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl" aria-hidden="true">🌱</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Sustainability</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Carbon per visit, page weight, green hosting, and energy breakdown.
            Based on the Sustainable Web Design Model v4.
          </p>
        </div>
      </div>

      {/* Why + differentiators */}
      <div className="w-full rounded-2xl p-5 border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>Why another tool?</h2>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          Most tools are technical, single-purpose, or closed source. This one combines accessibility
          and sustainability in a single open-source interface anyone can understand.
        </p>
        <ul className="space-y-2">
          {[
            'Plain-language findings, not just codes and warnings',
            'Actionable fix guidance for every issue',
            'Transparent about what automation can and cannot catch',
            'Open source and self-hostable',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--cyan)' }} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Status + audience — compact two-column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-fade-up">
        <div className="rounded-2xl p-5 border" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-base)' }}>Status</h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Early MVP. The foundation is working — scan, report, explain, improve.
            More check categories and deeper analysis are coming.
          </p>
        </div>
        <div className="rounded-2xl p-5 border" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-base)' }}>Who it's for</h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Developers, designers, freelancers, agencies, non-profits, content teams —
            anyone who wants to improve a website without needing to be an expert first.
          </p>
        </div>
      </div>

      {/* Open source CTA */}
      <div
        className="w-full rounded-2xl p-5 border animate-fade-up flex items-center gap-4"
        style={{ background: 'rgba(6,182,212,0.04)', borderColor: 'rgba(6,182,212,0.2)' }}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="currentColor" aria-hidden="true" style={{ color: 'var(--cyan)' }}>
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        <div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Open source and built to grow. Contributions, ideas, and adaptations are welcome.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 animate-fade-up"
        style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          A CloudFest Hackathon 2026 project
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://www.gesellschaft-zur-entwicklung-von-dingen.de/de/impressum"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 rounded"
            style={{ color: 'var(--text-dim)' }}
          >
            Impressum
          </a>
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
        </div>
      </div>
    </div>
  );
}
