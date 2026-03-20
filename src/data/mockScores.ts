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
];
