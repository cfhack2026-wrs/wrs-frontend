import type { Scan } from '../types/scanner';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

function httpError(response: Response, body: Record<string, unknown>): Error {
  if (response.status === 404) return new Error('Scan not found.');
  if (response.status === 422) return new Error(typeof body.message === 'string' ? body.message : 'Invalid URL. Please check and try again.');
  if (response.status >= 500) return new Error('Server error. Please try again later.');
  return new Error(typeof body.message === 'string' ? body.message : `Request failed: ${response.status}`);
}

export async function createScan(url: string): Promise<Scan> {
  const response = await fetch(`${BASE_URL}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw httpError(response, body);
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
    const body = await response.json().catch(() => ({}));
    throw httpError(response, body);
  }

  const { data } = await response.json();
  data.assessments ??= [];
  return data;
}

export async function getScanById(id: string): Promise<Scan> {
  const response = await fetch(`${BASE_URL}/scans/${id}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw httpError(response, body);
  }

  const { data } = await response.json();
  data.assessments ??= [];
  return data;
}
