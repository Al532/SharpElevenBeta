import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHART_DOCUMENT_CONTRACT,
  CHART_PLAYBACK_PLAN_CONTRACT,
  PRACTICE_SESSION_CONTRACT,
  createChartDocument,
  createChartDocumentsFromIRealSource,
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createDrillExportFromPlaybackPlan,
  createPracticeSessionFromChartDocument,
  createPracticeSessionFromChartDocumentWithPlaybackPlan,
  createPracticeSessionFromChartSelection,
  createPracticeSessionFromSelectedChartDocument,
  createSelectedChartDocument
} from '../chart/node-index.mjs';
import { createEmbeddedPlaybackRuntime } from '../core/playback/embedded-playback-runtime.js';
import { createEmbeddedPlaybackApi } from '../core/playback/embedded-playback-api.js';
import { createEmbeddedPlaybackAssembly } from '../core/playback/embedded-playback-assembly.js';
import { createEmbeddedPlaybackApiClient } from '../core/playback/embedded-playback-api-client.js';
import { createEmbeddedPlaybackBridge } from '../core/playback/embedded-playback-bridge.js';
import { createEmbeddedPlaybackBridgeProvider } from '../core/playback/embedded-playback-bridge-provider.js';
import { createEmbeddedPlaybackRuntimeProvider } from '../core/playback/embedded-playback-runtime-provider.js';
import { createDirectPlaybackAssembly } from '../core/playback/direct-playback-assembly.js';
import { createDirectPlaybackAssemblyProvider } from '../core/playback/direct-playback-assembly-provider.js';
import { createDirectPlaybackBridgeProvider } from '../core/playback/direct-playback-bridge-provider.js';
import { createDirectPlaybackRuntime } from '../core/playback/direct-playback-runtime.js';
import { createDirectPlaybackRuntimeProvider } from '../core/playback/direct-playback-runtime-provider.js';
import {
  publishEmbeddedPlaybackGlobals,
  readEmbeddedPlaybackGlobals,
  resolveEmbeddedPlaybackApi
} from '../core/playback/embedded-playback-globals.js';
import { createDrillPlaybackAssembly } from '../core/playback/drill-playback-assembly.js';
import { createDrillPlaybackAssemblyProvider } from '../core/playback/drill-playback-assembly-provider.js';
import { createDrillPlaybackBridgeProvider } from '../core/playback/drill-playback-bridge-provider.js';
import { createDrillPlaybackRuntime as createCoreDrillPlaybackRuntime } from '../core/playback/drill-playback-runtime.js';
import { createDrillPlaybackRuntimeProvider } from '../core/playback/drill-playback-runtime-provider.js';
import { createEmbeddedPlaybackSessionAdapter } from '../core/playback/embedded-playback-session-adapter.js';
import { createDrillPlaybackSessionAdapter } from '../core/playback/drill-playback-session-adapter.js';
import { createPlaybackBridgeProvider } from '../core/playback/playback-bridge-provider.js';
import { createPlaybackAssembly } from '../core/playback/playback-assembly.js';
import { createPlaybackAssemblyProvider } from '../core/playback/playback-assembly-provider.js';
import { createPlaybackRuntimeBindings } from '../core/playback/playback-runtime-bindings.js';
import { createRuntimePlaybackBridgeProvider } from '../core/playback/runtime-playback-bridge-provider.js';
import { createPlaybackRuntimeProvider } from '../core/playback/playback-runtime-provider.js';
import { createPlaybackRuntime } from '../core/playback/playback-runtime.js';
import { bootstrapEmbeddedPlaybackApi } from '../core/playback/embedded-playback-bootstrap.js';
import { createPublishedEmbeddedPlaybackAssembly } from '../core/playback/published-embedded-playback-assembly.js';
import { createPublishedEmbeddedPlaybackAssemblyProvider } from '../core/playback/published-embedded-playback-assembly-provider.js';
import { createEmbeddedDrillApi } from '../features/drill/drill-embedded-api.js';
import {
  createChartDirectPlaybackBridgeProvider,
  createChartPlaybackBridgeProviderForMode,
  createChartPlaybackPayloadBuilder
} from '../features/chart/chart-playback-bridge.js';
import { createChartPlaybackRuntimeContext } from '../features/chart/chart-playback-runtime-context.js';
import { initializeEmbeddedDrillRuntime } from '../features/drill/drill-embedded-runtime.js';
import { createDirectPlaybackController, createDirectPlaybackRuntime as createFeatureDirectPlaybackRuntime, createDrillPlaybackRuntime } from '../features/drill/drill-playback-controller.js';
import {
  createDrillPlaybackSchedulerState,
  createDrillPlaybackTransportState
} from '../features/drill/drill-playback-runtime-engine.js';
import { createWalkingBassGenerator } from '../walking-bass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'jazz-1460.txt');

const importedDocuments = await createChartDocumentsFromIRealSource({ sourcePath });
assert.ok(importedDocuments.length > 1000, 'Raw iReal jazz source imports the full library.');
assert.ok(importedDocuments.some(document => document.source.type === 'ireal-source'), 'Raw iReal imports are tagged as source-driven.');
const byTitle = new Map(importedDocuments.map(document => [document.metadata.title, document]));

const satinDoll = byTitle.get('Satin Doll');
assert.ok(satinDoll, 'Satin Doll is present in the raw source import.');
assert.equal(satinDoll.metadata.canonicalGroove, 'Jazz-Medium Swing', 'Satin Doll resolves to the default canonical groove.');
assert.equal(satinDoll.metadata.grooveSource, 'default', 'Satin Doll uses the default groove when style and groove need no special mapping.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(1)), 'Satin Doll keeps first ending.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(2)), 'Satin Doll keeps second ending.');
assert.ok(satinDoll.bars.some(bar => bar.notation.kind === 'single_bar_repeat'), 'Satin Doll keeps repeat display bars.');

const alice = byTitle.get('Alice In Wonderland');
assert.ok(alice, 'Alice In Wonderland is present in the raw source import.');
assert.ok(alice.bars.some(bar => bar.directives.some(directive => directive.type === 'dc_al_ending')), 'Alice keeps D.C. al ending.');
assert.ok(alice.bars.some(bar => bar.flags.includes('fine')), 'Alice keeps Fine.');
assert.equal(alice.metadata.sourceTranspose, 0, 'Alice keeps the source transpose metadata from iReal.');
assert.equal(alice.metadata.sourceRepeats, 3, 'Alice keeps the source repeats metadata from iReal.');

const bodyAndSoul = byTitle.get('Body And Soul');
assert.ok(bodyAndSoul, 'Body And Soul is present in the raw source import.');
assert.ok(bodyAndSoul.bars.some(bar => bar.playback.slots.some(slot => slot.bass)), 'Body And Soul keeps slash chords.');

const aBallad = byTitle.get('A Ballad');
assert.ok(aBallad, 'A Ballad is present in the raw source import.');
assert.ok(
  aBallad.bars.some(bar => bar.playback.slots.some(slot => slot.quality === '7b9b13')),
  'A Ballad normalizes 7b13-style source chords to the canonical 7b9b13 quality.'
);
assert.ok(
  !aBallad.bars.some(bar => bar.playback.slots.some(slot => slot.quality === '7b13')),
  'A Ballad no longer leaves 7b13 as a raw imported playback quality.'
);
const aBalladPlan = createChartPlaybackPlanFromDocument(aBallad);
const aBalladExport = createDrillExportFromPlaybackPlan(aBalladPlan, aBallad);
assert.equal(
  aBalladExport.engineBars[45],
  'A7alt A7alt Ab7alt Ab7alt',
  'A Ballad bar 46 collapses 8 iReal cells into 4 Drill beat slots.'
);
assert.equal(
  aBalladExport.engineBars[46],
  'G7 G7 Cmaj7 Cmaj7',
  'A Ballad bar 47 collapses 8 iReal cells into 4 Drill beat slots.'
);

