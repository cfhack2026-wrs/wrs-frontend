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
      onSubmit(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl" aria-label="Scan a website">
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">
        Website URL
      </label>
      <div className="flex gap-3">
        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={isLoading}
          className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition disabled:opacity-50"
          aria-label="Enter the URL to scan"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          {isLoading ? 'Scanning…' : 'Scan'}
        </button>
      </div>
    </form>
  );
}
