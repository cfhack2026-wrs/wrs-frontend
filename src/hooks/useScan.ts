import { useCallback, useEffect, useRef, useState } from 'react';
import { createScan, getScan, getScanById } from '../api/scanner';
import { addScanId } from '../lib/scanHistory';
import { TERMINAL_STATUSES } from '../types/scanner';
import type { Scan } from '../types/scanner';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_FAILURES = 3;

interface UseScanResult {
  scan: Scan | null;
  isLoading: boolean;
  error: string | null;
  submit: (url: string) => Promise<void>;
  selectScan: (scan: Scan) => Promise<void>;
  reset: () => void;
}

export function useScan(initialId?: string): UseScanResult {
  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback((monitorUrl: string) => {
    failCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      try {
        const updated = await getScan(monitorUrl);
        failCountRef.current = 0;
        setScan(updated);

        if (TERMINAL_STATUSES.includes(updated.status)) {
          stopPolling();
          setIsLoading(false);
        }
      } catch {
        failCountRef.current += 1;
        if (failCountRef.current >= MAX_POLL_FAILURES) {
          stopPolling();
          setIsLoading(false);
          setError('Failed to fetch scan status. Please try again.');
        }
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => {
    if (initialId) {
      setIsLoading(true);
      getScanById(initialId)
        .then((data) => {
          setScan(data);
          if (!TERMINAL_STATUSES.includes(data.status)) {
            poll(data.monitor);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load scan results.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialId, poll, stopPolling]);

  const submit = useCallback(async (url: string) => {
    stopPolling();
    setError(null);
    setScan(null);
    setIsLoading(true);

    try {
      const created = await createScan(url);
      addScanId(created.id);
      setScan(created);
      poll(created.monitor);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, [poll, stopPolling]);

  const selectScan = useCallback(async (selected: Scan) => {
    stopPolling();
    setError(null);
    setIsLoading(true);
    setScan(selected);
    try {
      const full = await getScanById(selected.id);
      setScan(full);
      if (!TERMINAL_STATUSES.includes(full.status)) {
        poll(full.monitor);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scan.');
    } finally {
      setIsLoading(false);
    }
  }, [stopPolling, poll]);

  const reset = useCallback(() => {
    stopPolling();
    setScan(null);
    setError(null);
    setIsLoading(false);
  }, [stopPolling]);

  return { scan, isLoading, error, submit, selectScan, reset };
}
