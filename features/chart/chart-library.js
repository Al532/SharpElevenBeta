export function slugifyChartValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractIRealLinks(rawText) {
  const matches = [...String(rawText || '').matchAll(/irealb(?:ook)?:\/\/[^"'\s<]+/gi)].map((match) => match[0]);
  return [...new Set(matches)];
}

export function dedupeAndTagImportedDocuments(documents) {
  const seenIds = new Map();

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
} = {}) {
  const links = extractIRealLinks(rawText);
  const sources = links.length > 0 ? links : [rawText];
  const importedDocuments = [];

  for (let index = 0; index < sources.length; index += 1) {
    const sourceText = sources[index];
    const sourceLabel = links.length > 0 ? `${sourceFile || 'ireal-backup'}#${index + 1}` : sourceFile;
    const documents = await importDocuments({
      rawText: sourceText,
      sourceFile: sourceLabel
    });
    importedDocuments.push(...documents);
  }

  return dedupeAndTagImportedDocuments(importedDocuments)
    .sort((left, right) => {
      const titleComparison = String(left.metadata?.title || '').localeCompare(String(right.metadata?.title || ''), 'en', { sensitivity: 'base' });
      if (titleComparison !== 0) return titleComparison;
      const playlistComparison = String(left.source?.playlistName || '').localeCompare(String(right.source?.playlistName || ''), 'en', { sensitivity: 'base' });
      if (playlistComparison !== 0) return playlistComparison;
      return Number(left.source?.songIndex || 0) - Number(right.source?.songIndex || 0);
    });
}

export function filterChartDocuments(documents = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return [...documents];

  return documents.filter((document) => {
    const title = String(document.metadata.title || '').toLowerCase();
    const composer = String(document.metadata.composer || '').toLowerCase();
    return title.includes(normalizedQuery) || composer.includes(normalizedQuery);
  });
}
