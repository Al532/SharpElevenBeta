import type { ChartDocument, ChartMetadata, ChartSourceRef } from '../../core/types/contracts';

export const CHART_CONTENT_HASH_VERSION = 'chart-document-fingerprint-v1';

export function slugifyChartValue(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeChartTextKey(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeHashableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeHashableValue);
  if (!value || typeof value !== 'object') return value;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  return Object.fromEntries(entries.map(([key, entryValue]) => [key, normalizeHashableValue(entryValue)]));
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeHashableValue(value));
}

async function digestSha256(value: string): Promise<string> {
  const cryptoApi = globalThis.crypto;
  const subtle = cryptoApi?.subtle;
  if (subtle && typeof TextEncoder !== 'undefined') {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function createChartFingerprintPayload(document: ChartDocument): Record<string, unknown> {
  const metadata = (document?.metadata || {}) as Partial<ChartMetadata>;
  return {
    schemaVersion: document?.schemaVersion || '',
    metadata: {
      titleKey: normalizeChartTextKey(metadata.title),
      composerKey: normalizeChartTextKey(metadata.composer),
      sourceKey: metadata.sourceKey || '',
      primaryTimeSignature: metadata.primaryTimeSignature || '',
      timeSignatures: Array.isArray(metadata.timeSignatures) ? metadata.timeSignatures : [],
      barCount: Number(metadata.barCount || document?.bars?.length || 0)
    },
    sections: (document?.sections || []).map((section) => ({
      label: section.label || '',
      occurrence: section.occurrence || 0,
      barIds: section.barIds || []
    })),
    bars: (document?.bars || []).map((bar) => ({
      index: bar.index,
      sectionLabel: bar.sectionLabel || '',
      timeSignature: bar.timeSignature || null,
      endings: bar.endings || [],
      flags: bar.flags || [],
      directives: bar.directives || [],
      comments: bar.comments || [],
      sourceEvent: bar.sourceEvent || null,
      repeatedFromBar: bar.repeatedFromBar || null,
      specialEvents: bar.specialEvents || [],
      annotationMisc: bar.annotationMisc || [],
      spacerCount: bar.spacerCount || 0,
      chordSizes: bar.chordSizes || [],
      notation: bar.notation || null,
      playback: bar.playback || null
    })),
    layout: document?.layout || null
  };
}

export async function computeChartContentHash(document: ChartDocument): Promise<string> {
  return `sha256:${await digestSha256(stableStringify(createChartFingerprintPayload(document)))}`;
}

function normalizeSourceRef(ref: unknown): ChartSourceRef | null {
  if (!ref || typeof ref !== 'object') return null;
  const rawRef = ref as Record<string, unknown>;
  const name = String(rawRef.name || rawRef.playlistName || rawRef.sourceFile || '').trim();
  if (!name) return null;
  const songIndex = Number(rawRef.songIndex || 0);
  return {
    ...rawRef,
    type: String(rawRef.type || 'unknown'),
    name,
    ...(Number.isFinite(songIndex) && songIndex > 0 ? { songIndex } : {})
  } as ChartSourceRef;
}

function getSourceRefKey(ref: ChartSourceRef): string {
  return [
    normalizeChartTextKey(ref.type),
    normalizeChartTextKey(ref.name),
    normalizeChartTextKey(ref.sourceFile),
    Number(ref.songIndex || 0),
    normalizeChartTextKey(ref.importedTitle),
    normalizeChartTextKey(ref.importedComposer)
  ].join('|');
}

export function mergeChartSourceRefs(
  existingRefs: unknown[] = [],
  incomingRefs: unknown[] = []
): ChartSourceRef[] {
  const refsByKey = new Map<string, ChartSourceRef>();
  for (const rawRef of [...existingRefs, ...incomingRefs]) {
    const ref = normalizeSourceRef(rawRef);
    if (!ref) continue;
    refsByKey.set(getSourceRefKey(ref), ref);
  }
  return [...refsByKey.values()];
}

export function getChartSourceRefs(document: ChartDocument | null | undefined): ChartSourceRef[] {
  const source = document?.source || {};
  const existingRefs = Array.isArray(source.sourceRefs) ? source.sourceRefs : [];
  const fallbackName = String(source.playlistName || source.sourceFile || '').trim();
  const fallbackRef = fallbackName
    ? [{
        type: String(source.type || 'ireal-source'),
        name: fallbackName,
        sourceFile: String(source.sourceFile || ''),
        songIndex: Number(source.songIndex || 0),
        importedTitle: String(document?.metadata?.title || ''),
        importedComposer: String(document?.metadata?.composer || ''),
        importedAt: String(source.importedAt || '')
      }]
    : [];
  return mergeChartSourceRefs(existingRefs, fallbackRef);
}

function createImportedSourceRefs(document: ChartDocument): ChartSourceRef[] {
  const source = document.source || {};
  const playlistName = String(source.playlistName || '').trim();
  const sourceFile = String(source.sourceFile || '').trim();
  const isLink = sourceFile.toLowerCase().includes('link') || sourceFile.toLowerCase().includes('pasted');
  const name = playlistName || sourceFile || 'Imported chart';
  return mergeChartSourceRefs(getChartSourceRefs(document), [{
    type: isLink ? 'ireal-link' : playlistName ? 'ireal-bundle' : String(source.type || 'ireal-source'),
    name,
    sourceFile,
    songIndex: Number(source.songIndex || 0),
    importedTitle: String(document.metadata?.title || ''),
    importedComposer: String(document.metadata?.composer || ''),
    importedAt: String(source.importedAt || '')
  }]);
}

export async function normalizeChartLibraryDocument(
  document: ChartDocument,
  { origin = 'imported' }: { origin?: 'imported' | 'user' | string } = {}
): Promise<ChartDocument> {
  const metadata = (document.metadata || {}) as Partial<ChartMetadata>;
  const resolvedOrigin = String(metadata.origin || origin || 'imported');
  const sourceRefs = resolvedOrigin === 'imported' ? createImportedSourceRefs(document) : [];
  const contentHash = String(metadata.contentHash || '') && metadata.contentHashVersion === CHART_CONTENT_HASH_VERSION
    ? String(metadata.contentHash)
    : await computeChartContentHash(document);
  return {
    ...document,
    metadata: {
      ...metadata,
      id: String(metadata.id || ''),
      title: String(metadata.title || ''),
      origin: resolvedOrigin,
      contentHash,
      contentHashVersion: CHART_CONTENT_HASH_VERSION,
      titleKey: normalizeChartTextKey(metadata.title),
      composerKey: normalizeChartTextKey(metadata.composer),
      userTags: Array.isArray(metadata.userTags)
        ? metadata.userTags.map((tag) => String(tag || '').trim()).filter(Boolean)
        : []
    },
    source: {
      ...(document.source || {}),
      sourceRefs,
      ...(sourceRefs[0]?.name ? { playlistName: sourceRefs[0].name } : {})
    }
  };
}

async function normalizeImportedDocuments(documents: ChartDocument[]): Promise<ChartDocument[]> {
  return Promise.all(documents.map((document) => normalizeChartLibraryDocument(document, { origin: 'imported' })));
}

function mergeDuplicateImportedDocuments(documents: ChartDocument[]): ChartDocument[] {
  const documentsByHash = new Map<string, ChartDocument>();
  const mergedDocuments: ChartDocument[] = [];
  for (const document of documents) {
    const hashKey = `${document.metadata?.contentHashVersion || ''}:${document.metadata?.contentHash || ''}`;
    if (!document.metadata?.contentHash || document.metadata?.origin === 'user' || !hashKey.trim()) {
      mergedDocuments.push(document);
      continue;
    }
    const existing = documentsByHash.get(hashKey);
    if (!existing) {
      documentsByHash.set(hashKey, document);
      mergedDocuments.push(document);
      continue;
    }
    existing.source = {
      ...(existing.source || {}),
      sourceRefs: mergeChartSourceRefs(getChartSourceRefs(existing), getChartSourceRefs(document))
    };
  }
  return mergedDocuments;
}

export function extractIRealLinks(rawText: string): string[] {
  const matches = [...String(rawText || '').matchAll(/irealb(?:ook)?:\/\/[^"'\s<]+/gi)].map((match) => match[0]);
  return [...new Set(matches)];
}

export function dedupeAndTagImportedDocuments(documents: ChartDocument[]): ChartDocument[] {
  const seenIds = new Map<string, number>();

  return documents.map((document) => {
    const playlistName = String(document?.source?.playlistName || '').trim();
    const baseId = String(document?.metadata?.id || 'chart');
    const playlistSlug = slugifyChartValue(playlistName) || 'playlist';
    const sourceIndex = Number(document?.source?.songIndex || 0);
    const occurrence = (seenIds.get(baseId) || 0) + 1;
    seenIds.set(baseId, occurrence);
    const uniqueId = `${baseId}-${playlistSlug}-${sourceIndex || occurrence}-${occurrence}`;

    return {
      ...document,
      metadata: {
        ...document.metadata,
        id: uniqueId
      },
      source: {
        ...document.source,
        playlistName
      }
    };
  });
}

export async function importDocumentsFromIRealText({
  rawText,
  sourceFile = '',
  importDocuments
}: {
  rawText?: string;
  sourceFile?: string;
  importDocuments?: (options: { rawText: string; sourceFile: string }) => Promise<ChartDocument[]>;
} = {}): Promise<ChartDocument[]> {
  const links = extractIRealLinks(rawText || '');
  const sources = links.length > 0 ? links : [String(rawText || '')];
  const importedDocuments: ChartDocument[] = [];

  for (let index = 0; index < sources.length; index += 1) {
    const sourceText = sources[index];
    const sourceLabel = links.length > 0 ? `${sourceFile || 'ireal-backup'}#${index + 1}` : sourceFile;
    const documents = await importDocuments?.({
      rawText: sourceText,
      sourceFile: sourceLabel
    }) || [];
    importedDocuments.push(...documents);
  }

  const taggedDocuments = await normalizeImportedDocuments(dedupeAndTagImportedDocuments(importedDocuments));

  return mergeDuplicateImportedDocuments(taggedDocuments)
    .sort((left, right) => {
      const titleComparison = String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' });
      if (titleComparison !== 0) return titleComparison;
      const playlistComparison = String(left.source?.playlistName || '').localeCompare(String(right.source?.playlistName || ''), 'en', { sensitivity: 'base' });
      if (playlistComparison !== 0) return playlistComparison;
      return Number(left.source?.songIndex || 0) - Number(right.source?.songIndex || 0);
    });
}

export function filterChartDocuments(documents: ChartDocument[] = [], query = ''): ChartDocument[] {
  const normalizedQuery = normalizeChartTextKey(query);
  if (!normalizedQuery) return [...documents];

  return documents.filter((document) => {
    return getChartSearchText(document).includes(normalizedQuery);
  }).sort((left, right) => scoreChartSearchResult(right, normalizedQuery) - scoreChartSearchResult(left, normalizedQuery)
    || String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' }));
}

export function getChartSearchText(document: ChartDocument): string {
  const metadata = (document.metadata || {}) as Partial<ChartMetadata>;
  const sourceRefs = getChartSourceRefs(document);
  return [
    metadata.title,
    metadata.titleKey,
    metadata.composer,
    metadata.composerKey,
    metadata.style,
    metadata.styleReference,
    metadata.canonicalGroove,
    metadata.grooveReference,
    ...(Array.isArray(metadata.userTags) ? metadata.userTags : []),
    ...sourceRefs.flatMap((ref) => [ref.name, ref.sourceFile])
  ].map(normalizeChartTextKey).filter(Boolean).join(' ');
}

export function scoreChartSearchResult(document: ChartDocument, normalizedQuery: string): number {
  const metadata = (document.metadata || {}) as Partial<ChartMetadata>;
  const titleKey = normalizeChartTextKey(metadata.titleKey || metadata.title);
  const composerKey = normalizeChartTextKey(metadata.composerKey || metadata.composer);
  const styleKey = normalizeChartTextKey(metadata.styleReference || metadata.style || metadata.canonicalGroove);
  const tagsKey = (Array.isArray(metadata.userTags) ? metadata.userTags : []).map(normalizeChartTextKey).join(' ');
  const sourceKey = getChartSourceRefs(document).map((ref) => normalizeChartTextKey(ref.name)).join(' ');
  if (titleKey === normalizedQuery) return 1000;
  if (titleKey.startsWith(normalizedQuery)) return 800;
  if (titleKey.includes(normalizedQuery)) return 600;
  if (composerKey.includes(normalizedQuery)) return 400;
  if (styleKey.includes(normalizedQuery)) return 300;
  if (tagsKey.includes(normalizedQuery)) return 250;
  if (sourceKey.includes(normalizedQuery)) return 150;
  return 0;
}

export type RemoveChartSourceResult = {
  documents: ChartDocument[];
  removedChartCount: number;
  updatedChartCount: number;
  ignoredUserChartCount: number;
};

export function removeChartSourceFromDocuments(
  documents: ChartDocument[] = [],
  sourceName: string
): RemoveChartSourceResult {
  const normalizedSourceName = normalizeChartTextKey(sourceName);
  const nextDocuments: ChartDocument[] = [];
  let removedChartCount = 0;
  let updatedChartCount = 0;
  let ignoredUserChartCount = 0;

  for (const document of documents) {
    if (document.metadata?.origin === 'user') {
      ignoredUserChartCount += 1;
      nextDocuments.push(document);
      continue;
    }
    const sourceRefs = getChartSourceRefs(document);
    const nextSourceRefs = sourceRefs.filter((ref) => normalizeChartTextKey(ref.name) !== normalizedSourceName);
    if (nextSourceRefs.length === sourceRefs.length) {
      nextDocuments.push(document);
      continue;
    }
    if (nextSourceRefs.length === 0) {
      removedChartCount += 1;
      continue;
    }
    updatedChartCount += 1;
    nextDocuments.push({
      ...document,
      source: {
        ...(document.source || {}),
        sourceRefs: nextSourceRefs,
        playlistName: nextSourceRefs[0]?.name || ''
      }
    });
  }

  return {
    documents: nextDocuments,
    removedChartCount,
    updatedChartCount,
    ignoredUserChartCount
  };
}
