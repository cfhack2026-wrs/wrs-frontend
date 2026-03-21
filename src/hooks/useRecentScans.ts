import { useCallback, useEffect, useState } from 'react';
import { getScanById } from '../api/scanner';
import { getScanIds } from '../lib/scanHistory';
import type { Scan } from '../types/scanner';

export function useRecentScans(): {
  scans: Scan[];
  refresh: () => void;
  isLoading: boolean;
} {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    const ids = getScanIds();
    if (ids.length === 0) {
      setScans([]);
      return;
    }
    setIsLoading(true);
    Promise.all(ids.map((id) => getScanById(id).catch(() => null)))
      .then((results) => setScans(results.filter((s): s is Scan => s !== null)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scans, refresh, isLoading };
}