const allTheThings = byTitle.get('All The Things You Are');
assert.ok(allTheThings, 'All The Things You Are is present in the raw source import.');
assert.equal(allTheThings.sections.length >= 3, true, 'All The Things You Are keeps multiple sections.');

const stella = byTitle.get('Stella By Starlight');
assert.ok(stella, 'Stella is present in the raw source import.');
assert.ok(stella.bars.some(bar => bar.playback.slots.some(slot => slot.alternate)), 'Stella keeps alternate harmony markers.');

const satinPlan = createChartPlaybackPlanFromDocument(satinDoll);
assert.ok(satinPlan.entries.length > satinDoll.bars.length, 'Satin Doll playback expands the repeat.');
assert.equal(satinPlan.schemaVersion, CHART_PLAYBACK_PLAN_CONTRACT.schemaVersion, 'Playback plans expose the stable schema version.');

const alicePlan = createChartPlaybackPlanFromDocument(alice);
assert.ok(alicePlan.entries.some(entry => entry.flags.includes('fine')), 'Alice playback reaches Fine.');

const viewModel = createChartViewModel(bodyAndSoul, { displayTransposeSemitones: 2 });
assert.equal(bodyAndSoul.metadata.sourceKey, 'Db', 'Source document key stays unchanged.');
assert.notEqual(viewModel.metadata.displayKey, bodyAndSoul.metadata.sourceKey, 'Display key transposes in view model.');
const stellaViewModel = createChartViewModel(stella, { displayTransposeSemitones: 2 });
const stellaAlternateSlot = stellaViewModel.bars.flatMap(bar => bar.displayTokens).find(token => token?.alternate);
assert.ok(stellaAlternateSlot, 'Stella exposes alternate harmony in the transposed view model.');
assert.notEqual(stellaAlternateSlot.alternate.symbol, stella.bars.flatMap(bar => bar.playback.slots).find(slot => slot?.alternate)?.alternate?.symbol, 'Alternate harmony transposes with the primary display token.');

const popDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'pop-400.txt')
});
const americanBoy = popDocuments.find(document => document.metadata.title === 'American Boy');
assert.ok(americanBoy, 'American Boy is present in the pop source import.');
assert.equal(americanBoy.metadata.grooveReference, 'Pop-Disco', 'Pop source keeps the explicit groove reference.');
assert.equal(americanBoy.metadata.canonicalGroove, 'Pop-Disco', 'Explicit groove reference wins over style inference.');
assert.equal(americanBoy.metadata.defaultTempo, 120, 'Explicit Pop-Disco groove resolves to the documented default tempo.');

const billieJean = popDocuments.find(document => document.metadata.title === 'Billie Jean');
assert.ok(billieJean, 'Billie Jean is present in the pop source import.');
assert.equal(billieJean.metadata.canonicalGroove, 'Pop-Rock', 'Pop style falls back to the canonical Pop-Rock groove.');
assert.equal(billieJean.metadata.defaultTempo, 115, 'Pop style fallback resolves to the documented Pop-Rock tempo.');

const girl = popDocuments.find(document => document.metadata.title === 'Girl');
assert.ok(girl, 'Girl is present in the pop source import.');
assert.equal(girl.metadata.grooveReference, 'Jazz-Gypsy Jazz', 'Girl keeps the explicit iReal groove reference.');
assert.equal(girl.metadata.canonicalGroove, 'Pop-Rock', 'Jazz-Gypsy Jazz explicit groove normalizes to Pop-Rock.');

const blueTango = popDocuments.find(document => document.metadata.title === 'Blue Tango');
assert.ok(blueTango, 'Blue Tango is present in the pop source import.');
assert.equal(blueTango.metadata.canonicalGroove, 'Latin-Argentina: Tango', 'Blue Tango keeps the canonical tango groove.');
assert.equal(blueTango.metadata.defaultTempo, 130, 'Tango groove resolves to the documented default tempo.');

const brazilianDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'brazilian-220.txt')
});
const aRita = brazilianDocuments.find(document => document.metadata.title === 'A Rita');
assert.ok(aRita, 'A Rita is present in the brazilian source import.');
assert.equal(aRita.metadata.canonicalGroove, 'Latin-Brazil: Samba', 'Samba style resolves to the canonical Brazilian samba groove.');
assert.equal(aRita.metadata.defaultTempo, 220, 'Samba style fallback resolves to the documented samba tempo.');

const aNovidade = brazilianDocuments.find(document => document.metadata.title === 'A Novidade');
assert.ok(aNovidade, 'A Novidade is present in the brazilian source import.');
assert.equal(aNovidade.metadata.canonicalGroove, 'Pop-Reggae', 'Reggae style resolves to Pop-Reggae.');
assert.equal(aNovidade.metadata.defaultTempo, 90, 'Pop-Reggae resolves to the documented default tempo.');

const latinDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'latin-50.txt')
});
const chanChan = latinDocuments.find(document => document.metadata.title === 'Chan Chan');
assert.ok(chanChan, 'Chan Chan is present in the latin source import.');
assert.equal(chanChan.metadata.sourceRepeats, 4, 'Chan Chan keeps atypical source repeats metadata.');
const mamboInfluenciado = latinDocuments.find(document => document.metadata.title === 'Mambo Influenciado');
assert.ok(mamboInfluenciado, 'Mambo Influenciado is present in the latin source import.');
assert.equal(mamboInfluenciado.metadata.sourceRepeats, 10, 'Mambo Influenciado keeps large source repeats metadata.');

const fiveHundredMilesHigh = byTitle.get('500 Miles High');
assert.ok(fiveHundredMilesHigh, '500 Miles High is present in the raw source import.');
assert.ok(fiveHundredMilesHigh.bars.some(bar => bar.annotationMisc.includes('Q')), '500 Miles High preserves raw annotation misc tokens.');

const drillExport = createDrillExportFromPlaybackPlan(satinPlan, satinDoll);
assert.ok(drillExport.patternString.includes('|'), 'Drill export produces a bar-delimited pattern string.');
assert.ok(!drillExport.patternString.includes('%'), 'Drill export resolves repeated bars into concrete harmony.');

const cryMeARiver = byTitle.get('Cry Me A River');
assert.ok(cryMeARiver, 'Cry Me A River is present in the raw source import.');
const cryMeARiverPlan = createChartPlaybackPlanFromDocument(cryMeARiver);
const cryMeARiverExport = createDrillExportFromPlaybackPlan(cryMeARiverPlan, cryMeARiver);
assert.equal(cryMeARiver.bars[8].playback.cellSlots.length, 4, 'Cry Me A River keeps the four source iReal cell slots for the second ending bar.');
assert.deepEqual(
  cryMeARiverExport.engineBars[15].split(' '),
  ['Eb6', 'Eb6', 'Am7b5', 'D7b9b13'],
  'Cry Me A River expands the second ending bar from source cell positions into four Drill beats.'
);
const butterfly = byTitle.get('Butterfly');
assert.ok(butterfly, 'Butterfly is present in the raw source import.');
const butterflyPlan = createChartPlaybackPlanFromDocument(butterfly);
assert.ok(
  butterflyPlan.diagnostics.some(diagnostic => diagnostic.code === 'unsupported_repeat_hint'),
  'Playback diagnostics flag preserved repeat hints that are not yet interpreted.'
);

