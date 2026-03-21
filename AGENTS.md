# CLAUDE.md — WRS Frontend

Guidance for AI-assisted work in the `wrs-frontend/` React app.

## Target Personas

These five personas represent the primary users of WRS. Use them to guide UI copy, explanation depth, report design, and feature priorities.

| # | Name | Role | Tech level | Key need from WRS |
|---|------|------|------------|-------------------|
| 1 | **Lukas Weber** | Frontend Developer | Intermediate | Actionable, developer-friendly feedback; CLI/API integration; modular/extensible |
| 2 | **Maya Hoffmann** | UX/UI Designer | Low–medium | Non-technical explanations; visual examples; design-related issues (contrast, image weight, fonts); client-shareable reports |
| 3 | **Jonas Richter** | Agency Owner | Medium | Professional, client-ready reports; consistent/repeatable audits; self-hosted, no vendor lock-in |
| 4 | **Dr. Elena Rossi** | Educator | High | Clear issue explanations linked to WCAG/EAA; beginner-friendly; hands-on/experimental |
| 5 | **Sofia Nilsson** | Sustainability Consultant | Medium | Transparent sustainability metrics; impact translated to understandable units (e.g. CO₂); visualizations for presentations |

### How to apply personas in code

- **UI copy & explanations**: Default to plain language (Maya/Jonas/Sofia level). Offer technical detail as secondary/expandable content for Lukas/Elena.
- **Findings**: Always include a plain-English "why this matters" alongside technical details.
- **Reports**: Structure output so it is shareable with non-technical clients (Jonas/Maya) — avoid raw JSON as the only output.
- **Sustainability & accessibility findings**: Treat these as first-class, not footnotes. Sofia and Elena expect them to be prominent and well-explained.
- **WCAG/EAA references**: Link findings to specific standards where relevant (Elena's students need the connection to guidelines).

## Frontend UX Guidelines

- **Accessible** — use semantic HTML elements, ensure keyboard navigability, include ARIA labels where needed, maintain sufficient color contrast (WCAG AA minimum).
- **Interactive** — provide immediate visual feedback: loading states, transitions, hover/focus effects. Avoid dead-feeling static pages.
- **Appealing** — cohesive color palette, consistent spacing scale, clean typography. Prefer purposeful whitespace over clutter.
- **Pretty** — polished details matter: smooth transitions, well-rounded corners, subtle shadows. Every state (empty, loading, error, success) should look intentional.

## Stack

- Vite + React + TypeScript
- Tailwind CSS 4

## Key files

```
src/
├── api/scanner.ts        # createScan() / getScan() — all fetch calls
├── hooks/useScan.ts      # polling logic, state machine
├── types/scanner.ts      # TypeScript types (Scan, Assessment, Finding)
└── components/
    ├── ScanForm.tsx       # URL input + submit
    ├── ScanProgress.tsx   # animated progress bar while running
    ├── ScanResults.tsx    # results layout (issues / passed sections)
    ├── AssessmentCard.tsx # collapsible card per assessment
    └── FindingItem.tsx    # individual finding with details
```

## API

- `POST /api/scans` — body `{ url }`, returns `{ id, status: "pending" }`
- `GET /api/scans/{id}` — returns scan with `assessments[].findings[]`; poll every 2 s until status is `completed`, `completed_with_errors`, or `failed`

The `VITE_API_URL` env var controls the base URL. Copy `.env.example` to `.env` and point it at the DDEV app URL (`ddev describe`).
