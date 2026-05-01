import type { ChartDocument } from '../src/core/types/contracts';

import { createChartDocument } from './chart-types.js';

export const IREAL_BEHAVIOR_TEST_SOURCE = 'iReal behavior tests';

type TestBarOptions = {
  symbol: string;
  flags?: string[];
  directives?: Array<Record<string, unknown>>;
  endings?: Array<number | string>;
  sectionLabel?: string;
};

function makeTestBar(index: number, {
  symbol,
  flags = [],
  directives = [],
  endings = [],
  sectionLabel = 'A'
}: TestBarOptions) {
  return {
    id: `bar-${index}`,
    index,
    sectionId: `${sectionLabel}-1`,
    sectionLabel,
    timeSignature: '4/4',
    endings,
    flags,
    directives,
    comments: [],
    textAnnotations: [],
    notation: {
      kind: 'written',
      tokens: [{ kind: 'chord', symbol }]
    },
    playback: {
      slots: [{ kind: 'chord', symbol }],
      cellSlots: [{ chord: { symbol } }]
    }
  };
}

function makeTestChart({
  id,
  title,
  repeats = 3,
  bars
}: {
  id: string;
  title: string;
  repeats?: number;
  bars: ReturnType<typeof makeTestBar>[];
}): ChartDocument {
  const sectionIds = [...new Set(bars.map((bar) => bar.sectionId))];
  return createChartDocument({
    metadata: {
      id,
      title,
      composer: 'Temporary fixture',
      style: IREAL_BEHAVIOR_TEST_SOURCE,
      styleReference: IREAL_BEHAVIOR_TEST_SOURCE,
      sourceKey: 'C',
      primaryTimeSignature: '4/4',
      tempo: 120,
      sourceRepeats: repeats,
      barCount: bars.length
    },
    source: {
      type: 'temporary-fixture',
      playlistName: IREAL_BEHAVIOR_TEST_SOURCE,
      sourceRefs: [{
        type: 'temporary-fixture',
        name: IREAL_BEHAVIOR_TEST_SOURCE,
        origin: 'temporary-fixture',
        sourceFile: 'chart/ireal-behavior-test-fixtures.ts'
      }]
    },
    sections: sectionIds.map((sectionId) => ({
      id: sectionId,
      label: sectionId.split('-')[0],
      occurrence: 1,
      barIds: bars.filter((bar) => bar.sectionId === sectionId).map((bar) => bar.id)
    })),
    bars,
    layout: null
  }) as ChartDocument;
}

export function createIRealBehaviorTestCharts(): ChartDocument[] {
  return [
    makeTestChart({
      id: 'ireal-behavior-local-repeat-3x',
      title: 'iReal Behavior - Local Repeat 3x',
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7', flags: ['repeat_start_barline'] }),
        makeTestBar(2, {
          symbol: 'F7',
          flags: ['repeat_end_barline'],
          directives: [{ type: 'repeat_hint', times: 3 }]
        }),
        makeTestBar(3, { symbol: 'Bbmaj7' })
      ]
    }),
    makeTestChart({
      id: 'ireal-behavior-coda-outro-final-repeat',
      title: 'iReal Behavior - Coda Outro Final Repeat',
      repeats: 3,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7' }),
        makeTestBar(2, { symbol: 'Dm7' }),
        makeTestBar(3, { symbol: 'G7', flags: ['coda'], sectionLabel: 'Coda' }),
        makeTestBar(4, { symbol: 'C6', sectionLabel: 'Coda' })
      ]
    }),
    makeTestChart({
      id: 'ireal-behavior-dc-al-fine',
      title: 'iReal Behavior - D.C. al Fine',
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7' }),
        makeTestBar(2, { symbol: 'F7', flags: ['fine'] }),
        makeTestBar(3, { symbol: 'G7', directives: [{ type: 'dc_al_fine' }] })
      ]
    }),
    makeTestChart({
      id: 'ireal-behavior-dc-al-coda',
      title: 'iReal Behavior - D.C. al Coda',
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7' }),
        makeTestBar(2, { symbol: 'Dm7', flags: ['coda'] }),
        makeTestBar(3, { symbol: 'G7', directives: [{ type: 'dc_al_coda' }] }),
        makeTestBar(4, { symbol: 'Em7', flags: ['coda'], sectionLabel: 'Coda' }),
        makeTestBar(5, { symbol: 'A7', sectionLabel: 'Coda' })
      ]
    }),
    makeTestChart({
      id: 'ireal-behavior-ds-al-coda',
      title: 'iReal Behavior - D.S. al Coda',
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7' }),
        makeTestBar(2, { symbol: 'Am7', flags: ['segno'] }),
        makeTestBar(3, { symbol: 'Dm7', flags: ['coda'] }),
        makeTestBar(4, { symbol: 'G7', directives: [{ type: 'ds_al_coda' }] }),
        makeTestBar(5, { symbol: 'Fmaj7', flags: ['coda'], sectionLabel: 'Coda' }),
        makeTestBar(6, { symbol: 'C6', sectionLabel: 'Coda' })
      ]
    }),
    makeTestChart({
      id: 'ireal-behavior-dc-al-2nd-ending',
      title: 'iReal Behavior - D.C. al 2nd Ending',
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7', flags: ['repeat_start_barline'] }),
        makeTestBar(2, { symbol: 'Dm7' }),
        makeTestBar(3, { symbol: 'G7', flags: ['repeat_end_barline'], endings: [1] }),
        makeTestBar(4, { symbol: 'C6', flags: ['fine'], endings: [2] }),
        makeTestBar(5, { symbol: 'A7', directives: [{ type: 'dc_al_ending', ending: 2 }] })
      ]
    })
  ];
}

export function appendIRealBehaviorTestCharts(documents: ChartDocument[] = []): ChartDocument[] {
  const testCharts = createIRealBehaviorTestCharts();
  const testChartIds = new Set(testCharts.map((document) => document.metadata.id));
  return [
    ...documents.filter((document) => !testChartIds.has(String(document.metadata?.id || ''))),
    ...testCharts
  ];
}

export function isIRealBehaviorTestChart(document: ChartDocument | null | undefined): boolean {
  const documentId = String(document?.metadata?.id || '');
  if (documentId.startsWith('ireal-behavior-')) return true;
  return document?.source?.sourceRefs?.some((sourceRef) => sourceRef.name === IREAL_BEHAVIOR_TEST_SOURCE) === true;
}

export function removeIRealBehaviorTestCharts(documents: ChartDocument[] = []): ChartDocument[] {
  return documents.filter((document) => !isIRealBehaviorTestChart(document));
}