const normalizedDocument = createChartDocument({
  metadata: {
    title: 'Normalized',
    barCount: '3'
  },
  source: null,
  sections: [{ id: 'a', barIds: ['bar-1', null] }],
  bars: [{ id: 'bar-1', index: '1' }]
});
assert.equal(normalizedDocument.schemaVersion, CHART_DOCUMENT_CONTRACT.schemaVersion, 'Chart documents expose the stable schema version.');
assert.equal(normalizedDocument.metadata.id, '', 'Chart document metadata defaults missing ids to empty strings.');
assert.equal(normalizedDocument.metadata.barCount, 3, 'Chart document metadata normalizes bar counts.');
assert.deepEqual(normalizedDocument.sections[0].barIds, ['bar-1'], 'Chart document sections normalize bar id lists.');
const normalizedPlaybackPlan = CHART_PLAYBACK_PLAN_CONTRACT
  && createChartPlaybackPlanFromDocument(createChartDocument({
    metadata: { title: 'One Bar', id: 'one-bar' },
    sections: [{ id: 'a', barIds: ['bar-1'] }],
    bars: [{
      id: 'bar-1',
      index: 1,
      sectionId: 'a',
      sectionLabel: 'A',
      timeSignature: '4/4',
      notation: { kind: 'written', tokens: [{ kind: 'chord', symbol: 'Cmaj7' }] },
      playback: { slots: [{ kind: 'chord', symbol: 'Cmaj7' }], cellSlots: [] },
      endings: [],
      flags: [],
      directives: [],
      comments: []
    }]
  }));
assert.deepEqual(
  normalizedPlaybackPlan.navigation,
  { segnoIndex: null, codaIndex: null },
  'Playback plans normalize missing navigation targets to explicit null indices.'
);

const satinSession = createPracticeSessionFromChartDocument(satinDoll, { playbackPlan: satinPlan });
assert.equal(satinSession.schemaVersion, PRACTICE_SESSION_CONTRACT.schemaVersion, 'Practice sessions expose the stable schema version.');
assert.equal(satinSession.origin.mode, 'chart-document', 'Chart document sessions preserve their origin mode.');
assert.equal(satinSession.playback.patternString.includes('|'), true, 'Chart document sessions derive legacy playback strings.');

const satinSessionViaExplicitPlan = createPracticeSessionFromChartDocumentWithPlaybackPlan(satinDoll, satinPlan);
assert.deepEqual(
  satinSessionViaExplicitPlan.playback,
  satinSession.playback,
  'Explicit playback-plan session creation stays aligned with the chart-document helper.'
);

const selectedDocument = createSelectedChartDocument(satinDoll, ['bar-1', 'bar-2']);
assert.equal(selectedDocument.metadata.barCount, 2, 'Selected chart documents keep the normalized selected bar count.');
assert.equal(selectedDocument.layout, null, 'Selected chart documents intentionally drop layout metadata.');

const selectedSession = createPracticeSessionFromSelectedChartDocument(selectedDocument, {
  origin: {
    chartId: satinDoll.metadata.id,
    sourceKey: satinDoll.metadata.sourceKey,
    mode: 'chart-selection'
  }
});
assert.equal(selectedSession.selection.startBarId, 'bar-1', 'Selected chart document sessions infer the first selected bar.');
assert.equal(selectedSession.selection.endBarId, 'bar-2', 'Selected chart document sessions infer the last selected bar.');

const selectedSessionFromOriginal = createPracticeSessionFromChartSelection(satinDoll, {
  barIds: ['bar-1', 'bar-2'],
  startBarId: 'bar-1',
  endBarId: 'bar-2'
});
assert.deepEqual(
  selectedSessionFromOriginal.selection.barIds,
  ['bar-1', 'bar-2'],
  'Original chart selection sessions preserve the ordered selected ids.'
);
assert.equal(
  selectedSessionFromOriginal.origin.chartId,
  satinDoll.metadata.id,
  'Original chart selection sessions keep the source chart id from the unfiltered document.'
);

const embeddedPlaybackCalls = [];
const embeddedRuntimeState = { isPlaying: true, isPaused: false, isIntro: false, currentBeat: 1, currentChordIdx: 2, paddedChordCount: 4, sessionId: 'embedded-session', errorMessage: null };
const embeddedApi = {
  applyEmbeddedPattern(payload) {
    embeddedPlaybackCalls.push({ kind: 'pattern', payload });
    return { ok: true, state: embeddedRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    embeddedPlaybackCalls.push({ kind: 'settings', settings });
    return { ok: true, state: embeddedRuntimeState, settings };
  },
  startPlayback() {
    embeddedPlaybackCalls.push({ kind: 'start' });
    return { ok: true, state: embeddedRuntimeState };
  },
  stopPlayback() {
    embeddedPlaybackCalls.push({ kind: 'stop' });
    return { ok: true, state: embeddedRuntimeState };
  },
  togglePausePlayback() {
    embeddedPlaybackCalls.push({ kind: 'pause' });
    return { ok: true, state: { ...embeddedRuntimeState, isPaused: true } };
  },
  getPlaybackState() {
    return embeddedRuntimeState;
  }
};

const embeddedPlaybackAdapter = createEmbeddedPlaybackSessionAdapter({
  apiClient: {
    getApi() {
      return embeddedApi;
    },
    async ensureApi() {
      return embeddedApi;
    }
  },
  buildPatternPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || 'Untitled',
      patternString: sessionSpec?.playback?.enginePatternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
      transposition: playbackSettings?.transposition ?? null,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode ?? null,
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
      compingStyle: playbackSettings?.compingStyle ?? null,
      drumsMode: playbackSettings?.drumsMode ?? null,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
      masterVolume: playbackSettings?.masterVolume ?? null,
      bassVolume: playbackSettings?.bassVolume ?? null,
      stringsVolume: playbackSettings?.stringsVolume ?? null,
      drumsVolume: playbackSettings?.drumsVolume ?? null
    };
  }
});

await embeddedPlaybackAdapter.loadSession(satinSession, {
  tempo: 140,
  transposition: 2,
  displayMode: 'show-both',
  compingStyle: 'piano'
});
const embeddedPatternCall = embeddedPlaybackCalls.find(call => call.kind === 'pattern');
assert.equal(embeddedPatternCall.payload.patternName, satinSession.title, 'Embedded playback adapter builds the pattern payload from the practice session.');
assert.equal(embeddedPatternCall.payload.transposition, 2, 'Embedded playback adapter forwards transposition in the pattern payload.');

await embeddedPlaybackAdapter.updatePlaybackSettings({
  tempo: 132,
  displayMode: 'roman',
  drumsMode: 'brushes'
}, satinSession);
const embeddedSettingsCall = embeddedPlaybackCalls.find(call => call.kind === 'settings');
assert.equal(embeddedSettingsCall.settings.tempo, satinSession.tempo, 'Embedded playback adapter keeps the session tempo when syncing embedded settings.');
assert.equal(embeddedSettingsCall.settings.displayMode, 'roman', 'Embedded playback adapter forwards display settings through the embedded API.');

await embeddedPlaybackAdapter.start();
await embeddedPlaybackAdapter.pauseToggle();
await embeddedPlaybackAdapter.stop();
assert.equal(embeddedPlaybackCalls.filter(call => call.kind === 'start').length, 1, 'Embedded playback adapter forwards start to the embedded API.');
assert.equal(embeddedPlaybackCalls.filter(call => call.kind === 'pause').length, 1, 'Embedded playback adapter forwards pause to the embedded API.');
assert.equal(embeddedPlaybackCalls.filter(call => call.kind === 'stop').length, 1, 'Embedded playback adapter forwards stop to the embedded API.');
assert.deepEqual(
  embeddedPlaybackAdapter.getRuntimeState(),
  embeddedRuntimeState,
  'Embedded playback adapter exposes the current embedded runtime state.'
);

