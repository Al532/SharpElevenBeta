import type { ChartDocument } from '../../core/types/contracts.js';

const CHART_LIBRARY_SUBSET_SESSION_KEY = 'sharp-eleven-chart-library-subset-session-v1';

export type ChartLibrarySubsetSession = {
  version: 1;
  source: string;
  chartIds: string[];
  savedAt: number;
};

function getSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function writeChartLibrarySubsetSession({
  documents = [],
  source = 'Library selection'
}: {
  documents?: ChartDocument[];
  source?: string;
} = {}): void {
  const chartIds = documents
    .map((document) => String(document.metadata?.id || '').trim())
    .filter(Boolean);
  const storage = getSessionStorage();
  if (!storage || chartIds.length === 0) return;
  const session: ChartLibrarySubsetSession = {
    version: 1,
    source: String(source || 'Library selection').trim() || 'Library selection',
    chartIds,
    savedAt: Date.now()
  };
  try {
    storage.setItem(CHART_LIBRARY_SUBSET_SESSION_KEY, JSON.stringify(session));
  } catch {
    // This cache only scopes navigation from Library; full library loading remains the fallback.
  }
}

export function readChartLibrarySubsetSession(): ChartLibrarySubsetSession | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const rawSession = storage.getItem(CHART_LIBRARY_SUBSET_SESSION_KEY);
    if (!rawSession) return null;
    const parsed = JSON.parse(rawSession) as Partial<ChartLibrarySubsetSession>;
    const chartIds = Array.isArray(parsed.chartIds)
      ? parsed.chartIds.map((id) => String(id || '').trim()).filter(Boolean)
      : [];
    if (parsed.version !== 1 || chartIds.length === 0) return null;
    return {
      version: 1,
      source: String(parsed.source || 'Library selection').trim() || 'Library selection',
      chartIds,
      savedAt: Number(parsed.savedAt || 0)
    };
  } catch {
    return null;
  }
}
