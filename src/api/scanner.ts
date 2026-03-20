import type { Scan } from '../types/scanner';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export async function createScan(url: string): Promise<Scan> {
  const response = await fetch(`${BASE_URL}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message ?? `Request failed: ${response.status}`);
  }

  const { data } = await response.json();
  data.assessments ??= [];
  return data;
}

export async function getScan(monitorUrl: string): Promise<Scan> {
  const response = await fetch(monitorUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const { data } = await response.json();
  return data;
}