const embeddedPlaybackRuntime = createEmbeddedPlaybackRuntime({
  apiClient: {
    getApi() {
      return embeddedApi;
    },
    async ensureApi() {
      return embeddedApi;
    }
  },
  buildPatternPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || 'Untitled',
      patternString: sessionSpec?.playback?.enginePatternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
      transposition: playbackSettings?.transposition ?? null,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode ?? null,
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
      compingStyle: playbackSettings?.compingStyle ?? null,
      drumsMode: playbackSettings?.drumsMode ?? null,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
      masterVolume: playbackSettings?.masterVolume ?? null,
      bassVolume: playbackSettings?.bassVolume ?? null,
      stringsVolume: playbackSettings?.stringsVolume ?? null,
      drumsVolume: playbackSettings?.drumsVolume ?? null
    };
  }
});
assert.equal(
  embeddedPlaybackRuntime.ensurePlaybackController(),
  embeddedPlaybackRuntime.ensurePlaybackController(),
  'Embedded playback runtime memoizes its playback session controller.'
);
await embeddedPlaybackRuntime.ensureReady();
await embeddedPlaybackRuntime.ensurePlaybackController().loadSession(satinSession);
assert.equal(
  embeddedPlaybackRuntime.getRuntimeState()?.sessionId,
  satinSession.id,
  'Embedded playback runtime exposes controller state through a stable runtime boundary.'
);
const coreEmbeddedPlaybackApi = createEmbeddedPlaybackApi({
  playbackRuntime: embeddedPlaybackRuntime,
  applyEmbeddedPattern(payload) {
    embeddedPlaybackCalls.push({ kind: 'core-api-pattern', payload });
    return { ok: true, state: embeddedRuntimeState };
  },
  getPlaybackState() {
    return /** @type {any} */ ({ ...embeddedRuntimeState, isEmbeddedMode: true });
  }
});
await coreEmbeddedPlaybackApi.applyEmbeddedPlaybackSettings({ transposition: 5 });
assert.equal(
  embeddedPlaybackCalls.filter(call => call.kind === 'settings').at(-1)?.settings?.transposition,
  5,
  'Core embedded playback API drives settings through the shared embedded runtime boundary.'
);
const coreEmbeddedPlaybackApiWithoutExplicitStateGetter = createEmbeddedPlaybackApi({
  playbackRuntime: embeddedPlaybackRuntime
});
assert.deepEqual(
  coreEmbeddedPlaybackApiWithoutExplicitStateGetter.getPlaybackState(),
  embeddedPlaybackRuntime.getRuntimeState(),
  'Core embedded playback API falls back to runtime state when no explicit embedded state getter is provided.'
);
const embeddedPlaybackAssembly = createEmbeddedPlaybackAssembly({
  playbackRuntime: embeddedPlaybackRuntime,
  applyEmbeddedPattern(payload) {
    embeddedPlaybackCalls.push({ kind: 'core-assembly-pattern', payload });
    return { ok: true, state: embeddedRuntimeState };
  },
  getPlaybackState() {
    return /** @type {any} */ ({ ...embeddedRuntimeState, isEmbeddedMode: true });
  }
});
assert.equal(
  embeddedPlaybackAssembly.playbackController,
  embeddedPlaybackRuntime.ensurePlaybackController(),
  'Core embedded playback assembly materializes the same controller as its runtime.'
);
assert.equal(
  embeddedPlaybackAssembly.embeddedApi.version,
  2,
  'Core embedded playback assembly exposes the legacy embedded API surface.'
);
const embeddedPlaybackBridge = createEmbeddedPlaybackBridge({
  getTargetWindow() {
    return /** @type {any} */ ({ __JPT_DRILL_API__: embeddedApi });
  },
  getHostFrame() {
    return /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} });
  },
  buildPatternPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || 'Untitled',
      patternString: sessionSpec?.playback?.enginePatternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
      transposition: playbackSettings?.transposition ?? null,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode ?? null,
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
      compingStyle: playbackSettings?.compingStyle ?? null,
      drumsMode: playbackSettings?.drumsMode ?? null,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
      masterVolume: playbackSettings?.masterVolume ?? null,
      bassVolume: playbackSettings?.bassVolume ?? null,
      stringsVolume: playbackSettings?.stringsVolume ?? null,
      drumsVolume: playbackSettings?.drumsVolume ?? null
    };
  }
});
assert.equal(
  embeddedPlaybackBridge.playbackController,
  embeddedPlaybackBridge.playbackRuntime.ensurePlaybackController(),
  'Embedded playback bridge materializes the same playback controller as its runtime.'
);
assert.equal(
  await embeddedPlaybackBridge.playbackRuntime.ensureReady(),
  embeddedApi,
  'Embedded playback bridge keeps the embedded API client and runtime aligned.'
);
const embeddedPlaybackBridgeProvider = createEmbeddedPlaybackBridgeProvider({
  getTargetWindow() {
    return /** @type {any} */ ({ __JPT_DRILL_API__: embeddedApi });
  },
  getHostFrame() {
    return /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} });
  },
  buildPatternPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || 'Untitled',
      patternString: sessionSpec?.playback?.enginePatternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
      transposition: playbackSettings?.transposition ?? null,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode ?? null,
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
      compingStyle: playbackSettings?.compingStyle ?? null,
      drumsMode: playbackSettings?.drumsMode ?? null,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
      masterVolume: playbackSettings?.masterVolume ?? null,
      bassVolume: playbackSettings?.bassVolume ?? null,
      stringsVolume: playbackSettings?.stringsVolume ?? null,
      drumsVolume: playbackSettings?.drumsVolume ?? null
    };
  }
});
assert.equal(
  embeddedPlaybackBridgeProvider.getBridge(),
  embeddedPlaybackBridgeProvider.getBridge(),
  'Embedded playback bridge provider memoizes the embedded bridge instance.'
);
const embeddedPlaybackRuntimeProvider = createEmbeddedPlaybackRuntimeProvider({
  apiClient: {
    getApi() {
      return embeddedApi;
    },
    async ensureApi() {
      return embeddedApi;
    }
  },
  buildPatternPayload(sessionSpec, playbackSettings) {
    return {
      patternName: sessionSpec?.title || 'Untitled',
      patternString: sessionSpec?.playback?.enginePatternString || '',
      patternMode: 'both',
      tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
      transposition: playbackSettings?.transposition ?? null,
      repetitionsPerKey: 1,
      displayMode: playbackSettings?.displayMode ?? null,
      harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
      showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
      hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
      compingStyle: playbackSettings?.compingStyle ?? null,
      drumsMode: playbackSettings?.drumsMode ?? null,
      customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
      masterVolume: playbackSettings?.masterVolume ?? null,
      bassVolume: playbackSettings?.bassVolume ?? null,
      stringsVolume: playbackSettings?.stringsVolume ?? null,
      drumsVolume: playbackSettings?.drumsVolume ?? null
    };
  }
});
assert.equal(
  embeddedPlaybackRuntimeProvider.getRuntime(),
  embeddedPlaybackRuntimeProvider.getRuntime(),
  'Embedded playback runtime provider memoizes the embedded runtime instance.'
);
const embeddedPlaybackApiClient = createEmbeddedPlaybackApiClient({
  getTargetWindow() {
    return /** @type {any} */ ({
      __JPT_DRILL_API__: embeddedApi,
      __JPT_PLAYBACK_RUNTIME__: embeddedPlaybackRuntime,
      __JPT_PLAYBACK_SESSION_CONTROLLER__: embeddedPlaybackRuntime.ensurePlaybackController()
    });
  },
  getHostFrame() {
    return /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} });
  }
});
assert.equal(
  embeddedPlaybackApiClient.getApi(),
  embeddedApi,
  'Embedded playback API client reads the embedded API through the centralized globals surface.'
);
const partialEmbeddedGlobalsWindow = /** @type {any} */ ({
  __JPT_DRILL_API__: {
    version: 2
  },
  __JPT_PLAYBACK_RUNTIME__: embeddedPlaybackRuntime,
  __JPT_PLAYBACK_SESSION_CONTROLLER__: embeddedPlaybackRuntime.ensurePlaybackController()
});
const resolvedPartialEmbeddedApi = resolveEmbeddedPlaybackApi(partialEmbeddedGlobalsWindow);
assert.equal(
  typeof resolvedPartialEmbeddedApi?.applyEmbeddedPattern,
  'function',
  'Embedded playback globals can normalize a partially published embedded API into a callable surface.'
);
assert.deepEqual(
  resolvedPartialEmbeddedApi?.getPlaybackState(),
  embeddedPlaybackRuntime.getRuntimeState(),
  'Embedded playback globals fall back to the published runtime/controller state when the raw embedded API is partial.'
);
const publishedAssemblyEvents = [];
const publishedAssemblyWindow = {
  dispatchEvent(event) {
    publishedAssemblyEvents.push(event.type);
    return true;
  }
};
const publishedAssemblyProviderEvents = [];
const publishedAssemblyProviderWindow = {
  dispatchEvent(event) {
    publishedAssemblyProviderEvents.push(event.type);
    return true;
  }
};
const publishedEmbeddedPlaybackAssemblyProvider = createPublishedEmbeddedPlaybackAssemblyProvider({
  targetWindow: /** @type {any} */ (publishedAssemblyProviderWindow),
  playbackAssemblyProvider: createPlaybackAssemblyProvider({
    createAssembly() {
      return embeddedPlaybackAssembly;
    }
  })
});
assert.equal(
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly().embeddedApi.version,
  2,
  'Published embedded playback assembly providers expose the embedded API through a memoized published assembly.'
);
assert.equal(
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly(),
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly(),
  'Published embedded playback assembly providers memoize their published assembly.'
);
assert.equal(
  readEmbeddedPlaybackGlobals(/** @type {any} */ (publishedAssemblyProviderWindow)).embeddedApi,
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly().embeddedApi,
  'Published embedded playback assembly providers publish the embedded API onto the target window.'
);
assert.deepEqual(
  publishedAssemblyProviderEvents,
  ['jpt-playback-api-ready', 'jpt-drill-api-ready'],
  'Published embedded playback assembly providers emit both playback and legacy ready events when publishing.'
);
const bootstrappedEmbeddedApi = bootstrapEmbeddedPlaybackApi({
  publishedPlaybackAssemblyProvider: publishedEmbeddedPlaybackAssemblyProvider
});
assert.equal(
  bootstrappedEmbeddedApi,
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly().embeddedApi,
  'Embedded playback bootstrap reuses the published assembly provider when one is supplied.'
);
const embeddedRuntimeFromDrillAssembly = initializeEmbeddedDrillRuntime({
  playbackAssemblyProvider: createDrillPlaybackAssemblyProvider({
    applyEmbeddedPattern(payload) {
      embeddedPlaybackCalls.push({ kind: 'embedded-runtime-default-provider-pattern', payload });
      return { ok: true, state: embeddedRuntimeState };
    },
    applyEmbeddedPlaybackSettings(settings) {
      embeddedPlaybackCalls.push({ kind: 'embedded-runtime-default-provider-settings', settings });
      return settings;
    },
    getEmbeddedPlaybackState() {
      return embeddedRuntimeState;
    }
  }),
  patternAdapterOptions: {
    getCurrentPatternString: () => '',
    validateCustomPattern: () => true,
    getPatternErrorText: () => '',
    normalizePatternString: (value) => String(value || ''),
    normalizePresetName: (value) => String(value || ''),
    normalizePatternMode: (value) => String(value || 'both')
  },
  playbackSettingsAdapterOptions: {
    getPlaybackSettingsSnapshot: () => ({})
  },
  createPublishedPlaybackAssemblyProvider({ playbackAssemblyProvider, applyEmbeddedPattern, getEmbeddedPlaybackState }) {
    return createPublishedEmbeddedPlaybackAssemblyProvider({
      targetWindow: /** @type {any} */ ({
        __JPT_DRILL_API__: null,
        __JPT_PLAYBACK_RUNTIME__: null,
        __JPT_PLAYBACK_SESSION_CONTROLLER__: null,
        dispatchEvent() {}
      }),
      createPlaybackAssembly() {
        const assembly = playbackAssemblyProvider.getAssembly();
        return {
          playbackRuntime: assembly.playbackRuntime,
          applyEmbeddedPattern,
          getPlaybackState: getEmbeddedPlaybackState
        };
      }
    });
  }
});
assert.equal(
  typeof embeddedRuntimeFromDrillAssembly.playbackRuntime.ensureReady,
  'function',
  'Embedded Drill runtime keeps publishing a usable embedded API even when backed by a Drill assembly provider.'
);
const publishedEmbeddedPlaybackAssembly = createPublishedEmbeddedPlaybackAssembly({
  targetWindow: /** @type {any} */ (publishedAssemblyWindow),
  playbackRuntime: embeddedPlaybackRuntime,
  applyEmbeddedPattern(payload) {
    embeddedPlaybackCalls.push({ kind: 'published-assembly-pattern', payload });
    return { ok: true, state: embeddedRuntimeState };
  },
  getPlaybackState() {
    return /** @type {any} */ ({ ...embeddedRuntimeState, isEmbeddedMode: true });
  }
});
assert.equal(
  publishedEmbeddedPlaybackAssembly.embeddedApi,
  readEmbeddedPlaybackGlobals(/** @type {any} */ (publishedAssemblyWindow)).embeddedApi,
  'Published embedded playback assembly publishes the same embedded API instance it creates.'
);
assert.deepEqual(
  publishedAssemblyEvents,
  ['jpt-playback-api-ready', 'jpt-drill-api-ready'],
  'Published embedded playback assembly emits both playback and legacy ready events when publishing.'
);

