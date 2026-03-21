import { useCallback, useEffect, useState } from 'react';
import { getRecentScans } from '../api/scanner';
import type { Scan } from '../types/scanner';

export function useRecentScans(): {
  scans: Scan[];
  refresh: () => void;
  isLoading: boolean;
} {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    getRecentScans()
      .then(setScans)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scans, refresh, isLoading };
}
