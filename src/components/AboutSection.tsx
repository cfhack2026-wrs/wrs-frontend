export function AboutSection() {
  return (
    <div className="flex flex-col items-center gap-10 max-w-3xl w-full">

      {/* Intro */}
      <div className="text-center space-y-4 animate-fade-up">
        <p className="mono text-xs uppercase tracking-widest" style={{ color: 'var(--cyan)', letterSpacing: '0.15em' }}>
          About this project
        </p>
        <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Website Responsibility Scanner helps people understand how responsible a website really is.
          It brings together accessibility and sustainability in one place and turns them into something
          easier to explore, understand, and improve.
        </p>
      </div>

      {/* Current focus areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-fade-up">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">♿</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Accessibility</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Highlights barriers that may make websites harder to use for many people. Based on established
            web accessibility principles and automated checks that help identify common issues.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">🌱</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Sustainability</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Shows how website choices such as large pages, unoptimized assets, or unnecessary scripts
            can increase digital weight and resource use.
          </p>
        </div>
      </div>

      {/* Why it exists */}
      <div className="w-full rounded-2xl p-6 border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>Why it exists</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Many existing tools are either highly technical, limited to one area, closed source, or difficult
          to understand without specialist knowledge. Website Responsibility Scanner exists to make responsible
          website checks more open, more understandable, and more practical. It treats accessibility and
          sustainability as connected parts of better web development — in many cases, clearer structure,
          lighter pages, and more thoughtful design decisions can improve both.
        </p>
      </div>

      {/* Current status */}
      <div className="w-full animate-fade-up">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>Current status</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
          Website Responsibility Scanner is currently in an early MVP stage. The current focus is on building
          a foundation that can scan a website through a simple interface, report on accessibility and
          sustainability, explain findings in plain language, and remain open source and self-hostable.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The longer term direction is modular. New checks and additional topic areas are planned over time,
          so the project can grow well beyond its current starting point.
        </p>
      </div>

      {/* What makes it different */}
      <div className="w-full rounded-2xl p-6 border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-base)' }}>What makes it different</h2>
        <ul className="space-y-3">
          {[
            'Explains findings in plain language, not just technical warnings',
            'Makes next steps easier to understand — not only a score',
            'Transparent about what automated checks can and cannot do',
            'Modular by design — built to grow beyond accessibility and sustainability',
            'Open source and self-hostable',
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

      {/* How it approaches responsibility */}
      <div className="w-full rounded-2xl p-6 border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>How it approaches responsibility</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
          Website Responsibility Scanner is not meant to reduce website quality to a single score. Some issues
          can be detected automatically. Others still need human review, context, and judgement — this is
          especially true for accessibility, where automated testing can support the process but cannot
          replace real evaluation.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          That is why the project aims to be helpful, transparent, and realistic about what automated
          checks can and cannot do.
        </p>
      </div>

      {/* Who it is for */}
      <div className="w-full animate-fade-up">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-base)' }}>Who it is for</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          Website Responsibility Scanner is meant for people who want to improve websites without needing
          to be experts first. That includes freelancers, small agencies, non-profits, community projects,
          website owners, content teams, designers, developers, accessibility advocates, and
          sustainability-minded teams.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          It is also relevant for anyone who wants a clearer, more practical way to understand how a website
          performs beyond speed or SEO alone.
        </p>
      </div>

      {/* Open source by design */}
      <div
        className="w-full rounded-2xl p-6 border animate-fade-up"
        style={{ background: 'rgba(6,182,212,0.04)', borderColor: 'rgba(6,182,212,0.2)' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>Open source by design</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          Openness makes it easier to inspect how the tool works, contribute improvements, adapt it to
          different needs, and self-host it if required. Accessibility and sustainability are the starting
          point, not the final scope. The project is built to grow with additional areas of website
          responsibility over time — and because it is open source, that growth is not limited to one team.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Anyone is welcome to support the project, contribute ideas, improve existing checks, add new areas,
          or adapt the tool for their own needs.
        </p>
      </div>

      {/* Looking ahead */}
      <div className="w-full animate-fade-up">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-base)' }}>Looking ahead</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Website Responsibility Scanner starts with accessibility and sustainability, but it is built to
          grow beyond both. The project is intended to become a flexible foundation for broader website
          responsibility over time, while staying understandable and useful for non-technical audiences.
          As an open source project, it can continue to evolve through shared ideas, contributions, and
          adaptations by the people who use it. At its core, it is about making responsible websites
          easier to understand and easier to improve.
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-4 animate-fade-up"
        style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          A CloudFest Hackathon 2026 project
        </span>
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
  );
}
