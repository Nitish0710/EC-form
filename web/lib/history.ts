import type { HistoryEntry } from './types';

const KEY = 'ec-validator-history';
const MAX = 100;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: HistoryEntry): void {
  const history = loadHistory();
  const idx = history.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    history[idx] = entry;
  } else {
    history.unshift(entry);
  }
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)));
}

export function deleteEntry(id: string): void {
  const history = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}
