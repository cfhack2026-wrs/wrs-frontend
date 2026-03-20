import { useState, type FormEvent } from 'react';

interface ScanFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function ScanForm({ onSubmit, isLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      onSubmit(normalized);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl" aria-label="Scan a website">
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
        Website URL
      </label>
      <div className="flex gap-3">
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={isLoading}
          className="flex-1 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 px-5 py-4 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/30 transition disabled:opacity-50"
          aria-label="Enter the URL to scan"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 text-lg font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950"
        >
          {isLoading ? 'Scanning…' : 'Scan'}
        </button>
      </div>
    </form>
  );
}
