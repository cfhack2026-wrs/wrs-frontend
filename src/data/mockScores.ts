export interface Subcategory {
  name: string;
  passed: boolean;
  fixSuggestion?: string;
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
      {
        name: 'Color contrast (WCAG AA)',
        passed: false,
        fixSuggestion: 'Ensure a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Use a tool like the WebAIM Contrast Checker to verify your foreground/background color combinations.',
      },
      { name: 'Keyboard navigation', passed: true },
      { name: 'Focus indicators', passed: true },
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    score: 54,
    subcategories: [
      {
        name: 'Carbon footprint estimate',
        passed: false,
        fixSuggestion: 'Reduce page weight by eliminating unused CSS/JS, compressing assets, and choosing a green hosting provider. Tools like Website Carbon Calculator can help benchmark your footprint.',
      },
      { name: 'Caching headers set', passed: true },
      {
        name: 'Image optimization',
        passed: false,
        fixSuggestion: 'Serve images in modern formats (WebP or AVIF), apply lossy compression, and use responsive `srcset` attributes so browsers only download the size they need.',
      },
      { name: 'Minimal JS payload', passed: true },
      {
        name: 'Font subsetting',
        passed: false,
        fixSuggestion: 'Use the `unicode-range` descriptor and request only the character subsets your content actually uses. Consider system fonts or variable fonts to reduce the number of font files loaded.',
      },
    ],
  },
];
