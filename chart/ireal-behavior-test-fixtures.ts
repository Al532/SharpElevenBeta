import type { ChartDocument } from '../src/core/types/contracts';

import { createChartDocument } from './chart-types.js';

export const IREAL_BEHAVIOR_TEST_SOURCE = 'iReal behavior tests';
export const PLAYBACK_ENDING_TEST_SOURCE = 'Playback ending tests';
export const PERFORMANCE_CUE_DEMO_SOURCE = 'Performance cue demos';

type TestBarOptions = {
  symbol: string;
  flags?: string[];
  directives?: Array<Record<string, unknown>>;
  endings?: Array<number | string>;
  comments?: string[];
  textAnnotations?: Array<Record<string, unknown>>;
  sectionLabel?: string;
};

function createTestChordSlot(symbol: string) {
  const normalizedSymbol = String(symbol || '').trim();
  const [mainSymbol, bass = null] = normalizedSymbol.split('/');
  const match = /^([A-G](?:b|#)?)(.*)$/.exec(mainSymbol);
  const root = match?.[1] || normalizedSymbol;
  const quality = (match?.[2] || '').replace(/^-/, 'm');
  return {
    kind: 'chord',
    symbol: normalizedSymbol,
    root,
    quality,
    bass,
    alternate: null
  };
}

function makeTestBar(index: number, {
  symbol,
  flags = [],
  directives = [],
  endings = [],
  comments = [],
  textAnnotations = [],
  sectionLabel = 'A'
}: TestBarOptions) {
  const chordSlot = createTestChordSlot(symbol);
  return {
    id: `bar-${index}`,
    index,
    sectionId: `${sectionLabel}-1`,
    sectionLabel,
    timeSignature: '4/4',
    endings,
    flags,
    directives,
    comments,
    textAnnotations,
    notation: {
      kind: 'written',
      tokens: [{ ...chordSlot }]
    },
    playback: {
      slots: [{ ...chordSlot }],
      cellSlots: [{ chord: { ...chordSlot } }]
    }
  };
}

function makeTestChart({
  id,
  title,
  sourceName = IREAL_BEHAVIOR_TEST_SOURCE,
  tempo = 120,
  repeats = 3,
  bars
}: {
  id: string;
  title: string;
  sourceName?: string;
  tempo?: number;
  repeats?: number;
  bars: ReturnType<typeof makeTestBar>[];
}): ChartDocument {
  const sectionIds = [...new Set(bars.map((bar) => bar.sectionId))];
  return createChartDocument({
    metadata: {
      id,
      title,
      composer: 'Temporary fixture',
      style: sourceName,
      styleReference: sourceName,
      sourceKey: 'C',
      primaryTimeSignature: '4/4',
      tempo,
      sourceRepeats: repeats,
      barCount: bars.length
    },
    source: {
      type: 'temporary-fixture',
      playlistName: sourceName,
      sourceRefs: [{
        type: 'temporary-fixture',
        name: sourceName,
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

export function createPlaybackEndingTestCharts(): ChartDocument[] {
  return [
    makeTestChart({
      id: 'playback-ending-onbeat-long-72',
      title: 'Playback Ending - Onbeat Long 72',
      sourceName: PLAYBACK_ENDING_TEST_SOURCE,
      tempo: 72,
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Cmaj7' }),
        makeTestBar(2, { symbol: 'A7' }),
        makeTestBar(3, { symbol: 'Dm7' }),
        makeTestBar(4, { symbol: 'G7' }),
        makeTestBar(5, { symbol: 'C6' })
      ]
    }),
    makeTestChart({
      id: 'playback-ending-offbeat-long-120',
      title: 'Playback Ending - Offbeat Long 120',
      sourceName: PLAYBACK_ENDING_TEST_SOURCE,
      tempo: 120,
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Fmaj7' }),
        makeTestBar(2, { symbol: 'D7' }),
        makeTestBar(3, { symbol: 'Gm7' }),
        makeTestBar(4, { symbol: 'C7' }),
        makeTestBar(5, { symbol: 'F6' })
      ]
    }),
    makeTestChart({
      id: 'playback-ending-short-190',
      title: 'Playback Ending - Short 190',
      sourceName: PLAYBACK_ENDING_TEST_SOURCE,
      tempo: 190,
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Bbmaj7' }),
        makeTestBar(2, { symbol: 'G7' }),
        makeTestBar(3, { symbol: 'Cm7' }),
        makeTestBar(4, { symbol: 'F7' }),
        makeTestBar(5, { symbol: 'Bb6' })
      ]
    }),
    makeTestChart({
      id: 'playback-ending-fermata-long-190',
      title: 'Playback Ending - Fermata Long 190',
      sourceName: PLAYBACK_ENDING_TEST_SOURCE,
      tempo: 190,
      repeats: 1,
      bars: [
        makeTestBar(1, { symbol: 'Ebmaj7' }),
        makeTestBar(2, { symbol: 'Cm7' }),
        makeTestBar(3, { symbol: 'F7' }),
        makeTestBar(4, { symbol: 'Bb6', flags: ['fermata'] }),
        makeTestBar(5, { symbol: 'Eb6' })
      ]
    })
  ];
}

export function createPerformanceCueDemoCharts(): ChartDocument[] {
  return [
    makeTestChart({
      id: 'cue-demo-coda-on-cue',
      title: 'Cue Demo - Coda On Cue',
      sourceName: PERFORMANCE_CUE_DEMO_SOURCE,
      tempo: 132,
      repeats: 4,
      bars: [
        makeTestBar(1, {
          symbol: 'Cmaj7',
          sectionLabel: 'Head',
          comments: ['Add Cue > Coda, arm it before bar 7']
        }),
        makeTestBar(2, { symbol: 'A7', sectionLabel: 'Head' }),
        makeTestBar(3, { symbol: 'Dm7', sectionLabel: 'Head' }),
        makeTestBar(4, { symbol: 'G7', sectionLabel: 'Head' }),
        makeTestBar(5, { symbol: 'Em7', sectionLabel: 'Turn' }),
        makeTestBar(6, { symbol: 'A7', sectionLabel: 'Turn' }),
        makeTestBar(7, {
          symbol: 'Dm7',
          flags: ['coda'],
          directives: [{ type: 'dc_on_cue' }],
          sectionLabel: 'Turn'
        }),
        makeTestBar(8, { symbol: 'G7', sectionLabel: 'Turn' }),
        makeTestBar(9, { symbol: 'C6', flags: ['coda'], sectionLabel: 'Coda' }),
        makeTestBar(10, { symbol: 'Ebdim7', sectionLabel: 'Coda' }),
        makeTestBar(11, { symbol: 'Dm7', sectionLabel: 'Coda' }),
        makeTestBar(12, { symbol: 'G7sus', sectionLabel: 'Coda' })
      ]
    }),
    makeTestChart({
      id: 'cue-demo-exit-repeat-vamp',
      title: 'Cue Demo - Exit Repeat Vamp',
      sourceName: PERFORMANCE_CUE_DEMO_SOURCE,
      tempo: 104,
      repeats: 8,
      bars: [
        makeTestBar(1, {
          symbol: 'Fmaj7',
          flags: ['repeat_start_barline'],
          directives: [{ type: 'open_vamp' }],
          sectionLabel: 'Vamp',
          comments: ['Add Cue > Exit repeat, then arm it inside the vamp']
        }),
        makeTestBar(2, { symbol: 'Gm7', sectionLabel: 'Vamp' }),
        makeTestBar(3, { symbol: 'Am7', sectionLabel: 'Vamp' }),
        makeTestBar(4, {
          symbol: 'D7',
          flags: ['repeat_end_barline'],
          directives: [{ type: 'vamp_instruction', text: 'Vamp until cue' }],
          sectionLabel: 'Vamp'
        }),
        makeTestBar(5, { symbol: 'Gm7', sectionLabel: 'Bridge' }),
        makeTestBar(6, { symbol: 'C7', sectionLabel: 'Bridge' }),
        makeTestBar(7, { symbol: 'F6', sectionLabel: 'Bridge' }),
        makeTestBar(8, { symbol: 'C7', sectionLabel: 'Bridge' })
      ]
    }),
    makeTestChart({
      id: 'cue-demo-section-modulation',
      title: 'Cue Demo - Section Modulation',
      sourceName: PERFORMANCE_CUE_DEMO_SOURCE,
      tempo: 148,
      repeats: 3,
      bars: [
        makeTestBar(1, {
          symbol: 'Bbmaj7',
          sectionLabel: 'A',
          comments: ['Set semitones, Add Modulation, arm before B']
        }),
        makeTestBar(2, { symbol: 'G7', sectionLabel: 'A' }),
        makeTestBar(3, { symbol: 'Cm7', sectionLabel: 'A' }),
        makeTestBar(4, { symbol: 'F7', sectionLabel: 'A' }),
        makeTestBar(5, { symbol: 'Dbmaj7', sectionLabel: 'B' }),
        makeTestBar(6, { symbol: 'Bb7', sectionLabel: 'B' }),
        makeTestBar(7, { symbol: 'Ebm7', sectionLabel: 'B' }),
        makeTestBar(8, { symbol: 'Ab7', sectionLabel: 'B' }),
        makeTestBar(9, { symbol: 'Dmaj7', sectionLabel: 'C' }),
        makeTestBar(10, { symbol: 'B7', sectionLabel: 'C' }),
        makeTestBar(11, { symbol: 'Em7', sectionLabel: 'C' }),
        makeTestBar(12, { symbol: 'A7', sectionLabel: 'C' })
      ]
    }),
    makeTestChart({
      id: 'cue-demo-full-stack',
      title: 'Cue Demo - Full Stack',
      sourceName: PERFORMANCE_CUE_DEMO_SOURCE,
      tempo: 118,
      repeats: 5,
      bars: [
        makeTestBar(1, {
          symbol: 'Ebmaj7',
          sectionLabel: 'Intro',
          comments: ['Try modulate at B, exit repeat at vamp, coda at tag']
        }),
        makeTestBar(2, { symbol: 'Ab7', sectionLabel: 'Intro' }),
        makeTestBar(3, { symbol: 'Gm7', flags: ['repeat_start_barline'], sectionLabel: 'A' }),
        makeTestBar(4, { symbol: 'C7', sectionLabel: 'A' }),
        makeTestBar(5, { symbol: 'Fm7', sectionLabel: 'A' }),
        makeTestBar(6, { symbol: 'Bb7', flags: ['repeat_end_barline'], sectionLabel: 'A' }),
        makeTestBar(7, { symbol: 'Emaj7', sectionLabel: 'B' }),
        makeTestBar(8, { symbol: 'C#7', sectionLabel: 'B' }),
        makeTestBar(9, {
          symbol: 'F#m7',
          flags: ['coda'],
          directives: [{ type: 'dc_on_cue' }],
          sectionLabel: 'B'
        }),
        makeTestBar(10, { symbol: 'B7', sectionLabel: 'B' }),
        makeTestBar(11, {
          symbol: 'Eb6',
          flags: ['coda'],
          sectionLabel: 'Coda'
        }),
        makeTestBar(12, { symbol: 'Bb7', sectionLabel: 'Coda' })
      ]
    })
  ];
}

export function appendIRealBehaviorTestCharts(documents: ChartDocument[] = []): ChartDocument[] {
  const testCharts = [
    ...createIRealBehaviorTestCharts(),
    ...createPlaybackEndingTestCharts(),
    ...createPerformanceCueDemoCharts()
  ];
  const testChartIds = new Set(testCharts.map((document) => document.metadata.id));
  return [
    ...documents.filter((document) => !testChartIds.has(String(document.metadata?.id || ''))),
    ...testCharts
  ];
}

export function isIRealBehaviorTestChart(document: ChartDocument | null | undefined): boolean {
  const documentId = String(document?.metadata?.id || '');
  if (documentId.startsWith('ireal-behavior-')) return true;
  if (documentId.startsWith('playback-ending-')) return true;
  if (documentId.startsWith('cue-demo-')) return true;
  return document?.source?.sourceRefs?.some((sourceRef) => (
    sourceRef.name === IREAL_BEHAVIOR_TEST_SOURCE
    || sourceRef.name === PLAYBACK_ENDING_TEST_SOURCE
    || sourceRef.name === PERFORMANCE_CUE_DEMO_SOURCE
  )) === true;
}

export function removeIRealBehaviorTestCharts(documents: ChartDocument[] = []): ChartDocument[] {
  return documents.filter((document) => !isIRealBehaviorTestChart(document));
}