const genericPlaybackRuntime = createPlaybackRuntime({
  adapter: {
    async loadSession(sessionSpec) {
      return {
        ok: true,
        state: {
          isPlaying: false,
          isPaused: false,
          isIntro: false,
          currentBeat: 0,
          currentChordIdx: 0,
          paddedChordCount: 0,
          sessionId: sessionSpec?.id || '',
          errorMessage: null
        }
      };
    },
    getRuntimeState() {
      return {
        isPlaying: false,
        isPaused: false,
        isIntro: false,
        currentBeat: 0,
        currentChordIdx: 0,
        paddedChordCount: 0,
        sessionId: '',
        errorMessage: null
      };
    }
  },
  async ensureReady() {
    return 'ready';
  }
});
assert.equal(
  genericPlaybackRuntime.ensurePlaybackController(),
  genericPlaybackRuntime.ensurePlaybackController(),
  'Generic playback runtime memoizes its playback controller.'
);
assert.equal(
  await genericPlaybackRuntime.ensureReady(),
  'ready',
  'Generic playback runtime forwards its readiness hook.'
);
await genericPlaybackRuntime.ensurePlaybackController().loadSession(satinSession);
assert.equal(
  genericPlaybackRuntime.getRuntimeState()?.sessionId,
  satinSession.id,
  'Generic playback runtime exposes controller state independently from the embedded implementation.'
);
const genericPlaybackBindings = createPlaybackRuntimeBindings({
  playbackRuntime: genericPlaybackRuntime
});
assert.equal(
  genericPlaybackBindings.playbackRuntime,
  genericPlaybackRuntime,
  'Playback runtime bindings preserve the runtime instance.'
);
assert.equal(
  genericPlaybackBindings.playbackController,
  genericPlaybackRuntime.ensurePlaybackController(),
  'Playback runtime bindings materialize the same memoized playback controller.'
);
const genericPlaybackRuntimeProvider = createPlaybackRuntimeProvider({
  createRuntime() {
    return genericPlaybackRuntime;
  }
});
assert.equal(
  genericPlaybackRuntimeProvider.getRuntime(),
  genericPlaybackRuntimeProvider.getRuntime(),
  'Playback runtime provider memoizes the runtime instance.'
);
const genericPlaybackBridgeProvider = createPlaybackBridgeProvider({
  createBridge() {
    return {
      playbackRuntime: genericPlaybackRuntime,
      playbackController: genericPlaybackRuntime.ensurePlaybackController()
    };
  }
});
assert.equal(
  genericPlaybackBridgeProvider.getBridge(),
  genericPlaybackBridgeProvider.getBridge(),
  'Playback bridge provider memoizes the bridge instance.'
);
const runtimePlaybackBridgeProvider = createRuntimePlaybackBridgeProvider({
  runtimeProvider: genericPlaybackRuntimeProvider,
  createExtensions() {
    return {
      marker: 'runtime-bridge'
    };
  }
});
assert.equal(
  runtimePlaybackBridgeProvider.getBridge(),
  runtimePlaybackBridgeProvider.getBridge(),
  'Runtime playback bridge providers memoize the bridge created from the runtime provider.'
);
assert.equal(
  runtimePlaybackBridgeProvider.getBridge().marker,
  'runtime-bridge',
  'Runtime playback bridge providers preserve caller-provided bridge extensions.'
);
const genericPlaybackAssembly = createPlaybackAssembly({
  playbackRuntime: genericPlaybackRuntime,
  createExtensions() {
    return {
      marker: 'assembly'
    };
  }
});
assert.equal(
  genericPlaybackAssembly.playbackController,
  genericPlaybackRuntime.ensurePlaybackController(),
  'Generic playback assembly materializes the same memoized playback controller.'
);
assert.equal(
  genericPlaybackAssembly.marker,
  'assembly',
  'Generic playback assembly merges caller-provided extensions.'
);
const genericPlaybackAssemblyProvider = createPlaybackAssemblyProvider({
  createAssembly() {
    return genericPlaybackAssembly;
  }
});
assert.equal(
  genericPlaybackAssemblyProvider.getAssembly(),
  genericPlaybackAssemblyProvider.getAssembly(),
  'Playback assembly provider memoizes the assembly instance.'
);

