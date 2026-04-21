import { cloneChartDocument } from './chart-types.js';
import { transposeChordSymbol, transposeKeySymbol } from './chart-harmony.js';
import { contextualizeChordSlotCollections } from './chart-contextual-qualities.js';

function createDisplayToken(token, semitoneOffset) {
  if (!token || typeof token !== 'object') return token;
  if (token.kind !== 'chord') return JSON.parse(JSON.stringify(token));

  const transposed = JSON.parse(JSON.stringify(token));
  transposed.symbol = transposeChordSymbol(token.symbol, semitoneOffset);
  if (token.root) transposed.root = transposeChordSymbol(token.root, semitoneOffset);
  if (token.bass) transposed.bass = transposeChordSymbol(token.bass, semitoneOffset);
  if (token.alternate) transposed.alternate = createDisplayToken(token.alternate, semitoneOffset);
  return transposed;
}

export function createChartViewModel(chartDocument, {
  displayTransposeSemitones = 0,
  selectedBarId = null,
  pageSize = 8
} = {}) {
  const sourceDocument = cloneChartDocument(chartDocument);
  const contextualizedPlaybackSlotsByBar = contextualizeChordSlotCollections(
    sourceDocument.bars.map(bar => bar?.playback?.slots || [])
  );
  const viewBars = sourceDocument.bars.map((bar, index) => ({
    ...bar,
    isSelected: bar.id === selectedBarId,
    displayTokens: (bar.notation.kind === 'written'
      ? (contextualizedPlaybackSlotsByBar[index] || [])
      : bar.notation.tokens
    ).map(token => createDisplayToken(token, displayTransposeSemitones)),
    displayPlaybackSlots: (contextualizedPlaybackSlotsByBar[index] || [])
      .map(slot => createDisplayToken(slot, displayTransposeSemitones))
  }));

  const pages = [];
  for (let index = 0; index < viewBars.length; index += pageSize) {
    pages.push({
      index: pages.length + 1,
      barIds: viewBars.slice(index, index + pageSize).map(bar => bar.id)
    });
  }

  return {
    metadata: {
      ...sourceDocument.metadata,
      displayKey: transposeKeySymbol(sourceDocument.metadata.sourceKey, displayTransposeSemitones),
      displayTransposeSemitones
    },
    sections: sourceDocument.sections,
    bars: viewBars,
    pages
  };
}
