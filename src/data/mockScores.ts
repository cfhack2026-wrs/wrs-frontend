export interface Subcategory {
  name: string;
  passed: boolean;
}

export interface Category {
  id: string;
  name: string;
  score: number;
  subcategories: Subcategory[];
}

export const mockCategories: Category[] = [
  {
    id: 'accessibility',
    name: 'Accessibility',
    score: 92,
    subcategories: [
      { name: 'Alt text for images', passed: true },
      { name: 'ARIA labels present', passed: true },
      { name: 'Color contrast (WCAG AA)', passed: false },
      { name: 'Keyboard navigation', passed: true },
      { name: 'Focus indicators', passed: true },
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    score: 54,
    subcategories: [
      { name: 'Carbon footprint estimate', passed: false },
      { name: 'Caching headers set', passed: true },
      { name: 'Image optimization', passed: false },
      { name: 'Minimal JS payload', passed: true },
      { name: 'Font subsetting', passed: false },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    score: 78,
    subcategories: [
      { name: 'Time to first byte', passed: true },
      { name: 'Core Web Vitals', passed: false },
      { name: 'Asset compression', passed: true },
      { name: 'Render-blocking resources', passed: false },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    score: 38,
    subcategories: [
      { name: 'HTTPS enforced', passed: true },
      { name: 'Security headers', passed: false },
      { name: 'Mixed content', passed: false },
      { name: 'Secure cookie flags', passed: false },
    ],
  },
  {
    id: 'seo',
    name: 'SEO',
    score: 85,
    subcategories: [
      { name: 'Meta description present', passed: true },
      { name: 'Canonical URL set', passed: true },
      { name: 'Structured data', passed: false },
      { name: 'Sitemap found', passed: true },
    ],
  },
  {
    id: 'code-quality',
    name: 'Code Quality',
    score: 61,
    subcategories: [
      { name: 'Valid HTML', passed: false },
      { name: 'No console errors', passed: true },
      { name: 'Deprecated APIs', passed: false },
      { name: 'Doctype declared', passed: true },
    ],
  },
];