const drillAdapterCalls = [];
const drillRuntimeState = {
  isPlaying: false,
  isPaused: false,
  isIntro: false,
  currentBeat: 0,
  currentChordIdx: 0,
  paddedChordCount: 4,
  sessionId: '',
  errorMessage: null
};
const drillPlaybackAdapter = createDrillPlaybackSessionAdapter({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {
    drillAdapterCalls.push({ kind: 'start' });
  },
  stopPlayback: () => {
    drillAdapterCalls.push({ kind: 'stop' });
  },
  togglePausePlayback: () => {
    drillAdapterCalls.push({ kind: 'pause' });
  }
});
await drillPlaybackAdapter.loadSession(satinSession, {
  transposition: -2,
  displayMode: 'roman'
});
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'pattern')?.payload?.transposition,
  -2,
  'Drill playback adapter forwards transposition through the shared playback-session boundary.'
);
await drillPlaybackAdapter.updatePlaybackSettings({
  customMediumSwingBass: true,
  displayMode: 'show-both'
});
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'settings')?.settings?.displayMode,
  'show-both',
  'Drill playback adapter forwards playback settings through the shared playback-session boundary.'
);
await drillPlaybackAdapter.start();
drillPlaybackAdapter.pauseToggle();
drillPlaybackAdapter.stop();
assert.equal(drillAdapterCalls.filter(call => call.kind === 'start').length, 1, 'Drill playback adapter forwards start through the shared playback-session boundary.');
assert.equal(drillAdapterCalls.filter(call => call.kind === 'pause').length, 1, 'Drill playback adapter forwards pause through the shared playback-session boundary.');
assert.equal(drillAdapterCalls.filter(call => call.kind === 'stop').length, 0, 'Drill playback adapter preserves the no-op stop behavior when playback is already stopped.');

