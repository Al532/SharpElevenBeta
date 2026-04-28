import type { ChartDocument, ChartMetadata, ChartSetlist, ChartSetlistItem, ChartSourceRef } from '../../core/types/contracts';

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
  if (existingRefs.length > 0) return mergeChartSourceRefs(existingRefs, []);
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
  const existingRefs = Array.isArray(source.sourceRefs) ? source.sourceRefs : [];
  const playlistName = String(source.playlistName || '').trim();
  const sourceFile = String(source.sourceFile || '').trim();
  const isLink = sourceFile.toLowerCase().includes('link') || sourceFile.toLowerCase().includes('pasted');
  const name = playlistName || sourceFile;
  if (!name) return mergeChartSourceRefs(existingRefs, []);
  return mergeChartSourceRefs(existingRefs, [{
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
  document: ChartDocument
): Promise<ChartDocument> {
  const metadata = (document.metadata || {}) as Partial<ChartMetadata> & { origin?: unknown };
  const { origin: _origin, ...metadataWithoutOrigin } = metadata;
  const sourceRefs = createImportedSourceRefs(document);
  const contentHash = String(metadata.contentHash || '') && metadata.contentHashVersion === CHART_CONTENT_HASH_VERSION
    ? String(metadata.contentHash)
    : await computeChartContentHash(document);
  return {
    ...document,
    metadata: {
      ...metadataWithoutOrigin,
      id: String(metadata.id || ''),
      title: String(metadata.title || ''),
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
  return Promise.all(documents.map((document) => normalizeChartLibraryDocument(document)));
}

function mergeDuplicateImportedDocuments(documents: ChartDocument[]): ChartDocument[] {
  const documentsByHash = new Map<string, ChartDocument>();
  const mergedDocuments: ChartDocument[] = [];
  for (const document of documents) {
    const hashKey = `${document.metadata?.contentHashVersion || ''}:${document.metadata?.contentHash || ''}`;
    if (!document.metadata?.contentHash || !hashKey.trim()) {
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
    const sourceRefs = getChartSourceRefs(document);
    if (sourceRefs.length === 0) {
      ignoredUserChartCount += 1;
      nextDocuments.push(document);
      continue;
    }
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

export type ChartLibraryFacetSummary = {
  tags: string[];
  sources: string[];
  styles: string[];
  setlistMembershipByChartId: Map<string, ChartSetlist[]>;
};

export type ChartMetadataPatch = {
  addTags?: string[];
  removeTags?: string[];
  addSetlistIds?: string[];
  removeSetlistIds?: string[];
  createTag?: string;
  createSetlistName?: string;
};

export type BatchMetadataOperation = {
  kind: 'add-tag' | 'remove-tag' | 'add-setlist' | 'remove-setlist' | 'delete';
  tag?: string;
  setlistId?: string;
  activeSourceName?: string;
};

export type BatchOperationPreview = {
  affectedCount: number;
  alreadyHadCount: number;
  skippedCount: number;
  setlistUsageCount: number;
  protectedMultiSourceImportedCount: number;
  deletedChartCount: number;
  sourceRefRemovedCount: number;
  selectedCount: number;
};

export type ProtectedDeletePreview = BatchOperationPreview & {
  protectedChartIds: string[];
  deletedChartIds: string[];
  sourceRefOnlyChartIds: string[];
};

export function normalizeChartTag(value: unknown): string {
  return String(value || '').trim();
}

function normalizeDistinctChartTags(values: unknown[] = []): string[] {
  const tagsByKey = new Map<string, string>();
  for (const value of values) {
    const tag = normalizeChartTag(value);
    if (!tag) continue;
    tagsByKey.set(normalizeChartTextKey(tag), tag);
  }
  return [...tagsByKey.values()].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
}

function chartHasTag(document: ChartDocument, tag: string): boolean {
  const normalizedTag = normalizeChartTextKey(tag);
  return (document.metadata?.userTags || []).some((existingTag) => normalizeChartTextKey(existingTag) === normalizedTag);
}

function chartStyleLabel(document: ChartDocument): string {
  return String(document.metadata?.styleReference || document.metadata?.style || document.metadata?.canonicalGroove || document.metadata?.grooveReference || '').trim();
}

export function listChartLibraryFacets(
  documents: ChartDocument[] = [],
  setlists: ChartSetlist[] = []
): ChartLibraryFacetSummary {
  const tags: string[] = [];
  const sources = new Set<string>();
  const styles = new Set<string>();
  const setlistMembershipByChartId = new Map<string, ChartSetlist[]>();

  for (const document of documents) {
    tags.push(...(document.metadata?.userTags || []));
    for (const ref of getChartSourceRefs(document)) {
      const name = String(ref.name || '').trim();
      if (name) sources.add(name);
    }
    const style = chartStyleLabel(document);
    if (style) styles.add(style);
  }

  for (const setlist of setlists) {
    for (const item of setlist.items || []) {
      const chartId = String(item.chartId || '').trim();
      if (!chartId) continue;
      setlistMembershipByChartId.set(chartId, [
        ...(setlistMembershipByChartId.get(chartId) || []),
        setlist
      ]);
    }
  }

  return {
    tags: normalizeDistinctChartTags(tags),
    sources: [...sources].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' })),
    styles: [...styles].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' })),
    setlistMembershipByChartId
  };
}

export function getChartSetlistMembership(chartId: string, setlists: ChartSetlist[] = []): ChartSetlist[] {
  return setlists.filter((setlist) => setlist.items.some((item) => item.chartId === chartId));
}

export function applyChartTagUpdate(document: ChartDocument, patch: ChartMetadataPatch = {}): ChartDocument {
  const existingTags = document.metadata?.userTags || [];
  const removeKeys = new Set((patch.removeTags || []).map(normalizeChartTextKey));
  const nextTags = normalizeDistinctChartTags([
    ...existingTags.filter((tag) => !removeKeys.has(normalizeChartTextKey(tag))),
    ...(patch.addTags || []),
    patch.createTag || ''
  ]);
  return {
    ...document,
    metadata: {
      ...document.metadata,
      userTags: nextTags
    }
  };
}

function createEmptySetlist(name: string): ChartSetlist {
  const now = new Date().toISOString();
  return {
    id: `setlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name || '').trim() || 'Untitled setlist',
    items: [],
    createdAt: now,
    updatedAt: now
  };
}

export function applyChartSetlistUpdate(
  chartId: string,
  setlists: ChartSetlist[] = [],
  patch: ChartMetadataPatch = {}
): ChartSetlist[] {
  const normalizedChartId = String(chartId || '').trim();
  if (!normalizedChartId) return setlists;
  const now = new Date().toISOString();
  let nextSetlists = [...setlists];
  const createdSetlistName = String(patch.createSetlistName || '').trim();
  let addSetlistIds = [...(patch.addSetlistIds || [])];
  if (createdSetlistName) {
    const createdSetlist = createEmptySetlist(createdSetlistName);
    nextSetlists = [...nextSetlists, createdSetlist];
    addSetlistIds = [...addSetlistIds, createdSetlist.id];
  }
  const addIds = new Set(addSetlistIds.map((id) => String(id || '').trim()).filter(Boolean));
  const removeIds = new Set((patch.removeSetlistIds || []).map((id) => String(id || '').trim()).filter(Boolean));
  return nextSetlists.map((setlist) => {
    const hasChart = setlist.items.some((item) => item.chartId === normalizedChartId);
    if (removeIds.has(setlist.id) && hasChart) {
      return {
        ...setlist,
        items: setlist.items.filter((item) => item.chartId !== normalizedChartId),
        updatedAt: now
      };
    }
    if (addIds.has(setlist.id) && !hasChart) {
      return {
        ...setlist,
        items: [...setlist.items, { chartId: normalizedChartId }],
        updatedAt: now
      };
    }
    return setlist;
  });
}

export function createEmptyChartSetlist(name: string): ChartSetlist {
  return createEmptySetlist(name);
}

export function applyPerChartMetadataUpdate({
  documents = [],
  setlists = [],
  chartId = '',
  patch = {}
}: {
  documents?: ChartDocument[];
  setlists?: ChartSetlist[];
  chartId?: string;
  patch?: ChartMetadataPatch;
}): { documents: ChartDocument[]; setlists: ChartSetlist[] } {
  const nextDocuments = documents.map((document) => document.metadata.id === chartId
    ? applyChartTagUpdate(document, patch)
    : document);
  const nextSetlists = applyChartSetlistUpdate(chartId, setlists, patch);
  return { documents: nextDocuments, setlists: nextSetlists };
}

function getSelectedDocuments(documents: ChartDocument[], chartIds: string[]): ChartDocument[] {
  const selectedIds = new Set(chartIds);
  return documents.filter((document) => selectedIds.has(String(document.metadata?.id || '')));
}

export function previewProtectedChartDelete({
  documents = [],
  setlists = [],
  chartIds = [],
  activeSourceName = ''
}: {
  documents?: ChartDocument[];
  setlists?: ChartSetlist[];
  chartIds?: string[];
  activeSourceName?: string;
}): ProtectedDeletePreview {
  const selectedDocuments = getSelectedDocuments(documents, chartIds);
  const normalizedSourceName = normalizeChartTextKey(activeSourceName);
  const deletedChartIds: string[] = [];
  const protectedChartIds: string[] = [];
  const sourceRefOnlyChartIds: string[] = [];
  let skippedCount = 0;

  for (const document of selectedDocuments) {
    const chartId = String(document.metadata?.id || '');
    const refs = getChartSourceRefs(document);
    if (normalizedSourceName && refs.length === 0) {
      skippedCount += 1;
      continue;
    }
    const matchesActiveSource = normalizedSourceName && refs.some((ref) => normalizeChartTextKey(ref.name) === normalizedSourceName);
    if (normalizedSourceName && matchesActiveSource && refs.length > 1) {
      protectedChartIds.push(chartId);
      sourceRefOnlyChartIds.push(chartId);
      continue;
    }
    deletedChartIds.push(chartId);
  }

  const deletedSet = new Set(deletedChartIds);
  const sourceRefSet = new Set(sourceRefOnlyChartIds);
  const setlistUsageCount = setlists.reduce((count, setlist) => count + setlist.items.filter((item) => deletedSet.has(item.chartId) || sourceRefSet.has(item.chartId)).length, 0);

  return {
    selectedCount: selectedDocuments.length,
    affectedCount: deletedChartIds.length + sourceRefOnlyChartIds.length,
    alreadyHadCount: 0,
    skippedCount,
    setlistUsageCount,
    protectedMultiSourceImportedCount: protectedChartIds.length,
    deletedChartCount: deletedChartIds.length,
    sourceRefRemovedCount: sourceRefOnlyChartIds.length,
    protectedChartIds,
    deletedChartIds,
    sourceRefOnlyChartIds
  };
}

export function applyProtectedChartDelete({
  documents = [],
  setlists = [],
  chartIds = [],
  activeSourceName = ''
}: {
  documents?: ChartDocument[];
  setlists?: ChartSetlist[];
  chartIds?: string[];
  activeSourceName?: string;
}): { documents: ChartDocument[]; setlists: ChartSetlist[]; preview: ProtectedDeletePreview } {
  const preview = previewProtectedChartDelete({ documents, setlists, chartIds, activeSourceName });
  const deletedIds = new Set(preview.deletedChartIds);
  const sourceRefOnlyIds = new Set(preview.sourceRefOnlyChartIds);
  const normalizedSourceName = normalizeChartTextKey(activeSourceName);
  const nextDocuments = documents
    .filter((document) => !deletedIds.has(String(document.metadata?.id || '')))
    .map((document) => {
      if (!sourceRefOnlyIds.has(String(document.metadata?.id || ''))) return document;
      const nextRefs = getChartSourceRefs(document).filter((ref) => normalizeChartTextKey(ref.name) !== normalizedSourceName);
      return {
        ...document,
        source: {
          ...(document.source || {}),
          sourceRefs: nextRefs,
          playlistName: nextRefs[0]?.name || ''
        }
      };
    });
  const nextSetlists = setlists.map((setlist) => ({
    ...setlist,
    items: setlist.items.filter((item) => !deletedIds.has(item.chartId)),
    updatedAt: deletedIds.size ? new Date().toISOString() : setlist.updatedAt
  }));
  return { documents: nextDocuments, setlists: nextSetlists, preview };
}

export function previewBatchMetadataOperation({
  documents = [],
  setlists = [],
  chartIds = [],
  operation
}: {
  documents?: ChartDocument[];
  setlists?: ChartSetlist[];
  chartIds?: string[];
  operation: BatchMetadataOperation;
}): BatchOperationPreview {
  if (operation.kind === 'delete') {
    return previewProtectedChartDelete({ documents, setlists, chartIds, activeSourceName: operation.activeSourceName || '' });
  }
  const selectedDocuments = getSelectedDocuments(documents, chartIds);
  let affectedCount = 0;
  let alreadyHadCount = 0;
  let skippedCount = 0;
  for (const document of selectedDocuments) {
    const chartId = String(document.metadata?.id || '');
    if (!chartId) {
      skippedCount += 1;
      continue;
    }
    if (operation.kind === 'add-tag') {
      if (chartHasTag(document, operation.tag || '')) alreadyHadCount += 1;
      else affectedCount += 1;
    } else if (operation.kind === 'remove-tag') {
      if (chartHasTag(document, operation.tag || '')) affectedCount += 1;
      else skippedCount += 1;
    } else if (operation.kind === 'add-setlist') {
      const setlist = setlists.find((candidate) => candidate.id === operation.setlistId);
      if (!setlist) skippedCount += 1;
      else if (setlist.items.some((item) => item.chartId === chartId)) alreadyHadCount += 1;
      else affectedCount += 1;
    } else if (operation.kind === 'remove-setlist') {
      const setlist = setlists.find((candidate) => candidate.id === operation.setlistId);
      if (setlist?.items.some((item) => item.chartId === chartId)) affectedCount += 1;
      else skippedCount += 1;
    }
  }
  const selectedIds = new Set(chartIds);
  const setlistUsageCount = setlists.reduce((count, setlist) => count + setlist.items.filter((item) => selectedIds.has(item.chartId)).length, 0);
  return {
    selectedCount: selectedDocuments.length,
    affectedCount,
    alreadyHadCount,
    skippedCount,
    setlistUsageCount,
    protectedMultiSourceImportedCount: 0,
    deletedChartCount: 0,
    sourceRefRemovedCount: 0
  };
}

export function applyBatchMetadataOperation({
  documents = [],
  setlists = [],
  chartIds = [],
  operation
}: {
  documents?: ChartDocument[];
  setlists?: ChartSetlist[];
  chartIds?: string[];
  operation: BatchMetadataOperation;
}): { documents: ChartDocument[]; setlists: ChartSetlist[]; preview: BatchOperationPreview } {
  const preview = previewBatchMetadataOperation({ documents, setlists, chartIds, operation });
  if (operation.kind === 'delete') {
    return applyProtectedChartDelete({ documents, setlists, chartIds, activeSourceName: operation.activeSourceName || '' });
  }
  const selectedIds = new Set(chartIds);
  let nextDocuments = documents;
  let nextSetlists = setlists;
  if (operation.kind === 'add-tag' || operation.kind === 'remove-tag') {
    nextDocuments = documents.map((document) => {
      if (!selectedIds.has(String(document.metadata?.id || ''))) return document;
      return applyChartTagUpdate(document, {
        addTags: operation.kind === 'add-tag' ? [operation.tag || ''] : [],
        removeTags: operation.kind === 'remove-tag' ? [operation.tag || ''] : []
      });
    });
  }
  if (operation.kind === 'add-setlist' || operation.kind === 'remove-setlist') {
    for (const chartId of chartIds) {
      nextSetlists = applyChartSetlistUpdate(chartId, nextSetlists, {
        addSetlistIds: operation.kind === 'add-setlist' ? [operation.setlistId || ''] : [],
        removeSetlistIds: operation.kind === 'remove-setlist' ? [operation.setlistId || ''] : []
      });
    }
  }
  return { documents: nextDocuments, setlists: nextSetlists, preview };
}

export function reorderSetlistItems(
  items: ChartSetlistItem[] = [],
  fromIndex: number,
  toIndex: number
): ChartSetlistItem[] {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return [...items];
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return [...items];
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}
