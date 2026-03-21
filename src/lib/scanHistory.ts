const KEY = 'wrs:scan-ids';
const MAX = 10;

export function getScanIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addScanId(id: string): void {
  const ids = [id, ...getScanIds().filter((x) => x !== id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(ids));
}