const drillPlaybackRuntime = createDrillPlaybackRuntime({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'runtime-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'runtime-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {
    drillAdapterCalls.push({ kind: 'runtime-start' });
  },
  stopPlayback: () => {
    drillAdapterCalls.push({ kind: 'runtime-stop' });
  },
  togglePausePlayback: () => {
    drillAdapterCalls.push({ kind: 'runtime-pause' });
  }
});
const coreDrillPlaybackRuntime = createCoreDrillPlaybackRuntime({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'core-runtime-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'core-runtime-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
assert.equal(
  coreDrillPlaybackRuntime.ensurePlaybackController(),
  coreDrillPlaybackRuntime.ensurePlaybackController(),
  'Core Drill playback runtime memoizes its playback controller.'
);
const drillPlaybackRuntimeProvider = createDrillPlaybackRuntimeProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'provider-runtime-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'provider-runtime-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
assert.equal(
  drillPlaybackRuntimeProvider.getRuntime(),
  drillPlaybackRuntimeProvider.getRuntime(),
  'Drill playback runtime provider memoizes the Drill runtime instance.'
);
assert.equal(
  drillPlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  drillPlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  'Drill playback runtime provider returns a stable runtime with a memoized controller.'
);
const directPlaybackRuntimeProvider = createDirectPlaybackRuntimeProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'direct-provider-runtime-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'direct-provider-runtime-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  directPlaybackRuntimeProvider.getRuntime(),
  directPlaybackRuntimeProvider.getRuntime(),
  'Direct playback runtime provider memoizes the direct runtime instance.'
);
assert.equal(
  directPlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  directPlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  'Direct playback runtime provider returns a stable runtime with a memoized controller.'
);
const drillPlaybackBridgeProvider = createDrillPlaybackBridgeProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'provider-bridge-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'provider-bridge-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
assert.equal(
  drillPlaybackBridgeProvider.getBridge(),
  drillPlaybackBridgeProvider.getBridge(),
  'Drill playback bridge provider memoizes the direct runtime-backed bridge.'
);
const directPlaybackBridgeProvider = createDirectPlaybackBridgeProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'direct-provider-bridge-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'direct-provider-bridge-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  directPlaybackBridgeProvider.getBridge(),
  directPlaybackBridgeProvider.getBridge(),
  'Direct playback bridge provider memoizes the runtime-backed bridge.'
);
let schedulerAudioContext = null;
let schedulerCurrentBassPlan = [];
let schedulerCurrentBeat = 0;
let schedulerCurrentChordIdx = 0;
let schedulerCurrentCompingPlan = null;
let schedulerCurrentKey = 0;
let schedulerCurrentKeyRepetition = 0;
let schedulerCurrentOneChordQualityValue = '';
let schedulerCurrentRawChords = [];
let schedulerCurrentVoicingPlan = [];
let schedulerIsIntro = false;
let schedulerLastPlayedChordIdx = -1;
let schedulerLoopVoicingTemplate = null;
let schedulerNextBeatTime = 0;
let schedulerNextCompingPlan = null;
let schedulerNextKeyValue = null;
let schedulerNextOneChordQualityValue = '';
let schedulerNextPaddedChords = [];
let schedulerNextRawChords = [];
let schedulerNextVoicingPlan = [];
let schedulerPaddedChords = [];
const schedulerPendingDisplayTimeouts = new Set();
const schedulerState = createDrillPlaybackSchedulerState({
  getAudioContext: () => schedulerAudioContext,
  setAudioContext: (value) => { schedulerAudioContext = value; },
  getCurrentBassPlan: () => schedulerCurrentBassPlan,
  setCurrentBassPlan: (value) => { schedulerCurrentBassPlan = value; },
  getCurrentBeat: () => schedulerCurrentBeat,
  setCurrentBeat: (value) => { schedulerCurrentBeat = value; },
  getCurrentChordIdx: () => schedulerCurrentChordIdx,
  setCurrentChordIdx: (value) => { schedulerCurrentChordIdx = value; },
  getCurrentCompingPlan: () => schedulerCurrentCompingPlan,
  setCurrentCompingPlan: (value) => { schedulerCurrentCompingPlan = value; },
  getCurrentKey: () => schedulerCurrentKey,
  setCurrentKey: (value) => { schedulerCurrentKey = value; },
  getCurrentKeyRepetition: () => schedulerCurrentKeyRepetition,
  setCurrentKeyRepetition: (value) => { schedulerCurrentKeyRepetition = value; },
  getCurrentOneChordQualityValue: () => schedulerCurrentOneChordQualityValue,
  setCurrentOneChordQualityValue: (value) => { schedulerCurrentOneChordQualityValue = value; },
  getCurrentRawChords: () => schedulerCurrentRawChords,
  setCurrentRawChords: (value) => { schedulerCurrentRawChords = value; },
  getCurrentVoicingPlan: () => schedulerCurrentVoicingPlan,
  setCurrentVoicingPlan: (value) => { schedulerCurrentVoicingPlan = value; },
  getIsIntro: () => schedulerIsIntro,
  setIsIntro: (value) => { schedulerIsIntro = value; },
  getIsPaused: () => false,
  getIsPlaying: () => true,
  getLastPlayedChordIdx: () => schedulerLastPlayedChordIdx,
  setLastPlayedChordIdx: (value) => { schedulerLastPlayedChordIdx = value; },
  getLoopVoicingTemplate: () => schedulerLoopVoicingTemplate,
  setLoopVoicingTemplate: (value) => { schedulerLoopVoicingTemplate = value; },
  getNextBeatTime: () => schedulerNextBeatTime,
  setNextBeatTime: (value) => { schedulerNextBeatTime = value; },
  getNextCompingPlan: () => schedulerNextCompingPlan,
  setNextCompingPlan: (value) => { schedulerNextCompingPlan = value; },
  getNextKeyValue: () => schedulerNextKeyValue,
  setNextKeyValue: (value) => { schedulerNextKeyValue = value; },
  getNextOneChordQualityValue: () => schedulerNextOneChordQualityValue,
  setNextOneChordQualityValue: (value) => { schedulerNextOneChordQualityValue = value; },
  getNextPaddedChords: () => schedulerNextPaddedChords,
  setNextPaddedChords: (value) => { schedulerNextPaddedChords = value; },
  getNextRawChords: () => schedulerNextRawChords,
  setNextRawChords: (value) => { schedulerNextRawChords = value; },
  getNextVoicingPlan: () => schedulerNextVoicingPlan,
  setNextVoicingPlan: (value) => { schedulerNextVoicingPlan = value; },
  getPaddedChords: () => schedulerPaddedChords,
  setPaddedChords: (value) => { schedulerPaddedChords = value; },
  getPendingDisplayTimeouts: () => schedulerPendingDisplayTimeouts
});
schedulerState.currentBeat = 2;
schedulerState.currentBassPlan = [1, 2];
assert.equal(schedulerCurrentBeat, 2, 'Drill playback scheduler state proxy forwards beat mutations.');
assert.deepEqual(schedulerState.currentBassPlan, [1, 2], 'Drill playback scheduler state proxy exposes current bass plan.');
assert.equal(schedulerState.pendingDisplayTimeouts, schedulerPendingDisplayTimeouts, 'Drill playback scheduler state proxy exposes pending display timeouts.');
let transportActiveNoteGain = null;
let transportAudioContext = null;
let transportCurrentBeat = 0;
let transportCurrentChordIdx = 0;
let transportCurrentKeyRepetition = 0;
let transportFirstPlayStartTracked = false;
let transportPlayStopSuggestionCount = 0;
let transportIsIntro = false;
let transportIsPaused = false;
let transportIsPlaying = false;
let transportKeyPool = [];
let transportLoopVoicingTemplate = null;
let transportNearTermSamplePreloadPromise = null;
let transportNextBeatTime = 0;
let transportNextKeyValue = null;
let transportSchedulerTimer = null;
let transportStartupSamplePreloadInProgress = false;
const transportState = createDrillPlaybackTransportState({
  getActiveNoteGain: () => transportActiveNoteGain,
  setActiveNoteGain: (value) => { transportActiveNoteGain = value; },
  getAudioContext: () => transportAudioContext,
  setAudioContext: (value) => { transportAudioContext = value; },
  getCurrentBeat: () => transportCurrentBeat,
  setCurrentBeat: (value) => { transportCurrentBeat = value; },
  getCurrentChordIdx: () => transportCurrentChordIdx,
  setCurrentChordIdx: (value) => { transportCurrentChordIdx = value; },
  getCurrentKeyRepetition: () => transportCurrentKeyRepetition,
  setCurrentKeyRepetition: (value) => { transportCurrentKeyRepetition = value; },
  getFirstPlayStartTracked: () => transportFirstPlayStartTracked,
  setFirstPlayStartTracked: (value) => { transportFirstPlayStartTracked = value; },
  getPlayStopSuggestionCount: () => transportPlayStopSuggestionCount,
  setPlayStopSuggestionCount: (value) => { transportPlayStopSuggestionCount = value; },
  getIsIntro: () => transportIsIntro,
  setIsIntro: (value) => { transportIsIntro = value; },
  getIsPaused: () => transportIsPaused,
  setIsPaused: (value) => { transportIsPaused = value; },
  getIsPlaying: () => transportIsPlaying,
  setIsPlaying: (value) => { transportIsPlaying = value; },
  getKeyPool: () => transportKeyPool,
  setKeyPool: (value) => { transportKeyPool = value; },
  getLoopVoicingTemplate: () => transportLoopVoicingTemplate,
  setLoopVoicingTemplate: (value) => { transportLoopVoicingTemplate = value; },
  getNearTermSamplePreloadPromise: () => transportNearTermSamplePreloadPromise,
  setNearTermSamplePreloadPromise: (value) => { transportNearTermSamplePreloadPromise = value; },
  getNextBeatTime: () => transportNextBeatTime,
  setNextBeatTime: (value) => { transportNextBeatTime = value; },
  getNextKeyValue: () => transportNextKeyValue,
  setNextKeyValue: (value) => { transportNextKeyValue = value; },
  getSchedulerTimer: () => transportSchedulerTimer,
  setSchedulerTimer: (value) => { transportSchedulerTimer = value; },
  getStartupSamplePreloadInProgress: () => transportStartupSamplePreloadInProgress,
  setStartupSamplePreloadInProgress: (value) => { transportStartupSamplePreloadInProgress = value; }
});
transportState.isPlaying = true;
transportState.currentBeat = 3;
assert.equal(transportIsPlaying, true, 'Drill playback transport state proxy forwards transport playing mutations.');
assert.equal(transportState.currentBeat, 3, 'Drill playback transport state proxy exposes beat mutations.');
const chartDirectPlaybackBridgeProvider = createChartDirectPlaybackBridgeProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'chart-direct-bridge-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'chart-direct-bridge-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  chartDirectPlaybackBridgeProvider.getBridge(),
  chartDirectPlaybackBridgeProvider.getBridge(),
  'Chart direct playback bridge provider memoizes the future direct runtime-backed bridge.'
);
const chartPlaybackBridgeProviderForMode = createChartPlaybackBridgeProviderForMode({
  mode: 'direct',
  directPlaybackOptions: {
    applyEmbeddedPattern(payload) {
      drillAdapterCalls.push({ kind: 'chart-mode-bridge-pattern', payload });
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings(settings) {
      drillAdapterCalls.push({ kind: 'chart-mode-bridge-settings', settings });
      return settings;
    },
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    }
  }
});
assert.equal(
  chartPlaybackBridgeProviderForMode.getBridge(),
  chartPlaybackBridgeProviderForMode.getBridge(),
  'Chart playback bridge mode factory memoizes the selected direct bridge provider.'
);
const chartPlaybackPayloadBuilder = createChartPlaybackPayloadBuilder({
  getTempo: () => 160,
  getCurrentChartTitle: () => 'Chart Title'
});
assert.equal(
  chartPlaybackPayloadBuilder(satinSession, { transposition: 2 }).tempo,
  satinSession.tempo || 160,
  'Chart playback payload builder preserves session tempo when present.'
);
const drillPlaybackAssembly = createDrillPlaybackAssembly({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'assembly-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'assembly-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
assert.equal(
  drillPlaybackAssembly.playbackController,
  drillPlaybackAssembly.playbackRuntime.ensurePlaybackController(),
  'Core Drill playback assembly materializes the same controller as its runtime.'
);
const directPlaybackAssembly = createDirectPlaybackAssembly({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'direct-assembly-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'direct-assembly-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  directPlaybackAssembly.playbackController,
  directPlaybackAssembly.playbackRuntime.ensurePlaybackController(),
  'Direct playback assembly materializes the same controller as its runtime.'
);
const drillPlaybackAssemblyProvider = createDrillPlaybackAssemblyProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'provider-assembly-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'provider-assembly-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  ensureWalkingBassGenerator: async () => {},
  isPlaying: () => false,
  getAudioContext: () => null,
  noteFadeout: 0.1,
  stopActiveChordVoices: () => {},
  rebuildPreparedCompingPlans: () => {},
  buildPreparedBassPlan: () => {},
  getCurrentKey: () => 0,
  preloadNearTermSamples: async () => {},
  validateCustomPattern: () => true,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
assert.equal(
  drillPlaybackAssemblyProvider.getAssembly(),
  drillPlaybackAssemblyProvider.getAssembly(),
  'Drill playback assembly provider memoizes the Drill assembly instance.'
);
assert.equal(
  drillPlaybackAssemblyProvider.getAssembly().playbackController,
  drillPlaybackAssemblyProvider.getAssembly().playbackRuntime.ensurePlaybackController(),
  'Drill playback assembly provider returns a stable assembly/controller pair.'
);
const directPlaybackAssemblyProvider = createDirectPlaybackAssemblyProvider({
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'direct-provider-assembly-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    drillAdapterCalls.push({ kind: 'direct-provider-assembly-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  directPlaybackAssemblyProvider.getAssembly(),
  directPlaybackAssemblyProvider.getAssembly(),
  'Direct playback assembly provider memoizes the direct assembly instance.'
);
assert.equal(
  directPlaybackAssemblyProvider.getAssembly().playbackController,
  directPlaybackAssemblyProvider.getAssembly().playbackRuntime.ensurePlaybackController(),
  'Direct playback assembly provider returns a stable assembly/controller pair.'
);
assert.equal(
  typeof createDirectPlaybackRuntime({
    applyEmbeddedPattern() {
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings() {},
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    }
  }).ensurePlaybackController,
  typeof createFeatureDirectPlaybackRuntime({
    applyEmbeddedPattern() {
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings() {},
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    }
  }).ensurePlaybackController,
  'Feature-level direct playback runtime alias stays wired to the shared runtime implementation.'
);
assert.equal(
  typeof createDirectPlaybackController({
    applyEmbeddedPattern() {
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings() {},
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    }
  }).start,
  'function',
  'Feature-level direct playback controller alias exposes the shared playback controller surface.'
);
const chartDirectRuntimeContext = createChartPlaybackRuntimeContext({
  state: {
    chartPlaybackBridgeProvider: null,
    chartPlaybackController: null
  },
  mode: 'direct',
  directPlaybackOptions: {
    applyEmbeddedPattern() {
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings() {
      return {};
    },
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    },
    startPlayback: async () => {},
    stopPlayback: () => {},
    togglePausePlayback: () => {}
  },
  getTempo: () => 120,
  getCurrentChartTitle: () => 'Chart',
  getSelectedPracticeSession: () => satinSession,
  getPlaybackSettings: () => ({}),
  getCurrentBarCount: () => satinSession.playback.bars.length,
  setActivePlaybackPosition: () => {},
  resetActivePlaybackPosition: () => {},
  renderTransport: () => {},
  updateActiveHighlights: () => {},
  onTransportStatus: () => {},
  onPersistPlaybackSettings: () => {}
});
assert.equal(
  chartDirectRuntimeContext.getPlaybackBridgeProvider(),
  chartDirectRuntimeContext.getPlaybackBridgeProvider(),
  'Chart playback runtime context memoizes the selected playback bridge provider.'
);
let embeddedBridgeFrameLookups = 0;
const chartEmbeddedRuntimeContext = createChartPlaybackRuntimeContext({
  state: {
    chartPlaybackBridgeProvider: null,
    chartPlaybackController: null
  },
  mode: 'embedded',
  getPlaybackBridgeFrame: () => {
    embeddedBridgeFrameLookups += 1;
    return /** @type {HTMLIFrameElement} */ (/** @type {unknown} */ ({ contentWindow: {} }));
  },
  getTempo: () => 120,
  getCurrentChartTitle: () => 'Chart',
  getSelectedPracticeSession: () => satinSession,
  getPlaybackSettings: () => ({}),
  getCurrentBarCount: () => satinSession.playback.bars.length,
  setActivePlaybackPosition: () => {},
  resetActivePlaybackPosition: () => {},
  renderTransport: () => {},
  updateActiveHighlights: () => {},
  onTransportStatus: () => {},
  onPersistPlaybackSettings: () => {}
});
chartEmbeddedRuntimeContext.getPlaybackBridgeProvider();
assert.equal(embeddedBridgeFrameLookups, 1, 'Chart playback runtime context resolves the embedded bridge frame lazily.');
const embeddedDrillApi = createEmbeddedDrillApi({
  playbackRuntime: drillPlaybackRuntime,
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'embedded-api-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  getPlaybackState() {
    return /** @type {any} */ ({ ...drillRuntimeState, isEmbeddedMode: true });
  }
});
await embeddedDrillApi.applyEmbeddedPlaybackSettings({ transposition: 3 });
await embeddedDrillApi.startPlayback();
await embeddedDrillApi.togglePausePlayback();
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'runtime-settings')?.settings?.transposition,
  3,
  'Embedded Drill API can drive playback settings through the shared drill runtime boundary.'
);
assert.equal(
  drillAdapterCalls.filter(call => call.kind === 'runtime-start').length,
  1,
  'Embedded Drill API starts playback through the shared drill runtime boundary.'
);
assert.equal(
  drillAdapterCalls.filter(call => call.kind === 'runtime-pause').length,
  1,
  'Embedded Drill API toggles pause through the shared drill runtime boundary.'
);

const globalEvents = [];
const globalTargetWindow = {
  dispatchEvent(event) {
    globalEvents.push(event.type);
    return true;
  }
};
publishEmbeddedPlaybackGlobals({
  targetWindow: /** @type {any} */ (globalTargetWindow),
  embeddedApi: embeddedDrillApi,
  playbackRuntime: drillPlaybackRuntime,
  playbackController: drillPlaybackRuntime.ensurePlaybackController()
});
const publishedGlobals = readEmbeddedPlaybackGlobals(/** @type {any} */ (globalTargetWindow));
assert.equal(publishedGlobals.embeddedApi, embeddedDrillApi, 'Embedded playback globals publish the embedded API through a single boundary.');
assert.equal(publishedGlobals.playbackRuntime, drillPlaybackRuntime, 'Embedded playback globals publish the playback runtime through a single boundary.');
assert.equal(
  publishedGlobals.playbackController,
  drillPlaybackRuntime.ensurePlaybackController(),
  'Embedded playback globals keep the legacy playback controller global for compatibility.'
);
assert.deepEqual(
  globalEvents,
  ['jpt-playback-api-ready', 'jpt-drill-api-ready'],
  'Embedded playback globals publish both playback and legacy ready events through a single boundary.'
);

const walkingBassGenerator = createWalkingBassGenerator();
const f9BassLine = walkingBassGenerator.buildLine({
  chords: Array.from({ length: 4 }, () => ({
    semitones: 5,
    bassSemitones: 5,
    qualityMajor: '9',
    qualityMinor: '9',
    roman: 'IV',
    modifier: '9'
  })),
  key: 0,
  beatsPerChord: 1,
  tempoBpm: 999,
  isMinor: false
});
assert.equal(f9BassLine.length, 4, 'Walking bass generates four beats for a sustained F9 bar.');
