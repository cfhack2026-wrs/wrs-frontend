import { useCallback, useEffect, useRef, useState } from 'react';
import { createScan, getScan } from '../api/scanner';
import type { Scan, ScanStatus } from '../types/scanner';

const TERMINAL_STATUSES: ScanStatus[] = ['completed', 'completed_with_errors', 'failed'];
const POLL_INTERVAL_MS = 2000;

interface UseScanResult {
  scan: Scan | null;
  isLoading: boolean;
  error: string | null;
  submit: (url: string) => Promise<void>;
  reset: () => void;
}

export function useScan(): UseScanResult {
  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const updated = await getScan(id);
        setScan(updated);

        if (TERMINAL_STATUSES.includes(updated.status)) {
          stopPolling();
          setIsLoading(false);
        }
      } catch {
        stopPolling();
        setIsLoading(false);
        setError('Failed to fetch scan status. Please try again.');
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const submit = useCallback(async (url: string) => {
    stopPolling();
    setError(null);
    setScan(null);
    setIsLoading(true);

    try {
      const created = await createScan(url);
      setScan(created);
      poll(created.id);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [poll, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setScan(null);
    setError(null);
    setIsLoading(false);
  }, [stopPolling]);

  return { scan, isLoading, error, submit, reset };
}
