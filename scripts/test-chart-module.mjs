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
  createPracticeSessionExportFromPlaybackPlan,
  createPracticeSessionFromChartDocument,
  createPracticeSessionFromChartDocumentWithPlaybackPlan,
  createPracticeSessionFromChartSelection,
  createPracticeSessionFromSelectedChartDocument,
  createSelectedChartDocument
} from '../chart/node-index.mjs';
import { createEmbeddedPlaybackRuntime } from '../src/core/playback/embedded-playback-runtime.ts';
import { createEmbeddedPlaybackApi } from '../src/core/playback/embedded-playback-api.ts';
import { createEmbeddedPlaybackAssembly } from '../src/core/playback/embedded-playback-assembly.ts';
import { createEmbeddedPlaybackApiClient } from '../src/core/playback/embedded-playback-api-client.ts';
import { createEmbeddedPlaybackBridge } from '../src/core/playback/embedded-playback-bridge.ts';
import { createEmbeddedPlaybackBridgeProvider } from '../src/core/playback/embedded-playback-bridge-provider.ts';
import { createEmbeddedPlaybackRuntimeProvider } from '../src/core/playback/embedded-playback-runtime-provider.ts';
import { publishDirectPlaybackGlobals, readDirectPlaybackGlobals } from '../src/core/playback/direct-playback-globals.ts';
import { createDirectPlaybackOptionsClient } from '../src/core/playback/direct-playback-options-client.ts';
import { createDirectPlaybackAssembly } from '../src/core/playback/direct-playback-assembly.ts';
import { createDirectPlaybackAssemblyProvider } from '../src/core/playback/direct-playback-assembly-provider.ts';
import { createDirectPlaybackBridgeProvider } from '../src/core/playback/direct-playback-bridge-provider.ts';
import { createDirectPlaybackRuntime } from '../src/core/playback/direct-playback-runtime.ts';
import { createDirectPlaybackRuntimeProvider } from '../src/core/playback/direct-playback-runtime-provider.ts';
import {
  publishEmbeddedPlaybackGlobals,
  readEmbeddedPlaybackGlobals,
  resolveEmbeddedPlaybackApi
} from '../src/core/playback/embedded-playback-globals.ts';
import { createPracticePlaybackAssembly } from '../src/core/playback/practice-playback-assembly.ts';
import { createPracticePlaybackAssemblyProvider } from '../src/core/playback/practice-playback-assembly-provider.ts';
import { createPracticePlaybackBridgeProvider } from '../src/core/playback/practice-playback-bridge-provider.ts';
import { createPracticePlaybackRuntime as createCorePracticePlaybackRuntime } from '../src/core/playback/practice-playback-runtime.ts';
import { createPracticePlaybackRuntimeProvider } from '../src/core/playback/practice-playback-runtime-provider.ts';
import { createEmbeddedPlaybackSessionAdapter } from '../src/core/playback/embedded-playback-session-adapter.ts';
import { createDirectPlaybackSessionAdapter } from '../src/core/playback/direct-playback-session-adapter.ts';
import { createPracticePlaybackSessionAdapter } from '../src/core/playback/practice-playback-session-adapter.ts';
import { createPlaybackBridgeProvider } from '../src/core/playback/playback-bridge-provider.ts';
import { createPlaybackAssembly } from '../src/core/playback/playback-assembly.ts';
import { createPlaybackAssemblyProvider } from '../src/core/playback/playback-assembly-provider.ts';
import { createPlaybackRuntimeBindings } from '../src/core/playback/playback-runtime-bindings.ts';
import { createRuntimePlaybackBridgeProvider } from '../src/core/playback/runtime-playback-bridge-provider.ts';
import { createPlaybackRuntimeProvider } from '../src/core/playback/playback-runtime-provider.ts';
import { createPlaybackRuntime } from '../src/core/playback/playback-runtime.ts';
import { bootstrapEmbeddedPlaybackApi } from '../src/core/playback/embedded-playback-bootstrap.ts';
import { createPublishedEmbeddedPlaybackAssembly } from '../src/core/playback/published-embedded-playback-assembly.ts';
import { createPublishedEmbeddedPlaybackAssemblyProvider } from '../src/core/playback/published-embedded-playback-assembly-provider.ts';
import { createEmbeddedPlaybackApi as createFeatureEmbeddedPlaybackApi } from '../src/features/drill/drill-embedded-api.ts';
import {
  createChartDirectPlaybackBridgeProvider,
  createChartPlaybackBridgeProviderForMode,
  createChartPlaybackPayloadBuilder
} from '../src/features/chart/chart-playback-bridge.ts';
import { createChartDirectPlaybackControllerOptions } from '../src/features/chart/chart-direct-playback-options.ts';
import { createChartDirectPlaybackHostResolver } from '../src/features/chart/chart-direct-playback-host.ts';
import { createChartDirectPlaybackFrameHost } from '../src/features/chart/chart-direct-playback-frame.ts';
import { createChartDirectPlaybackWindowHost } from '../src/features/chart/chart-direct-playback-window-host.ts';
import { createChartDirectPlaybackRuntimeHost } from '../src/features/chart/chart-direct-playback-runtime-host.ts';
import {
  createChartBarSelectionBindings,
  createChartDefaultLibraryBindings,
  createChartDirectPlaybackRuntimeHostBindings,
  createChartFixtureRenderBindings,
  createChartImportedLibraryBindings,
  createChartImportControlsBindings,
  createChartImportStatusBindings,
  createChartLayoutObserversBindings,
  createChartLibraryImportBindings,
  createChartMetaBindings,
  createChartMixerBindings,
  createChartNavigationBindings,
  createChartNavigationStateBindings,
  createChartOverlayControlsBindings,
  createChartOverlayShellBindings,
  createChartPopoverBindings,
  createChartRuntimeControlsAppBindings,
  createChartRuntimeControlsBindings,
  createChartScreenAppBindings,
  createChartScreenBindings,
  createChartSelectionRenderBindings,
  createChartSelectorBindings,
  createChartSheetRendererAppBindings,
  createChartSheetRendererBindings,
  createChartTransportBindings
} from '../src/features/chart/chart-app-bindings.ts';
import { createChartPlaybackRuntimeContextBindings } from '../src/features/chart/chart-playback-runtime-context-bindings.ts';
import { createChartPlaybackRuntimeContext } from '../src/features/chart/chart-playback-runtime-context.ts';
import { bindChartLifecycleEvents } from '../src/features/chart/chart-lifecycle.ts';
import {
  applyPlaybackTransportState,
  startPlaybackPolling,
  stopPlaybackPolling
} from '../src/features/chart/chart-playback-runtime.ts';
import { createAppShellBindings } from '../src/features/app/app-shell-bindings.ts';
import { importDefaultFixtureLibrary as importChartDefaultFixtureLibrary } from '../src/features/chart/chart-import-controls.ts';
import { initializeEmbeddedPracticeRuntime } from '../src/features/drill/drill-embedded-runtime.ts';
import { createPlaybackAudioRuntime } from '../src/features/playback-audio/playback-audio-runtime.ts';
import { createEmbeddedPracticeRuntimeAppContextOptions } from '../src/features/drill/drill-embedded-runtime-app-context.ts';
import { createPracticePatternAnalysis } from '../src/features/practice-patterns/practice-pattern-analysis.ts';
import { loadPracticePatternHelp } from '../src/features/practice-patterns/practice-pattern-help.ts';
import { validatePracticeCustomPattern } from '../src/features/practice-patterns/practice-pattern-validation.ts';
import { createDrillHarmonyDisplayHelpers } from '../src/features/drill/drill-display-runtime.ts';
import { createDrillHarmonyLayoutHelpers } from '../src/features/drill/drill-display-runtime.ts';
import { createDrillPreviewTimingHelpers } from '../src/features/drill/drill-display-runtime.ts';
import { createDirectDrillRuntimeAppContextOptions } from '../src/features/drill/drill-direct-runtime-app-context.ts';
import { createDirectPlaybackSessionHandlers, createDirectPlaybackSessionHost } from '../src/features/drill/drill-direct-session.ts';
import { createDrillDirectRuntimeAppAssembly } from '../src/features/drill/drill-direct-runtime-app-assembly.ts';
import { createPracticePlaybackPreparationRuntime } from '../src/features/practice-playback/practice-playback-preparation-runtime.ts';
import { createPracticePlaybackPreparationAppContext } from '../src/features/practice-playback/practice-playback-preparation-app-context.ts';
import { createPracticePlaybackResourcesAppFacade } from '../src/features/practice-playback/practice-playback-resources-app-facade.ts';
import { createPracticePlaybackSettingsRuntime } from '../src/features/practice-playback/practice-playback-settings-runtime.ts';
import { createDrillSessionAnalytics } from '../src/features/drill/drill-session-analytics.ts';
import { createDrillKeyPoolRuntime } from '../src/features/drill/drill-key-pool-runtime.ts';
import { createPracticePlaybackRuntimeHost } from '../src/features/practice-playback/practice-playback-runtime-host.ts';
import { createPracticeArrangementVoicingRuntime } from '../src/features/practice-arrangement/practice-arrangement-voicing-runtime.ts';
import {
  createDefaultDrillAppSettingsFactory,
  createDrillLoadedSettingsApplier,
  createDrillLoadedSettingsFinalizer,
  createPracticePlaybackSettingsResetter,
  createDrillSettingsSnapshotBuilder
} from '../src/features/drill/drill-settings.ts';
import { createDrillSettingsAppBindings } from '../src/features/drill/drill-settings-app-bindings.ts';
import { createDrillSettingsRuntimeAppBindings } from '../src/features/drill/drill-settings-runtime-app-bindings.ts';
import {
  createDrillEmbeddedRuntimeContextBindings,
  createDrillNormalizationBindings,
  createPracticePatternUiBindings,
  createPracticePlaybackSettingsBindings,
  createPracticePlaybackRuntimeBindings,
  createPracticePlaybackStateBindings,
  createDrillTransportActionBindings
} from '../src/features/drill/drill-runtime-app-bindings.ts';
import { createPlaybackAudioRuntimeAppContext } from '../src/features/playback-audio/playback-audio-runtime-app-context.ts';
import { createPlaybackAudioRuntimeAppAssembly } from '../src/features/playback-audio/playback-audio-runtime-app-assembly.ts';
import { createPlaybackAudioRuntimeAppBindings } from '../src/features/playback-audio/playback-audio-runtime-app-bindings.ts';
import { createPlaybackAudioFacadeAppSurface } from '../src/features/playback-audio/playback-audio-facade-app-surface.ts';
import { createPlaybackAudioStackAppAssembly } from '../src/features/playback-audio/playback-audio-stack-app-assembly.ts';
import { createPlaybackAudioStackAppBindings } from '../src/features/playback-audio/playback-audio-stack-app-bindings.ts';
import { createPlaybackAudioStackAppFacade } from '../src/features/playback-audio/playback-audio-stack-app-facade.ts';
import { createPlaybackAudioStackFacadeAppBindings } from '../src/features/playback-audio/playback-audio-stack-facade-app-bindings.ts';
import { createPlaybackAudioPlaybackRuntime } from '../src/features/playback-audio/playback-audio-playback-runtime.ts';
import { createPlaybackAudioPlaybackAppContext } from '../src/features/playback-audio/playback-audio-playback-app-context.ts';
import { createPracticeArrangementCompingEngineAppBindings } from '../src/features/practice-arrangement/practice-arrangement-comping-engine-app-bindings.ts';
import { createDrillEmbeddedRuntimeAppAssembly } from '../src/features/drill/drill-embedded-runtime-app-assembly.ts';
import { createDrillEmbeddedRuntimeHostBindings } from '../src/features/drill/drill-embedded-runtime-host.ts';
import { createDrillPianoToolsAppBindings } from '../src/features/drill/drill-piano-tools-app-bindings.ts';
import { createDrillPianoToolsAppFacade } from '../src/features/drill/drill-piano-tools.ts';
import {
  createPracticePlaybackResourcesAppBindings,
  createPracticePlaybackResourcesRuntimeAppBindings
} from '../src/features/practice-playback/practice-playback-resources-app-context.ts';
import { createPlaybackSamplePlaybackRuntime } from '../src/features/playback-audio/playback-sample-playback-runtime.ts';
import { createPlaybackSamplePlaybackAppContext } from '../src/features/playback-audio/playback-sample-playback-app-context.ts';
import { createPlaybackSamplePreloadAppContext } from '../src/features/playback-audio/playback-sample-preload-app-context.ts';
import { createPlaybackSamplePreloadRuntime } from '../src/features/playback-audio/playback-sample-preload-runtime.ts';
import { createPlaybackScheduledAudioRuntime } from '../src/features/playback-audio/playback-scheduled-audio-runtime.ts';
import { createPlaybackScheduledAudioAppContext } from '../src/features/playback-audio/playback-scheduled-audio-app-context.ts';
import { createDirectPlaybackController, createDirectPlaybackRuntime as createFeatureDirectPlaybackRuntime, createPracticePlaybackRuntime } from '../src/features/practice-playback/practice-playback-controller.ts';
import { createPracticePlaybackEngineAppContext } from '../src/features/practice-playback/practice-playback-engine-app-context.ts';
import { createPracticePlaybackRuntimeAppAssembly } from '../src/features/practice-playback/practice-playback-runtime-app-assembly.ts';
import { createPracticePlaybackRuntimeHostAppBindings } from '../src/features/practice-playback/practice-playback-runtime-host-app-bindings.ts';
import { createPracticePlaybackStateAppContext } from '../src/features/practice-playback/practice-playback-state-app-context.ts';
import { createDrillRuntimePrimitivesAppBindings } from '../src/features/drill/drill-runtime-primitives-app-bindings.ts';
import { createDrillRuntimePrimitivesRuntimeAppBindings } from '../src/features/drill/drill-runtime-primitives-runtime-app-bindings.ts';
import { createDrillRuntimeStateAppBindings } from '../src/features/drill/drill-runtime-state-app-bindings.ts';
import {
  createPracticePlaybackSchedulerState,
  createPracticePlaybackTransportState
} from '../src/features/practice-playback/practice-playback-runtime-engine.ts';
import {
  createPracticePlaybackAppBindings,
  createPracticePlaybackRuntimeAppBindings
} from '../src/features/practice-playback/practice-playback-app-context.ts';
import { createPracticePlaybackRuntimeAppBindings as createPracticePlaybackRuntimeHostAppContextBindings } from '../src/features/practice-playback/practice-playback-runtime-app-bindings.ts';
import { createPracticeArrangementVoicingRuntimeAppBindings } from '../src/features/practice-arrangement/practice-arrangement-voicing-runtime-app-bindings.ts';
import { createPracticeArrangementWalkingBassAppBindings } from '../src/features/practice-arrangement/practice-arrangement-walking-bass-app-bindings.ts';
import { createWalkingBassGenerator } from '../src/features/practice-arrangement/practice-arrangement-walking-bass.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'jazz-1460.txt');

{
  const appliedLibraries = [];
  let fetchCallCount = 0;
  await importChartDefaultFixtureLibrary({
    sourceUrl: 'https://example.test/default.txt',
    rawText: 'irealb://fixture',
    fetchImpl: async () => {
      fetchCallCount += 1;
      return new Response('', { status: 404 });
    },
    importDocumentsFromIRealText: async (rawText, sourceFile) => [{
      metadata: { id: 'fixture-chart', title: 'Fixture Chart' },
      source: { playlistName: 'Fixture', songIndex: 1, rawText, sourceFile },
      sections: [],
      bars: []
    }],
    applyImportedLibrary: (library) => {
      appliedLibraries.push(library);
    }
  });
  assert.equal(fetchCallCount, 0, 'Chart default library import uses bundled raw text without falling back to the dev-server URL.');
  assert.equal(appliedLibraries[0]?.documents?.length, 1, 'Chart default library import applies documents parsed from bundled raw text.');
  assert.equal(appliedLibraries[0]?.documents?.[0]?.source?.sourceFile, 'default.txt', 'Chart default library import keeps the source label when using bundled raw text.');
}

{
  const appliedLibraries = [];
  await importChartDefaultFixtureLibrary({
    sourceUrl: 'https://example.test/default.txt',
    fetchImpl: async () => new Response('<!DOCTYPE html><html><body><input placeholder="irealb://..."></body></html>'),
    importDocumentsFromIRealText: async () => {
      throw new Error('HTML fallback should not reach the iReal decoder.');
    },
    applyImportedLibrary: (library) => {
      appliedLibraries.push(library);
    }
  });
  assert.equal(appliedLibraries[0]?.documents?.length, 0, 'Chart default library import rejects HTML fallback responses before decoding.');
  assert.match(
    appliedLibraries[0]?.statusMessage || '',
    /resolved to HTML/,
    'Chart default library import reports an explicit HTML fallback error.'
  );
}

{
  const playbackRuntimeState = {
    playbackPollTimer: 12,
    isPlaying: false,
    isPaused: false
  };
  const clearedTimers = [];
  let scheduledIntervalMs = 0;
  let pollingTicks = 0;

  applyPlaybackTransportState({
    state: playbackRuntimeState,
    nextState: { isPlaying: true, isPaused: true }
  });
  assert.deepEqual(
    {
      isPlaying: playbackRuntimeState.isPlaying,
      isPaused: playbackRuntimeState.isPaused
    },
    { isPlaying: true, isPaused: true },
    'Chart playback runtime applies transport state snapshots to the live screen state.'
  );

  startPlaybackPolling({
    state: playbackRuntimeState,
    intervalMs: 240,
    onTick: () => { pollingTicks += 1; },
    setTimer: (callback, intervalMs) => {
      scheduledIntervalMs = intervalMs;
      callback();
      return 42;
    },
    clearTimer: (timerId) => {
      clearedTimers.push(timerId);
    }
  });
  assert.deepEqual(
    clearedTimers,
    [12],
    'Chart playback runtime clears the previous poll timer before starting a new one.'
  );
  assert.equal(
    scheduledIntervalMs,
    240,
    'Chart playback runtime preserves the requested poll cadence.'
  );
  assert.equal(
    pollingTicks,
    1,
    'Chart playback runtime invokes the supplied sync tick through the scheduled poller.'
  );
  assert.equal(
    playbackRuntimeState.playbackPollTimer,
    42,
    'Chart playback runtime stores the active poll timer id on the screen state.'
  );

  stopPlaybackPolling({
    state: playbackRuntimeState,
    clearTimer: (timerId) => {
      clearedTimers.push(timerId);
    }
  });
  assert.deepEqual(
    clearedTimers,
    [12, 42],
    'Chart playback runtime stops the active poll timer and clears it from state.'
  );
  assert.equal(
    playbackRuntimeState.playbackPollTimer,
    null,
    'Chart playback runtime resets the poll timer slot after stopping polling.'
  );
}

{
  const listeners = new Map();
  const visibilityListeners = new Map();
  const chartState = {
    playbackPollTimer: null,
    isPlaying: true
  };
  let lifecycleTicks = 0;

  bindChartLifecycleEvents({
    lifecycleTarget: {
      addEventListener(eventName, handler) {
        listeners.set(eventName, handler);
      }
    },
    visibilityTarget: {
      hidden: false,
      addEventListener(eventName, handler) {
        visibilityListeners.set(eventName, handler);
      }
    },
    state: chartState,
    intervalMs: 180,
    onTick: () => {
      lifecycleTicks += 1;
    }
  });

  assert.equal(
    listeners.has('pagehide') && listeners.has('pageshow') && visibilityListeners.has('visibilitychange'),
    true,
    'Chart lifecycle bindings register background/foreground listeners for playback polling.'
  );
}

const drillPatternAnalysis = createPracticePatternAnalysis({
  romanToSemitones: { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 },
  noteLetterToSemitone: { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 },
  semitoneToRomanTokenMap: {
    0: { roman: 'I', modifier: '' },
    1: { roman: 'II', modifier: 'b' },
    2: { roman: 'II', modifier: '' },
    3: { roman: 'III', modifier: 'b' },
    4: { roman: 'III', modifier: '' },
    5: { roman: 'IV', modifier: '' },
    6: { roman: 'IV', modifier: '#' },
    7: { roman: 'V', modifier: '' },
    8: { roman: 'VI', modifier: 'b' },
    9: { roman: 'VI', modifier: '' },
    10: { roman: 'VII', modifier: 'b' },
    11: { roman: 'VII', modifier: '' }
  },
  degreeQualityMajor: { I: 'maj7', II: 'm7', III: 'm7', IV: 'maj7', V: '13', VI: 'm7', VII: 'm7b5' },
  alteredSemitoneQualityMajor: { 1: 'maj7', 3: 'maj7', 6: '13', 8: 'maj7', 10: '13' },
  degreeQualityMinor: { I: 'm7', II: 'm7b5', III: 'maj7', IV: 'm7', V: '13', VI: 'maj7', VII: '13' },
  alteredSemitoneQualityMinor: { 1: 'maj7', 3: '13', 6: '13', 8: 'maj7', 10: '13' },
  dominantQualityAliases: { '7alt': ['alt'], '13': ['7'] },
  qualityCategoryAliases: { maj7: ['maj'], m7: ['m'], m7b5: ['ø7'] },
  defaultChordsPerBar: 1,
  supportedChordsPerBar: [1, 2, 4]
});
assert.equal(
  drillPatternAnalysis.normalizePatternString('key: Eb\nDm7 - G7'),
  'key: Eb Dm7 G7',
  'Drill pattern analysis normalizes line breaks and dash separators into engine-friendly spacing.'
);
assert.equal(
  drillPatternAnalysis.parseOneChordSpec('one: all dominants').qualities[0],
  '9',
  'Drill pattern analysis preserves the canonical one-chord dominant cycle.'
);
assert.equal(
  drillPatternAnalysis.getPatternKeyOverridePitchClass('key: Eb | IIm7 V7'),
  3,
  'Drill pattern analysis resolves key overrides to pitch classes.'
);
assert.equal(
  drillPatternAnalysis.analyzePattern('key: C | [: Dm7 G7 | [1 Cmaj7 :| [2 Am7 D7 | G7 Cmaj7 ]').expandedMeasures.length,
  5,
  'Drill pattern analysis expands repeated measures and endings into explicit measure groups.'
);
assert.equal(
  drillPatternAnalysis.padProgression([{ semitones: 0 }, { semitones: 7 }, { semitones: 5 }], 2).length,
  4,
  'Drill pattern analysis pads odd progression lengths to an even number of measures.'
);
const currentProgressionVoicingPlan = [{ id: 'current-voicing' }];
const nextProgressionVoicingPlan = [{ id: 'next-voicing' }];
const currentPaddedChordsRef = [{ semitones: 0, qualityMajor: '7', qualityMinor: '7', roman: 'V' }];
const nextPaddedChordsRef = [{ semitones: 5, qualityMajor: 'maj7', qualityMinor: 'm7', roman: 'I' }];
const drillVoicingRuntime = createPracticeArrangementVoicingRuntime({
  qualityCategoryAliases: { maj7: ['maj'], m7: ['m'], dom: ['13'] },
  dominantDefaultQualityMajor: { V: '13' },
  dominantDefaultQualityMinor: { V: '13' },
  colorTones: { maj7: [2, 11], m7: [2, 10] },
  dominantColorTones: { '13': [2, 4, 9] },
  guideTones: { maj7: [4, 11], m7: [3, 10], dom: [4, 10] },
  dominantGuideTones: { '13': [4, 10] },
  intervalSemitones: { '9': 2, '3': 4, '13': 9, '7': 11, b3: 3, b7: 10 },
  applyContextualQualityRules: (_chord, quality) => quality,
  applyPriorityDominantResolutionRules: ({ quality, nextChord }) => (
    quality === '7' && nextChord?.roman === 'I' ? '13' : quality
  ),
  getCurrentPaddedChords: () => currentPaddedChordsRef,
  getCurrentKey: () => 0,
  getCurrentVoicingPlan: () => currentProgressionVoicingPlan,
  getNextPaddedChords: () => nextPaddedChordsRef,
  getNextKeyValue: () => 5,
  getNextVoicingPlan: () => nextProgressionVoicingPlan
});
assert.equal(
  drillVoicingRuntime.getPlayedChordQuality(
    currentPaddedChordsRef[0],
    false,
    nextPaddedChordsRef[0]
  ),
  '13',
  'Drill voicing runtime preserves dominant-resolution prioritization in the extracted shared voicing helpers.'
);
assert.equal(
  drillVoicingRuntime.getVoicingPlanForProgression(currentPaddedChordsRef, 0),
  currentProgressionVoicingPlan,
  'Drill voicing runtime reuses the current progression voicing plan through the shared accessors.'
);
assert.equal(
  drillVoicingRuntime.getVoicingPlanForProgression(nextPaddedChordsRef, 5),
  nextProgressionVoicingPlan,
  'Drill voicing runtime resolves next progression voicing plans through the shared boundary.'
);
let drillKeyPoolState = [];
let drillEnabledKeys = [true, false, false, true, false, false, false, false, false, false, false, false];
const drillKeyPoolRuntime = createDrillKeyPoolRuntime({
  getEnabledKeys: () => drillEnabledKeys,
  getKeyPool: () => drillKeyPoolState,
  setKeyPool: (value) => { drillKeyPoolState = value; }
});
assert.deepEqual(
  drillKeyPoolRuntime.getEffectiveKeyPool(),
  [0, 3],
  'Drill key-pool runtime exposes only the enabled key classes when a key subset is active.'
);
const firstSelectedKey = drillKeyPoolRuntime.nextKey();
assert.equal(
  [0, 3].includes(firstSelectedKey),
  true,
  'Drill key-pool runtime selects from the enabled key subset.'
);
drillEnabledKeys = new Array(12).fill(false);
assert.deepEqual(
  drillKeyPoolRuntime.getEffectiveKeyPool(),
  Array.from({ length: 12 }, (_, index) => index),
  'Drill key-pool runtime falls back to the full chromatic pool when no keys are enabled.'
);
const drillHarmonyDisplayHelpers = createDrillHarmonyDisplayHelpers({
  keyNamesMajor: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
  keyNamesMinor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  letters: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  naturalSemitones: [0, 2, 4, 5, 7, 9, 11],
  degreeIndices: { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 },
  escapeHtml: (value) => String(value),
  renderChordSymbolHtml: (root, quality, bass) => `${root}:${quality}:${bass || ''}`,
  getDisplayTranspositionSemitones: () => 0,
  isOneChordModeActive: () => false,
  isMinorMode: () => false,
  getDisplayedQuality: (chord) => chord?.qualityMajor || '',
  normalizeDisplayedRootName: (value) => value,
  getUseMajorTriangleSymbol: () => true,
  getUseHalfDiminishedSymbol: () => true,
  getUseDiminishedSymbol: () => true
});
assert.equal(
  drillHarmonyDisplayHelpers.keyName(0),
  'C maj',
  'Drill harmony display helpers render the default major key label from injected pitch-name tables.'
);
assert.equal(
  drillHarmonyDisplayHelpers.degreeRootName(0, 'VI', 8, false),
  'A♭',
  'Drill harmony display helpers derive enharmonic degree roots from roman degrees and semitone offsets.'
);
assert.equal(
  drillHarmonyDisplayHelpers.chordSymbol(
    0,
    { roman: 'II', semitones: 2, qualityMajor: 'm7', qualityMinor: 'm7' },
    false,
    null
  ),
  'Dm7',
  'Drill harmony display helpers format plain chord symbols from injected display-quality rules.'
);
const drillPreviewTimingHelpers = createDrillPreviewTimingHelpers({
  getChordsPerBar: () => 2,
  getSecondsPerBeat: () => 0.5,
  getNextPreviewLeadSeconds: () => 3,
  getCurrentChordIdx: () => 1,
  getCurrentBeat: () => 2,
  getChordCount: () => 8
});
assert.equal(
  drillPreviewTimingHelpers.getRemainingBeatsUntilNextProgression(),
  14,
  'Drill preview timing helpers compute remaining beats from the current chord slot and beat index.'
);
assert.equal(
  drillPreviewTimingHelpers.shouldShowNextPreview(0, 5, 4),
  true,
  'Drill preview timing helpers enable the next-key preview when the remaining time fits within the configured lead window.'
);
let layoutFrameRequested = false;
const layoutDisplayClasses = new Set(['alternate-display-sides', 'display-current-right']);
const drillHarmonyLayoutHelpers = createDrillHarmonyLayoutHelpers({
  requestAnimationFrameImpl: (callback) => {
    layoutFrameRequested = true;
    callback();
  },
  getDisplayElement: () => ({
    classList: {
      remove(...classes) {
        classes.forEach((value) => layoutDisplayClasses.delete(value));
      }
    }
  }),
  getChordDisplayElement: () => ({
    textContent: 'Cmaj7',
    style: {},
    parentElement: { clientWidth: 100 },
    clientWidth: 100,
    scrollWidth: 200,
    querySelector: () => null
  }),
  getNextChordDisplayElement: () => null,
  getBaseChordDisplaySize: () => 5,
  isCurrentHarmonyHidden: () => false
});
drillHarmonyLayoutHelpers.applyDisplaySideLayout();
assert.equal(
  layoutDisplayClasses.has('alternate-display-sides'),
  false,
  'Drill harmony layout helpers clear alternate-side layout classes from the display container.'
);
drillHarmonyLayoutHelpers.fitHarmonyDisplay();
assert.equal(
  layoutFrameRequested,
  true,
  'Drill harmony layout helpers schedule harmony fitting work through the injected animation-frame hook.'
);
const patternHelpDom = { patternHelp: { innerHTML: '' } };
await loadPracticePatternHelp({
  dom: patternHelpDom,
  url: 'https://example.test/progression-suffixes.txt',
  version: '1',
  fetchImpl: async () => ({
    ok: true,
    async text() {
      return 'maj7, m7 // common colors';
    }
  })
});
assert.equal(
  patternHelpDom.patternHelp.innerHTML.includes('Progression syntax'),
  true,
  'Drill pattern help loader renders the syntax help container from the fetched suffix catalog.'
);
assert.equal(
  patternHelpDom.patternHelp.innerHTML.includes('common colors'),
  true,
  'Drill pattern help loader preserves inline comments when formatting suffix help lines.'
);
const patternErrorClasses = new Set();
const patternErrorElement = {
  textContent: '',
  classList: {
    add(value) {
      patternErrorClasses.add(value);
    },
    remove(value) {
      patternErrorClasses.delete(value);
    }
  }
};
assert.equal(
  validatePracticeCustomPattern({
    isCustomPatternSelected: () => true,
    getCustomPatternValue: () => 'bad pattern',
    normalizePatternString: (value) => value,
    analyzePattern: () => ({ errorMessage: 'Invalid harmony token' }),
    patternErrorElement
  }),
  false,
  'Drill pattern validation reports parser errors for custom patterns.'
);
assert.equal(
  patternErrorElement.textContent,
  'Invalid harmony token',
  'Drill pattern validation mirrors parser errors into the shared error element.'
);
assert.equal(
  validatePracticeCustomPattern({
    isCustomPatternSelected: () => false,
    getCustomPatternValue: () => '',
    normalizePatternString: (value) => value,
    analyzePattern: () => ({ errorMessage: 'Should not be used' }),
    patternErrorElement
  }),
  true,
  'Drill pattern validation stays inert when the custom-pattern mode is not active.'
);
const appliedMixerPayloads = [];
const PracticePlaybackSettingsRuntime = createPracticePlaybackSettingsRuntime({
  dom: {
    compingStyle: { value: 'piano-one-hand' },
    stringsVolume: { value: '25' },
    walkingBass: { checked: true },
    drumsSelect: { value: 'full_swing' },
    masterVolume: { value: '50' }
  },
  mixer: {
    getMixerNodes: () => ({ master: {} }),
    getAudioContext: () => ({ currentTime: 1 }),
    applyAudioMixerSettings: (payload) => {
      appliedMixerPayloads.push(payload);
      return payload;
    }
  },
  helpers: {
    normalizeCompingStyle: (value) => value === 'piano-one-hand' ? 'piano' : value
  },
  constants: {
    compingStyleOff: 'off',
    mixerChannelCalibration: { master: 2 },
    drumModeOff: 'off',
    bassLow: 28
  }
});
assert.equal(
  PracticePlaybackSettingsRuntime.getCompingStyle(),
  'piano',
  'Practice playback settings runtime normalizes comping style through shared helpers.'
);
assert.equal(
  PracticePlaybackSettingsRuntime.isChordsEnabled(),
  true,
  'Practice playback settings runtime enables chords when comping is active and strings volume is non-zero.'
);
assert.equal(
  PracticePlaybackSettingsRuntime.getDrumsMode(),
  'full_swing',
  'Practice playback settings runtime reads drum mode from DOM state with legacy defaults.'
);
assert.equal(
  PracticePlaybackSettingsRuntime.getBassMidi(2, 0),
  38,
  'Practice playback settings runtime maps bass pitch classes into the configured preload range.'
);
assert.equal(
  PracticePlaybackSettingsRuntime.bassMidiToNoteName(38),
  'D2',
  'Practice playback settings runtime exposes bass-note labels for debug and UI helpers.'
);
PracticePlaybackSettingsRuntime.applyMixerSettings();
assert.equal(
  appliedMixerPayloads.length,
  1,
  'Practice playback settings runtime forwards mixer synchronization through the injected audio helper.'
);
const buildDrillSettingsSnapshot = createDrillSettingsSnapshotBuilder({
  constants: {
    welcomeOnboardingSettingsKey: 'welcome_onboarding',
    welcomeShowNextTimeSettingsKey: 'welcome_show_next_time',
    welcomeVersionSettingsKey: 'welcome_version',
    welcomeVersion: 'v2'
  },
  dom: {
    patternSelect: { value: 'custom' },
    customPattern: { value: 'II-V-I' },
    tempoSlider: { value: '120' },
    transpositionSelect: { value: '2' },
    majorMinor: { checked: false },
    displayMode: { value: 'show-both' },
    harmonyDisplayMode: { value: 'default' },
    useMajorTriangleSymbol: { checked: true },
    useHalfDiminishedSymbol: { checked: true },
    useDiminishedSymbol: { checked: true },
    showBeatIndicator: { checked: true },
    hideCurrentHarmony: { checked: false },
    masterVolume: { value: '50' },
    bassVolume: { value: '100' },
    stringsVolume: { value: '80' },
    drumsVolume: { value: '70' }
  },
  state: {
    getHasCompletedWelcomeOnboarding: () => true,
    getShouldShowWelcomeNextTime: () => false,
    getProgressions: () => ({ 'II-V-I': { name: 'II-V-I' } }),
    getAppliedDefaultProgressionsFingerprint: () => 'defaults@1',
    getAcknowledgedDefaultProgressionsVersion: () => '2026-04-22',
    getAppliedOneTimeMigrations: () => ['mixer-default-50'],
    getEditingProgressionName: () => 'II-V-I',
    getProgressionSelectionBeforeEditing: () => 'Autumn Leaves',
    getEditingProgressionSnapshot: () => ({ name: 'II-V-I', pattern: 'II-V-I' }),
    getIsCreatingProgression: () => false,
    getNextPreviewLeadValue: () => 2,
    getEnabledKeys: () => new Array(12).fill(true),
    getPianoFadeSettings: () => ({ timeConstantLow: 0.1 }),
    getPianoMidiSettings: () => ({ enabled: false })
  },
  helpers: {
    isEditingPreset: () => true,
    getDefaultProgressionsFingerprint: () => 'defaults@fallback',
    getCurrentPatternName: () => 'Custom',
    normalizePatternString: (value) => value,
    getCurrentPatternMode: () => 'roman',
    getRepetitionsPerKey: () => 2,
    getNextPreviewInputUnit: () => 'bars',
    getSelectedChordsPerBar: () => 2,
    normalizeDisplayMode: (value) => value,
    normalizeHarmonyDisplayMode: (value) => value,
    getCompingStyle: () => 'piano',
    isWalkingBassEnabled: () => true,
    isChordsEnabled: () => true,
    getDrumsMode: () => 'full_swing'
  }
});
assert.equal(
  buildDrillSettingsSnapshot().drumsMode,
  'full_swing',
  'Drill settings snapshot builder preserves shared playback settings for persistence.'
);
assert.equal(
  buildDrillSettingsSnapshot().editingState.type,
  'edit',
  'Drill settings snapshot builder preserves progression editing state when serializing settings.'
);
const createDefaultDrillAppSettings = createDefaultDrillAppSettingsFactory({
  tempo: 120,
  enabledKeys: new Array(12).fill(true),
  pianoFadeSettings: { timeConstantLow: 0.1 },
  pianoMidiSettings: { enabled: false }
});
const defaultDrillSettings = createDefaultDrillAppSettings({
  enabledKeys: [true, false, true, false, true, false, true, false, true, false, true, false]
});
assert.equal(
  defaultDrillSettings.enabledKeys.filter(Boolean).length,
  6,
  'Drill default-settings factory preserves explicit enabled-key overrides while cloning the default settings object.'
);
assert.equal(
  createDrillSettingsAppBindings({
    defaults: { tempo: 120 }
  }).defaults.tempo,
  120,
  'Drill settings app bindings preserve grouped defaults for the shared settings assembly.'
);
let appliedLoadedProgressions = null;
let appliedLoadedWelcome = null;
let appliedLoadedPromptForDefaults = null;
const applyDrillLoadedSettings = createDrillLoadedSettingsApplier({
  constants: {
    welcomeOnboardingSettingsKey: 'welcome_onboarding',
    welcomeShowNextTimeSettingsKey: 'welcome_show_next_time',
    welcomeVersionSettingsKey: 'welcome_version',
    welcomeVersion: 'v2',
    defaultProgressions: { Default: { name: 'Default', pattern: 'II-V-I' } },
    nextPreviewUnitBars: 'bars',
    defaultChordsPerBar: 1,
    displayModeKeyOnly: 'key-only',
    displayModeShowBoth: 'show-both',
    drumModeMetronome24: 'metronome_2_4',
    drumModeOff: 'off',
    defaultMasterVolumePercent: '50',
    defaultPianoFadeSettings: { timeConstantLow: 0.1 },
    defaultPianoMidiSettings: { enabled: false },
    customPatternOptionValue: '__custom__'
  },
  dom: {
    welcomeShowNextTime: { checked: false },
    patternSelect: { value: '' },
    patternName: { value: '' },
    customPattern: { value: '' },
    patternMode: { value: '' },
    tempoSlider: { value: '', textContent: '' },
    tempoValue: { textContent: '' },
    repetitionsPerKey: { value: '' },
    transpositionSelect: { value: '' },
    chordsPerBar: { value: '' },
    majorMinor: { checked: false },
    displayMode: { value: '' },
    harmonyDisplayMode: { value: '' },
    useMajorTriangleSymbol: { checked: false },
    useHalfDiminishedSymbol: { checked: false },
    useDiminishedSymbol: { checked: false },
    showBeatIndicator: { checked: false },
    hideCurrentHarmony: { checked: false },
    compingStyle: { value: '' },
    walkingBass: { checked: false },
    stringsVolume: { value: '100' },
    drumsSelect: { value: '' },
    masterVolume: { value: '' },
    bassVolume: { value: '' },
    drumsVolume: { value: '' }
  },
  state: {
    setHasCompletedWelcomeOnboarding: (value) => { appliedLoadedWelcome = value; },
    setShouldShowWelcomeNextTime: () => {},
    getShouldShowWelcomeNextTime: () => true,
    setHadStoredProgressions: () => {},
    getHadStoredProgressions: () => true,
    setAppliedOneTimeMigrations: () => {},
    setAppliedDefaultProgressionsFingerprint: () => {},
    setAcknowledgedDefaultProgressionsVersion: () => {},
    getAcknowledgedDefaultProgressionsVersion: () => 'v1',
    setSavedPatternSelection: () => {},
    setProgressions: (value) => { appliedLoadedProgressions = value; },
    getProgressions: () => ({ Autumn: { name: 'Autumn', pattern: 'ii-v-i' } }),
    setShouldPersistRecoveredDefaultProgressions: () => {},
    setNextPreviewLeadValue: () => {},
    setEnabledKeys: () => {},
    setPianoFadeSettings: () => {},
    setPianoMidiSettings: () => {},
    setEditingProgressionName: () => {},
    setProgressionSelectionBeforeEditing: () => {},
    setEditingProgressionSnapshot: () => {},
    setIsCreatingProgression: () => {},
    setShouldPromptForDefaultProgressionsUpdate: (value) => { appliedLoadedPromptForDefaults = value; },
    getDefaultProgressionsVersion: () => 'v2'
  },
  helpers: {
    normalizeAppliedOneTimeMigrations: (value) => value || {},
    normalizeProgressionsMap: (value) => value,
    renderProgressionOptions: () => {},
    normalizePresetName: (value) => value,
    normalizePatternString: (value) => value,
    setEditorPatternMode: () => {},
    normalizePatternMode: (value) => value,
    normalizeRepetitionsPerKey: (value) => value,
    normalizeNextPreviewLeadValue: (value) => value,
    setNextPreviewInputUnit: () => {},
    normalizeChordsPerBar: (value) => value,
    syncDoubleTimeToggle: () => {},
    normalizeDisplayMode: (value) => value,
    normalizeHarmonyDisplayMode: (value) => value,
    normalizeCompingStyle: (value) => value,
    shouldApplyMasterVolumeDefault50Migration: () => false,
    normalizePianoFadeSettings: (value) => value,
    normalizePianoMidiSettings: (value) => value,
    getProgressionEntry: (name) => ({ name, pattern: 'ii-v-i', mode: 'roman' })
  }
});
applyDrillLoadedSettings({
  welcome_onboarding: true,
  welcome_show_next_time: true,
  welcome_version: 'v1',
  presets: { Autumn: { name: 'Autumn', pattern: 'ii-v-i' } },
  patternSelect: 'Autumn',
  customPatternName: 'Autumn',
  customPattern: 'ii-v-i',
  tempo: '126',
  displayMode: 'show-both',
  harmonyDisplayMode: 'default',
  compingStyle: 'piano',
  drumsMode: 'full_swing'
});
assert.equal(
  appliedLoadedWelcome,
  false,
  'Drill loaded-settings applier forces welcome onboarding to reappear after a welcome-version bump.'
);
assert.equal(
  appliedLoadedProgressions.Autumn.name,
  'Autumn',
  'Drill loaded-settings applier restores stored progression maps through the normalized settings boundary.'
);
assert.equal(
  appliedLoadedPromptForDefaults,
  true,
  'Drill loaded-settings applier flags outdated default progression acknowledgements after restore.'
);
let resetTrackedEvent = '';
let resetAppliedKeys = null;
let resetPreviewLeadValue = null;
let resetPianoFadeSettings = null;
let resetPianoMidiSettings = null;
const resetPlaybackSettings = createPracticePlaybackSettingsResetter({
  dom: {
    patternSelect: { value: 'Autumn' },
    patternName: { value: '' },
    customPattern: { value: 'draft' },
    majorMinor: { checked: true },
    tempoSlider: { value: '100' },
    tempoValue: { textContent: '' },
    repetitionsPerKey: { value: '' },
    transpositionSelect: { value: '' },
    chordsPerBar: { value: '' },
    compingStyle: { value: '' },
    walkingBass: { checked: false },
    drumsSelect: { value: '' },
    displayMode: { value: '' },
    harmonyDisplayMode: { value: '' },
    useMajorTriangleSymbol: { checked: false },
    useHalfDiminishedSymbol: { checked: false },
    useDiminishedSymbol: { checked: false },
    showBeatIndicator: { checked: false },
    hideCurrentHarmony: { checked: false },
    masterVolume: { value: '' },
    bassVolume: { value: '' },
    stringsVolume: { value: '' },
    drumsVolume: { value: '' }
  },
  state: {
    getProgressions: () => ({ Autumn: { name: 'Autumn', mode: 'roman' } }),
    setLastPatternSelectValue: () => {},
    setPianoFadeSettings: (value) => { resetPianoFadeSettings = value; },
    setPianoMidiSettings: (value) => { resetPianoMidiSettings = value; },
    setNextPreviewLeadValue: (value) => { resetPreviewLeadValue = value; }
  },
  helpers: {
    createDefaultAppSettings: () => ({
      majorMinor: false,
      tempo: 120,
      repetitionsPerKey: 2,
      transposition: '0',
      chordsPerBar: 1,
      compingStyle: 'piano',
      customMediumSwingBass: true,
      drumsMode: 'full_swing',
      enabledKeys: new Array(12).fill(true),
      displayMode: 'show-both',
      harmonyDisplayMode: 'default',
      useMajorTriangleSymbol: true,
      useHalfDiminishedSymbol: true,
      useDiminishedSymbol: true,
      showBeatIndicator: true,
      hideCurrentHarmony: false,
      masterVolume: '50',
      bassVolume: '100',
      stringsVolume: '100',
      drumsVolume: '100',
      pianoFadeSettings: { timeConstantLow: 0.1 },
      pianoMidiSettings: { enabled: false },
      nextPreviewLeadValue: 2,
      nextPreviewUnit: 'bars'
    }),
    clearProgressionEditingState: () => {},
    closeProgressionManager: () => {},
    setPatternSelectValue: () => {},
    getSelectedProgressionName: () => 'Autumn Leaves',
    setEditorPatternMode: () => {},
    getSelectedProgressionMode: () => 'roman',
    syncDoubleTimeToggle: () => {},
    applyEnabledKeys: (value) => { resetAppliedKeys = value; },
    normalizePianoFadeSettings: (value) => value,
    normalizePianoMidiSettings: (value) => value,
    stopAllMidiPianoVoices: () => {},
    syncPianoToolsUi: () => {},
    attachMidiInput: () => {},
    setNextPreviewInputUnit: () => {},
    applyMixerSettings: () => {},
    syncNextPreviewControlDisplay: () => {},
    applyDisplayMode: () => {},
    applyBeatIndicatorVisibility: () => {},
    applyCurrentHarmonyVisibility: () => {},
    syncCustomPatternUI: () => {},
    syncProgressionManagerState: () => {},
    applyPatternModeAvailability: () => {},
    syncPatternPreview: () => {},
    refreshDisplayedHarmony: () => {},
    saveSettings: () => {},
    trackEvent: (name) => { resetTrackedEvent = name; }
  }
});
resetPlaybackSettings();
assert.equal(
  resetAppliedKeys.length,
  12,
  'Practice playback-settings resetter reapplies the default enabled-key set.'
);
assert.equal(
  resetPreviewLeadValue,
  2,
  'Practice playback-settings resetter restores the next-preview lead value from default app settings.'
);
assert.equal(
  resetPianoFadeSettings.timeConstantLow,
  0.1,
  'Practice playback-settings resetter restores piano fade settings through the shared settings boundary.'
);
assert.equal(
  resetPianoMidiSettings.enabled,
  false,
  'Practice playback-settings resetter restores piano MIDI settings through the shared settings boundary.'
);
assert.equal(
  resetTrackedEvent,
  'settings_reset',
  'Practice playback-settings resetter keeps the settings-reset analytics event.'
);
let finalizerSaved = false;
let finalizerResetDraft = false;
let finalizerAppliedFingerprint = '';
const finalizeDrillLoadedSettings = createDrillLoadedSettingsFinalizer({
  constants: {
    customPatternOptionValue: '__custom__'
  },
  dom: {
    repetitionsPerKey: { value: '' },
    patternName: { value: 'My Draft' },
    customPattern: { value: 'II-V-I' },
    patternMode: { value: 'roman' },
    debugToggle: { checked: false }
  },
  state: {
    getAppliedDefaultProgressionsFingerprint: () => '',
    setAppliedDefaultProgressionsFingerprint: (value) => { finalizerAppliedFingerprint = value; },
    getHadStoredProgressions: () => false,
    getSavedPatternSelection: () => '__custom__',
    getIsCreatingProgression: () => false,
    setLastStandaloneCustomName: () => {},
    setLastStandaloneCustomPattern: () => {},
    setLastStandaloneCustomMode: () => {},
    getShouldPersistRecoveredDefaultProgressions: () => true,
    setShouldPersistRecoveredDefaultProgressions: () => {}
  },
  helpers: {
    getDefaultProgressionsFingerprint: () => 'defaults@2',
    syncPianoToolsUi: () => {},
    applyMixerSettings: () => {},
    syncNextPreviewControlDisplay: () => {},
    applyBeatIndicatorVisibility: () => {},
    applyCurrentHarmonyVisibility: () => {},
    getRepetitionsPerKey: () => 3,
    normalizePresetName: (value) => value,
    normalizePatternString: (value) => value,
    normalizePatternMode: (value) => value,
    resetStandaloneCustomDraft: () => { finalizerResetDraft = true; },
    getAnalyticsDebugEnabled: () => true,
    syncProgressionManagerState: () => {},
    applyPatternModeAvailability: () => {},
    saveSettings: () => { finalizerSaved = true; }
  }
});
finalizeDrillLoadedSettings();
assert.equal(
  finalizerAppliedFingerprint,
  'defaults@2',
  'Drill loaded-settings finalizer restores the default fingerprint when none was stored.'
);
assert.equal(
  finalizerSaved,
  true,
  'Drill loaded-settings finalizer persists recovered default progressions when needed.'
);
assert.equal(
  finalizerResetDraft,
  false,
  'Drill loaded-settings finalizer preserves standalone custom drafts when the custom pattern remains selected.'
);
let trackedSessionEvents = [];
let sessionStartTracked = false;
let sessionEngagedTracked = false;
let sessionDurationTracked = false;
let sessionActionCount = 0;
const drillSessionAnalytics = createDrillSessionAnalytics({
  dom: {
    tempoSlider: { value: '132' },
    patternSelect: { value: 'Autumn Leaves' },
    drumsSelect: { value: 'full_swing' },
    displayMode: { value: 'show-both' },
    harmonyDisplayMode: { value: 'default' },
    transpositionSelect: { value: '2' }
  },
  state: {
    getSessionStartedAt: () => 0,
    getSessionStartTracked: () => sessionStartTracked,
    setSessionStartTracked: (value) => { sessionStartTracked = value; },
    getSessionEngagedTracked: () => sessionEngagedTracked,
    setSessionEngagedTracked: (value) => { sessionEngagedTracked = value; },
    getSessionDurationTracked: () => sessionDurationTracked,
    setSessionDurationTracked: (value) => { sessionDurationTracked = value; },
    getSessionActionCount: () => sessionActionCount,
    setSessionActionCount: (value) => { sessionActionCount = value; }
  },
  helpers: {
    trackEvent: (name, props) => { trackedSessionEvents.push({ name, props }); },
    getCurrentPatternString: () => 'II-V-I',
    parseOneChordSpec: () => ({ active: false, qualities: [] }),
    getCurrentPatternMode: () => 'roman',
    getPatternModeLabel: (value) => value,
    hasSelectedProgression: () => true,
    toAnalyticsToken: (value) => String(value).toLowerCase().replaceAll(' ', '_'),
    analyzePattern: () => ({ chords: [{}, {}, {}], hasOverride: false }),
    matchesOneChordQualitySet: () => false,
    getChordsPerBar: () => 2,
    getRepetitionsPerKey: () => 2,
    getCompingStyle: () => 'piano',
    normalizeDisplayMode: (value) => value,
    normalizeHarmonyDisplayMode: (value) => value,
    getEnabledKeyCount: () => 12
  },
  constants: {
    oneChordDefaultQualities: ['maj7'],
    oneChordDominantQualities: ['13']
  },
  now: () => 35000
});
drillSessionAnalytics.registerSessionAction('start_button');
drillSessionAnalytics.registerSessionAction('tempo_change');
drillSessionAnalytics.registerSessionAction('pattern_change');
drillSessionAnalytics.trackSessionDuration();
assert.equal(
  trackedSessionEvents[0].name,
  'session_start',
  'Drill session analytics tracks the first session entrypoint once.'
);
assert.equal(
  trackedSessionEvents.some((entry) => entry.name === 'session_engaged'),
  true,
  'Drill session analytics emits engagement once the interaction threshold is crossed.'
);
assert.equal(
  drillSessionAnalytics.getPlaybackAnalyticsProps().tempo_bucket,
  'medium',
  'Drill session analytics derives playback buckets from the current transport settings.'
);
assert.equal(
  drillSessionAnalytics.getProgressionAnalyticsProps().progression_id,
  'preset_autumn_leaves',
  'Drill session analytics preserves progression identifiers for preset playback telemetry.'
);
let capturedPracticePlaybackRuntimeHostOptions = null;
const PracticePlaybackRuntimeHost = createPracticePlaybackRuntimeHost({
  dom: {},
  state: {
    getCurrentBassPlan: () => [],
    setCurrentBassPlan: () => {},
    getCurrentBeat: () => 0,
    setCurrentBeat: () => {},
    getCurrentChordIdx: () => 0,
    setCurrentChordIdx: () => {},
    getCurrentCompingPlan: () => [],
    setCurrentCompingPlan: () => {},
    getCurrentKey: () => 0,
    setCurrentKey: () => {},
    getCurrentKeyRepetition: () => 0,
    setCurrentKeyRepetition: () => {},
    getCurrentOneChordQualityValue: () => 'maj7',
    setCurrentOneChordQualityValue: () => {},
    getCurrentRawChords: () => [],
    setCurrentRawChords: () => {},
    getCurrentVoicingPlan: () => [],
    setCurrentVoicingPlan: () => {},
    getIsIntro: () => false,
    setIsIntro: () => {},
    getIsPaused: () => false,
    getIsPlaying: () => false,
    getLastPlayedChordIdx: () => -1,
    setLastPlayedChordIdx: () => {},
    getLoopVoicingTemplate: () => null,
    setLoopVoicingTemplate: () => {},
    getNextBeatTime: () => 0,
    setNextBeatTime: () => {},
    getNextCompingPlan: () => [],
    setNextCompingPlan: () => {},
    getNextKeyValue: () => null,
    setNextKeyValue: () => {},
    getNextOneChordQualityValue: () => 'maj7',
    setNextOneChordQualityValue: () => {},
    getNextPaddedChords: () => [],
    setNextPaddedChords: () => {},
    getNextRawChords: () => [],
    setNextRawChords: () => {},
    getNextVoicingPlan: () => [],
    setNextVoicingPlan: () => {},
    getPaddedChords: () => [],
    setPaddedChords: () => {},
    getFirstPlayStartTracked: () => false,
    setFirstPlayStartTracked: () => {},
    getPlayStopSuggestionCount: () => 0,
    setPlayStopSuggestionCount: () => {},
    getKeyPool: () => [],
    setKeyPool: () => {},
    getSchedulerTimer: () => null,
    setSchedulerTimer: () => {}
  },
  audio: {
    getAudioContext: () => null,
    setAudioContext: () => {},
    getActiveNoteGain: () => null,
    setActiveNoteGain: () => {}
  },
  preload: {
    getPendingDisplayTimeouts: () => new Set(),
    getNearTermSamplePreloadPromise: () => null,
    setNearTermSamplePreloadPromise: () => {},
    getStartupSamplePreloadInProgress: () => false,
    setStartupSamplePreloadInProgress: () => {}
  },
  constants: {
    scheduleAhead: 0.15,
    noteFadeout: 0.26,
    scheduleInterval: 25
  },
  helpers: {
    applyDisplaySideLayout: () => {},
    buildPreparedBassPlan: () => {},
    buildLegacyVoicingPlan: () => [],
    buildLoopRepVoicings: () => [],
    buildPreparedCompingPlans: () => {},
    buildVoicingPlanForSlots: () => [],
    bassMidiToNoteName: () => 'C2',
    canLoopTrimProgression: () => false,
    chordSymbolHtml: () => '',
    chordSymbol: () => '',
    compingEngine: { stopActiveComping: () => {} },
    createOneChordToken: () => ({}),
    createVoicingSlot: () => ({}),
    fitHarmonyDisplay: () => {},
    getBassMidi: () => 36,
    getBeatsPerChord: () => 4,
    getChordsPerBar: () => 1,
    getCompingStyle: () => 'piano',
    getCurrentPatternString: () => 'II-V-I',
    getPatternKeyOverridePitchClass: () => null,
    isWalkingBassDebugEnabled: () => false,
    getRemainingBeatsUntilNextProgression: () => 4,
    getRepetitionsPerKey: () => 2,
    getSecondsPerBeat: () => 0.5,
    hideNextCol: () => {},
    ensureNearTermSamplePreload: async () => null,
    isWalkingBassEnabled: () => true,
    isChordsEnabled: () => true,
    isVoiceLeadingV2Enabled: () => false,
    keyName: () => 'C',
    nextKey: () => 0,
    padProgression: (value) => value,
    parseOneChordSpec: () => ({ active: false, qualities: [] }),
    parsePattern: () => [],
    playClick: () => {},
    playNote: () => {},
    keyNameHtml: () => 'C',
    renderAccidentalTextHtml: () => '',
    scheduleDrumsForBeat: () => {},
    shouldShowNextPreview: () => false,
    showNextCol: () => {},
    takeNextOneChordQuality: () => 'maj7',
    trackProgressionOccurrence: () => {},
    updateBeatDots: () => {},
    clearBeatDots: () => {},
    clearScheduledDisplays: () => {},
    ensureWalkingBassGenerator: async () => null,
    ensureSessionStarted: () => {},
    getPlaybackAnalyticsProps: () => ({}),
    getProgressionAnalyticsProps: () => ({}),
    initAudio: () => {},
    preloadStartupSamples: async () => null,
    registerSessionAction: () => {},
    setDisplayPlaceholderMessage: () => {},
    setDisplayPlaceholderVisible: () => {},
    stopActiveComping: () => {},
    stopScheduledAudio: () => {},
    trackEvent: () => {},
    trackProgressionEvent: () => {}
  },
  createRuntimeAppAssembly: (options) => {
    capturedPracticePlaybackRuntimeHostOptions = options;
    return {
      prepareNextProgressionPlayback: () => {},
      scheduleBeatPlayback: () => {},
      scheduleDisplayPlayback: () => {},
      start: () => {},
      stop: () => {},
      togglePause: () => {}
    };
  }
});
assert.equal(
  typeof PracticePlaybackRuntimeHost.start,
  'function',
  'Practice playback runtime host exposes transport controls through the extracted host boundary.'
);
assert.equal(
  typeof capturedPracticePlaybackRuntimeHostOptions?.schedulerBindings?.getCurrentBeat,
  'function',
  'Practice playback runtime host forwards grouped state into the injected runtime adapter.'
);
let pianoFacadeSaved = false;
let pianoFacadeAttachCount = 0;
const pianoFacadeDom = {
  pianoMidiStatus: { textContent: '' },
  pianoSettingsJson: { value: '' },
  pianoTimeConstantLow: { value: '' },
  pianoTimeConstantHigh: { value: '' },
  pianoMidiEnabled: { checked: false },
  pianoMidiSustain: { checked: false },
  pianoMidiInput: { value: '' }
};
let pianoFacadeFadeSettings = { timeConstantLow: 0.15, timeConstantHigh: 0.3 };
let pianoFacadeMidiSettings = { enabled: false, inputId: 'midi-1', sustainPedalEnabled: true };
const pianoToolsFacade = createDrillPianoToolsAppFacade({
  dom: pianoFacadeDom,
  version: 2,
  getPianoFadeSettings: () => pianoFacadeFadeSettings,
  setPianoFadeSettings: (value) => { pianoFacadeFadeSettings = value; },
  normalizePianoFadeSettings: (value) => value,
  getPianoMidiSettings: () => pianoFacadeMidiSettings,
  setPianoMidiSettings: (value) => { pianoFacadeMidiSettings = value; },
  normalizePianoMidiSettings: (value) => value,
  attachMidiInput: () => { pianoFacadeAttachCount += 1; },
  saveSettings: () => { pianoFacadeSaved = true; }
});
pianoToolsFacade.setPianoMidiStatus('ready');
pianoToolsFacade.refreshPianoSettingsJson();
pianoToolsFacade.applyPianoMidiSettings({
  enabled: true,
  inputId: 'midi-2',
  sustainPedalEnabled: false
});
assert.equal(
  pianoFacadeDom.pianoMidiStatus.textContent,
  'ready',
  'Drill piano-tools facade forwards MIDI status updates to the shared UI helper.'
);
assert.equal(
  JSON.parse(pianoFacadeDom.pianoSettingsJson.value).version,
  2,
  'Drill piano-tools facade refreshes the serialized preset JSON from current app state.'
);
assert.equal(
  pianoFacadeAttachCount,
  1,
  'Drill piano-tools facade reconnects MIDI inputs when piano MIDI settings change.'
);
assert.equal(
  pianoFacadeSaved,
  true,
  'Drill piano-tools facade persists piano settings changes through the shared save boundary.'
);
assert.equal(
  createDrillPianoToolsAppBindings({
    version: 2
  }).version,
  2,
  'Drill piano-tools app bindings preserve grouped piano-settings facade concerns.'
);
assert.equal(
  createPracticePlaybackStateBindings({
    isEmbeddedMode: true,
    getIsPlaying: () => true
  }).isEmbeddedMode,
  true,
  'Drill runtime app bindings preserve embedded-mode state flags.'
);
assert.equal(
  typeof createPracticePatternUiBindings({
    validateCustomPattern: () => true
  }).validateCustomPattern,
  'function',
  'Drill runtime app bindings preserve pattern-UI actions consumed by the embedded runtime.'
);
assert.equal(
  typeof createDrillNormalizationBindings({
    normalizePatternMode: (value) => value
  }).normalizePatternMode,
  'function',
  'Drill runtime app bindings preserve normalization helpers used by the embedded runtime boundary.'
);
assert.equal(
  typeof createPracticePlaybackSettingsBindings({
    applyMixerSettings: () => {}
  }).applyMixerSettings,
  'function',
  'Drill runtime app bindings preserve playback-settings hooks consumed by the embedded runtime.'
);
assert.equal(
  createPracticePlaybackRuntimeBindings({
    noteFadeout: 0.26
  }).noteFadeout,
  0.26,
  'Drill runtime app bindings preserve playback-runtime constants.'
);
assert.equal(
  typeof createDrillTransportActionBindings({
    startPlayback: async () => {}
  }).startPlayback,
  'function',
  'Drill runtime app bindings preserve transport actions for shared runtime assembly.'
);
assert.equal(
  typeof createDrillEmbeddedRuntimeContextBindings({
    patternUi: { validateCustomPattern: () => true },
    transportActions: { startPlayback: async () => {} }
  }).patternUi.validateCustomPattern,
  'function',
  'Drill runtime app bindings can assemble the full embedded runtime context from grouped concerns.'
);
let hostSuppressedPatternSelect = false;
let hostLastPatternSelectValue = '';
const embeddedRuntimeHostBindings = createDrillEmbeddedRuntimeHostBindings({
  dom: {
    patternSelect: { value: 'custom' },
    patternName: { value: '' },
    customPattern: { value: '' },
    patternError: { textContent: 'Host error' },
    tempoSlider: { value: '132' }
  },
  customPatternOptionValue: '__custom__',
  setSuppressPatternSelectChange: (value) => { hostSuppressedPatternSelect = value; },
  setPatternSelectValue: (value) => { hostLastPatternSelectValue = value; },
  setEditorPatternMode: () => {},
  syncPatternSelectionFromInput: () => {},
  getLastPatternSelectValue: () => hostLastPatternSelectValue,
  setLastPatternSelectValue: (value) => { hostLastPatternSelectValue = value; },
  getIsPlaying: () => true,
  getTempo: () => 132,
  getCurrentKey: () => 5,
  startPlayback: async () => {},
  stopPlayback: () => {},
  togglePausePlayback: () => {}
});
embeddedRuntimeHostBindings.patternUi.setCustomPatternSelection();
assert.equal(
  hostSuppressedPatternSelect,
  true,
  'Drill embedded runtime host bindings can toggle pattern-select suppression before forcing the custom option.'
);
assert.equal(
  hostLastPatternSelectValue,
  '__custom__',
  'Drill embedded runtime host bindings can force the custom pattern option value.'
);
assert.equal(
  embeddedRuntimeHostBindings.patternUi.getPatternErrorText(),
  'Host error',
  'Drill embedded runtime host bindings surface the current pattern error text from the DOM.'
);
assert.equal(
  embeddedRuntimeHostBindings.playbackState.getTempo(),
  132,
  'Drill embedded runtime host bindings expose playback-state getters for the embedded runtime.'
);
const embeddedRuntimeAssembly = createDrillEmbeddedRuntimeAppAssembly({
  dom: {
    patternError: { textContent: 'Assembly error', classList: { contains: () => false } }
  },
  host: {
    customPatternOptionValue: '__custom__',
    setSuppressPatternSelectChange: () => {},
    setPatternSelectValue: () => {},
    setEditorPatternMode: () => {},
    syncPatternSelectionFromInput: () => {},
    getLastPatternSelectValue: () => '',
    setLastPatternSelectValue: () => {},
    getIsPlaying: () => true,
    getTempo: () => 120,
    getCurrentKey: () => 2,
    startPlayback: async () => {},
    stopPlayback: () => {},
    togglePausePlayback: () => {}
  },
  patternUi: {
    validateCustomPattern: () => true,
    getCurrentPatternString: () => 'ii v i',
    getCurrentPatternMode: () => 'both'
  },
  normalization: {
    normalizePatternString: (value) => value,
    normalizePresetName: (value) => value,
    normalizePatternMode: (value) => value,
    normalizeCompingStyle: (value) => value,
    normalizeRepetitionsPerKey: (value) => Number(value),
    normalizeDisplayMode: (value) => value,
    normalizeHarmonyDisplayMode: (value) => value
  },
  playbackSettings: {
    getSwingRatio: () => 0.5,
    getCompingStyle: () => 'piano',
    getDrumsMode: () => 'full_swing',
    isWalkingBassEnabled: () => true,
    getRepetitionsPerKey: () => 2,
    applyMixerSettings: () => {}
  },
  playbackState: {
    isEmbeddedMode: true
  },
  playbackRuntime: {
    ensureWalkingBassGenerator: async () => {},
    noteFadeout: 0.26,
    stopActiveChordVoices: () => {},
    rebuildPreparedCompingPlans: () => {},
    buildPreparedBassPlan: () => {},
    preloadNearTermSamples: async () => {}
  }
});
assert.equal(
  typeof embeddedRuntimeAssembly.playbackControllerOptions.startPlayback,
  'function',
  'Drill embedded runtime app assembly builds transport actions into the final runtime options object.'
);
assert.equal(
  embeddedRuntimeAssembly.playbackStateOptions.isEmbeddedMode,
  true,
  'Drill embedded runtime app assembly preserves embedded playback-state flags.'
);
const capturedMixerCalls = [];
const audioRuntimeSampleBuffers = { bass: {}, cello: {}, violin: {}, piano: {}, drums: {} };
const audioRuntime = createPlaybackAudioRuntime({
  sampleBuffers: audioRuntimeSampleBuffers,
  sampleLoadPromises: {
    bass: new Map(),
    cello: new Map(),
    violin: new Map(),
    piano: new Map(),
    drums: new Map()
  },
  sampleFileBuffers: new Map(),
  sampleFileFetchPromises: new Map(),
  getAudioContext: () => ({
    currentTime: 1.25,
    decodeAudioData: async (buffer) => ({ decodedByteLength: buffer.byteLength })
  }),
  appVersion: 'test-version',
  fetchImpl: async (url) => ({
    ok: true,
    arrayBuffer: async () => {
      capturedMixerCalls.push(`fetch:${url}`);
      return new Uint8Array([1, 2, 3, 4]).buffer;
    }
  })
});
const mixerOutputs = {
  masterValue: { value: '', textContent: '' },
  bassValue: { value: '', textContent: '' },
  stringsValue: { value: '', textContent: '' },
  drumsValue: { value: '', textContent: '' }
};
audioRuntime.applyMixerSettings({
  dom: {
    masterVolume: { value: '50' },
    masterVolumeValue: mixerOutputs.masterValue,
    bassVolume: { value: '25' },
    bassVolumeValue: mixerOutputs.bassValue,
    stringsVolume: { value: '75' },
    stringsVolumeValue: mixerOutputs.stringsValue,
    drumsVolume: { value: '10' },
    drumsVolumeValue: mixerOutputs.drumsValue
  },
  mixerNodes: {
    master: { gain: { setValueAtTime: (value, time) => capturedMixerCalls.push(`master:${value}:${time}`) } },
    bass: { gain: { setValueAtTime: (value, time) => capturedMixerCalls.push(`bass:${value}:${time}`) } },
    strings: { gain: { setValueAtTime: (value, time) => capturedMixerCalls.push(`strings:${value}:${time}`) } },
    drums: { gain: { setValueAtTime: (value, time) => capturedMixerCalls.push(`drums:${value}:${time}`) } }
  },
  audioCtx: { currentTime: 1.25 },
  sliderValueToGain: (slider) => Number(slider?.value || 0) / 100,
  mixerChannelCalibration: { master: 1, bass: 2, strings: 3, drums: 4 }
});
assert.equal(mixerOutputs.masterValue.textContent, '50%', 'Drill audio runtime updates mixer output labels.');
assert.ok(
  capturedMixerCalls.includes('bass:0.5:1.25'),
  'Drill audio runtime applies calibrated gain values to mixer nodes.'
);
await audioRuntime.fetchArrayBufferFromUrl('assets/test.mp3');
await audioRuntime.fetchArrayBufferFromUrl('assets/test.mp3');
assert.equal(
  capturedMixerCalls.filter((entry) => entry === 'fetch:assets/test.mp3?v=test-version').length,
  1,
  'Drill audio runtime memoizes fetched sample array buffers.'
);
await audioRuntime.loadSample('bass', 'Bass', 40);
assert.equal(
  audioRuntimeSampleBuffers.bass[40].decodedByteLength,
  4,
  'Drill audio runtime stores decoded sample buffers by category and midi.'
);
const audioRuntimeAppContext = createPlaybackAudioRuntimeAppContext({
  audioState: {
    getAudioContext: () => audioRuntimeContext
  },
  cacheState: {
    sampleBuffers: { bass: {}, cello: {}, violin: {}, piano: {}, drums: {} },
    sampleLoadPromises: {
      bass: new Map(),
      cello: new Map(),
      violin: new Map(),
      piano: new Map(),
      drums: new Map()
    },
    sampleFileBuffers: new Map(),
    sampleFileFetchPromises: new Map()
  },
  constants: {
    appVersion: 'test'
  }
});
assert.equal(
  typeof audioRuntimeAppContext.loadSample,
  'function',
  'Drill audio runtime app context materializes the shared sample-loading runtime from grouped app concerns.'
);
const audioStackAssembly = createPlaybackAudioStackAppAssembly({
  audioRuntime: {
    audioState: {
      getAudioContext: () => audioRuntimeContext
    },
    cacheState: {
      sampleBuffers: { bass: {}, cello: {}, violin: {}, piano: {}, drums: {} },
      sampleLoadPromises: {
        bass: new Map(),
        cello: new Map(),
        violin: new Map(),
        piano: new Map(),
        drums: new Map()
      },
      sampleFileBuffers: new Map(),
      sampleFileFetchPromises: new Map()
    },
    constants: {
      appVersion: 'stack-test'
    }
  },
  samplePreload: {
    playbackSettings: {
      getBassPreloadRange: () => ({ low: 36, high: 36 }),
      getBassMidi: () => 36,
      getBeatsPerChord: () => 2,
      getChordsPerBar: () => 2,
      getCompingStyle: () => 'strings',
      getDrumsMode: () => 'off'
    },
    progressionState: {
      getCurrentChords: () => [],
      getCurrentKey: () => 0,
      getCurrentVoicingPlan: () => [],
      getCurrentBassPlan: () => [],
      getNextChords: () => [],
      getNextKey: () => 0,
      getNextVoicingPlan: () => []
    },
    sampleLoading: {},
    constants: {}
  },
  scheduledAudio: {
    audioState: {
      getAudioContext: () => ({ currentTime: 0 })
    },
    audioHelpers: {
      stopActiveComping: () => {}
    },
    constants: {
      getDefaultFadeDuration: () => 0.25
    }
  },
  audioPlayback: {
    audioState: {
      getAudioContext: () => null,
      setAudioContext: () => {},
      getMixerNodes: () => null,
      setMixerNodes: () => {},
      sampleBuffers: { drums: {} }
    },
    audioHelpers: {
      createAudioContext: () => ({
        destination: {},
        createGain() {
          return { gain: { setValueAtTime() {} }, connect(target) { return target; } };
        }
      }),
      applyMixerSettings: () => {},
      trackScheduledSource: () => {}
    },
    playbackSettings: {
      getDrumsMode: () => 'off',
      getSwingRatio: () => 0.5
    },
    constants: {
      metronomeGainMultiplier: 1,
      drumsGainMultiplier: 1,
      drumModeOff: 'off',
      drumModeMetronome24: 'metronome_2_4',
      drumModeHihats24: 'hihats_2_4',
      drumModeFullSwing: 'full_swing',
      drumRideSampleUrls: []
    }
  },
  samplePlayback: {
    audioState: {
      getAudioContext: () => ({
        currentTime: 0,
        createBufferSource() {
          return {
            detune: { value: 0 },
            playbackRate: { value: 1 },
            connect(target) { return target; },
            start() {},
            stop() {}
          };
        },
        createGain() {
          return {
            gain: {
              value: 1,
              setValueAtTime() {},
              linearRampToValueAtTime() {},
              setTargetAtTime() {},
              cancelScheduledValues() {}
            },
            connect(target) { return target; }
          };
        }
      }),
      sampleBuffers: { bass: {}, piano: {}, cello: {} }
    },
    audioHelpers: {
      getMixerDestination: () => ({ channel: 'strings' }),
      trackScheduledSource: () => {},
      loadSample: async () => null,
      getPianoFadeProfile: () => ({ fadeBefore: 0.2, timeConstant: 0.05 })
    },
    playbackState: {
      getActiveNoteGain: () => null,
      setActiveNoteGain: () => {},
      setActiveNoteFadeOut: () => {}
    },
    constants: {
      noteFadeout: 0.25,
      bassNoteAttack: 0.005,
      bassNoteOverlap: 0.1,
      bassNoteRelease: 0.075,
      bassGainReleaseTimeConstant: 0.012,
      chordFadeBefore: 0.1,
      chordFadeDuration: 0.2,
      bassGain: 0.8,
      stringLoopStart: 1,
      stringLoopEnd: 3,
      stringLoopCrossfade: 0.1
    }
  }
});
assert.equal(
  typeof audioStackAssembly.audioRuntime.loadSample,
  'function',
  'Drill audio stack app assembly materializes the shared runtime layers from grouped app concerns.'
);
const audioStackFacade = createPlaybackAudioStackAppFacade({
  audioStack: {
    audioRuntime: { loadSample: () => 'loaded' },
    samplePreload: {
      ensureNearTermSamplePreload: () => 'near-term'
    },
    scheduledAudio: {
      stopScheduledAudio: (time) => `stop:${time}`,
      stopActiveChordVoices: (time, fadeDuration) => `voices:${time}:${fadeDuration}`,
      clearScheduledDisplays: () => 'cleared',
      trackScheduledSource: (source, gains) => ({ source, gains }),
      getPendingDisplayTimeouts: () => new Set([1])
    },
    audioPlayback: {
      initAudio: () => 'init-audio'
    },
    samplePlayback: {
      playSample: (...args) => args
    }
  },
  getCurrentTime: () => 12,
  defaultFadeDuration: 0.33
});
assert.equal(
  audioStackFacade.loadSample(),
  'loaded',
  'Drill audio stack app facade forwards audio-runtime methods.'
);
assert.equal(
  audioStackFacade.stopScheduledAudio(),
  'stop:12',
  'Drill audio stack app facade applies default current-time behavior for scheduled audio.'
);
assert.equal(
  audioStackFacade.stopActiveChordVoices(),
  'voices:12:0.33',
  'Drill audio stack app facade applies default fade behavior for active chord voices.'
);
assert.equal(
  createPlaybackAudioStackAppBindings({
    audioRuntime: { test: true }
  }).audioRuntime.test,
  true,
  'Drill audio-stack app bindings preserve grouped audio-runtime concerns for the shared stack assembly.'
);
assert.equal(
  createPlaybackAudioStackFacadeAppBindings({
    defaultFadeDuration: 0.26
  }).defaultFadeDuration,
  0.26,
  'Drill audio-stack facade app bindings preserve facade timing defaults.'
);
assert.equal(
  createPlaybackAudioRuntimeAppBindings({
    audioFacade: { defaultFadeDuration: 0.25 }
  }).audioFacade.defaultFadeDuration,
  0.25,
  'Drill audio runtime app bindings preserve grouped runtime concerns for the shared audio seam.'
);
assert.equal(
  createPlaybackAudioFacadeAppSurface({
    loadSample: () => 'sample-loaded'
  }).loadPlaybackAudioSample(),
  'sample-loaded',
  'Drill audio facade app surface materializes stable app-local aliases over the shared audio facade.'
);
const drillAudioRuntimeAssembly = createPlaybackAudioRuntimeAppAssembly({
  audioStack: {
    audioRuntime: {
      audioState: { getAudioContext: () => null },
      cacheState: {},
      constants: {}
    },
    samplePreload: {},
    scheduledAudio: {},
    audioPlayback: {},
    samplePlayback: {}
  },
  audioFacade: {
    getCurrentTime: () => 0,
    defaultFadeDuration: 0.25
  }
});
assert.equal(
  typeof drillAudioRuntimeAssembly.audioSurface.stopPlaybackScheduledAudio,
  'function',
  'Drill audio runtime app assembly materializes the shared audio stack, facade, and app-facing surface through one boundary.'
);
assert.equal(
  createPracticeArrangementCompingEngineAppBindings({
    helpers: { getSwingRatio: () => 0.5 }
  }).helpers.getSwingRatio(),
  0.5,
  'Drill comping-engine app bindings preserve shared helper callbacks for the playback engine.'
);
assert.equal(
  createPracticePlaybackResourcesAppBindings({
    runtime: { compingEngine: { id: 'comping' } }
  }).runtime.compingEngine.id,
  'comping',
  'Practice playback-resources app bindings preserve grouped runtime resources consumed by the shared preparation layer.'
);
assert.equal(
  createPracticePlaybackRuntimeHostAppBindings({
    constants: { noteFadeout: 0.26 }
  }).constants.noteFadeout,
  0.26,
  'Practice playback-runtime host app bindings preserve transport constants for the shared runtime host.'
);
assert.equal(
  createDrillRuntimePrimitivesAppBindings({
    patternAnalysis: { defaultChordsPerBar: 2 }
  }).patternAnalysis.defaultChordsPerBar,
  2,
  'Drill runtime-primitives app bindings preserve grouped pattern-analysis constants.'
);
assert.equal(
  createPracticePlaybackAppBindings({
    direct: { playbackState: { getIsPlaying: () => true } }
  }).direct.playbackState.getIsPlaying(),
  true,
  'Drill shared-playback app bindings preserve grouped direct-runtime concerns for the shared playback assembly.'
);
assert.equal(
  createPracticePlaybackRuntimeAppBindings({
    embedded: { playbackState: { isEmbeddedMode: true } }
  }).embedded.playbackState.isEmbeddedMode,
  true,
  'Drill shared-playback runtime app bindings preserve grouped embedded/direct runtime concerns before the shared playback boundary.'
);
assert.equal(
  createPracticePlaybackRuntimeHostAppContextBindings({
    constants: { scheduleAhead: 0.2 }
  }).constants.scheduleAhead,
  0.2,
  'Practice playback-runtime app bindings preserve grouped runtime-host concerns before the shared host boundary.'
);
assert.equal(
  createPracticePlaybackResourcesRuntimeAppBindings({
    runtime: { compingEngine: { id: 'comping' } }
  }).runtime.compingEngine.id,
  'comping',
  'Practice playback-resources runtime app bindings preserve grouped playback-resource concerns before the shared resources boundary.'
);
assert.equal(
  createDrillRuntimeStateAppBindings({
    keyPool: { getEnabledKeys: () => [true] }
  }).keyPool.getEnabledKeys()[0],
  true,
  'Drill runtime-state app bindings preserve grouped runtime-state concerns before the shared runtime-state boundary.'
);
assert.equal(
  createDrillRuntimePrimitivesRuntimeAppBindings({
    playbackSettings: { constants: { compingStyleOff: 'off' } }
  }).playbackSettings.constants.compingStyleOff,
  'off',
  'Drill runtime-primitives runtime app bindings preserve grouped primitive-runtime concerns before the shared primitives boundary.'
);
assert.equal(
  createDrillSettingsRuntimeAppBindings({
    defaults: { tempo: 120 }
  }).defaults.tempo,
  120,
  'Drill settings runtime app bindings preserve grouped settings concerns before the shared settings boundary.'
);
assert.equal(
  createPracticeArrangementVoicingRuntimeAppBindings({
    violinHigh: 84
  }).violinHigh,
  84,
  'Drill voicing-runtime app bindings preserve voicing-range constants for the shared harmony runtime.'
);
assert.equal(
  createPracticeArrangementWalkingBassAppBindings({
    constants: { BASS_LOW: 28 }
  }).constants.BASS_LOW,
  28,
  'Drill walking-bass app bindings preserve grouped bass-range constants for the walking-bass runtime.'
);
const samplePreloadEvents = [];
const samplePreloadRuntime = createPlaybackSamplePreloadRuntime({
  getBassPreloadRange: () => ({ low: 36, high: 37 }),
  getBassMidi: (key, semitoneOffset) => 36 + key + semitoneOffset,
  getBeatsPerChord: () => 2,
  getChordsPerBar: () => 2,
  getCompingStyle: () => 'strings',
  getDrumsMode: () => 'full_swing',
  getCurrentProgression: () => ({
    chords: [{ semitones: 0 }, { semitones: 7 }],
    key: 0,
    voicingPlan: [
      { cello: [48], violin: [60], piano: [72] },
      { cello: [50], violin: [62], piano: [74] }
    ],
    bassPlan: [{ timeBeats: 0, midi: 35 }]
  }),
  getNextProgression: () => ({
    chords: [{ semitones: 5 }],
    key: 5,
    voicingPlan: [
      { cello: [53], violin: [65], piano: [77] }
    ]
  }),
  collectCompingSampleNotes: (_style, voicing, noteSets) => {
    for (const midi of voicing.cello || []) noteSets.celloNotes.add(midi);
    for (const midi of voicing.violin || []) noteSets.violinNotes.add(midi);
    for (const midi of voicing.piano || []) noteSets.pianoNotes.add(midi);
  },
  loadSample: async (category, folder, midi) => {
    samplePreloadEvents.push(`sample:${category}:${folder}:${midi}`);
  },
  loadPianoSampleList: async (midiValues) => {
    samplePreloadEvents.push(`piano:${[...midiValues].sort((a, b) => a - b).join(',')}`);
  },
  loadFileSample: async (category, key, baseUrl) => {
    samplePreloadEvents.push(`file:${category}:${key}:${baseUrl}`);
  },
  fetchArrayBufferFromUrl: async (baseUrl) => {
    samplePreloadEvents.push(`fetch:${baseUrl}`);
  },
  drumHihatSampleUrl: 'assets/hihat.mp3',
  drumRideSampleUrls: ['assets/ride-a.mp3', 'assets/ride-b.mp3', 'assets/ride-c.mp3'],
  drumModeHihats24: 'hihats_2_4',
  drumModeFullSwing: 'full_swing',
  safePreloadMeasures: 2
});
await samplePreloadRuntime.preloadStartupSamples();
assert.ok(
  samplePreloadEvents.includes('file:drums:hihat:assets/hihat.mp3'),
  'Drill sample preload runtime eagerly loads the hi-hat sample when swing drums are enabled.'
);
assert.ok(
  samplePreloadEvents.includes('piano:72,74'),
  'Drill sample preload runtime preloads current progression piano notes for startup.'
);
const nearTermPreloadA = samplePreloadRuntime.ensureNearTermSamplePreload();
const nearTermPreloadB = samplePreloadRuntime.ensureNearTermSamplePreload();
assert.strictEqual(
  nearTermPreloadA,
  nearTermPreloadB,
  'Drill sample preload runtime memoizes the near-term preload promise while it is in flight.'
);
await nearTermPreloadA;
await samplePreloadRuntime.getBackgroundSamplePreloadPromise();
assert.ok(
  samplePreloadEvents.includes('sample:bass:Bass:37'),
  'Drill sample preload runtime schedules the broader background preload once near-term preloading completes.'
);
const pageWarmupA = samplePreloadRuntime.ensurePageSampleWarmup();
const pageWarmupB = samplePreloadRuntime.ensurePageSampleWarmup();
assert.strictEqual(
  pageWarmupA,
  pageWarmupB,
  'Drill sample preload runtime memoizes page-cache warmup work.'
);
await pageWarmupA;
assert.ok(
  samplePreloadEvents.includes('fetch:assets/Piano/p/72.mp3'),
  'Drill sample preload runtime can warm the page cache with piano sample descriptors.'
);
const samplePreloadAppContext = createPlaybackSamplePreloadAppContext({
  playbackSettings: {
    getBassPreloadRange: () => ({ low: 36, high: 36 }),
    getBassMidi: (key, semitoneOffset) => 36 + key + semitoneOffset,
    getBeatsPerChord: () => 2,
    getChordsPerBar: () => 2,
    getCompingStyle: () => 'strings',
    getDrumsMode: () => 'off'
  },
  progressionState: {
    getCurrentChords: () => [{ semitones: 0 }],
    getCurrentKey: () => 0,
    getCurrentVoicingPlan: () => [{ cello: [48], violin: [60], piano: [72] }],
    getCurrentBassPlan: () => [{ timeBeats: 0, midi: 35 }],
    getNextChords: () => [{ semitones: 5 }],
    getNextKey: () => 5,
    getNextVoicingPlan: () => [{ cello: [53], violin: [65], piano: [77] }]
  },
  sampleLoading: {
    collectCompingSampleNotes: (_style, voicing, noteSets) => {
      for (const midi of voicing.cello || []) noteSets.celloNotes.add(midi);
      for (const midi of voicing.violin || []) noteSets.violinNotes.add(midi);
      for (const midi of voicing.piano || []) noteSets.pianoNotes.add(midi);
    }
  },
  constants: {
    safePreloadMeasures: 2
  }
});
assert.ok(
  samplePreloadAppContext.collectRequiredSampleNotes({ includeCurrent: true, includeNext: true }).pianoNotes.has(72),
  'Drill sample preload app context materializes progression snapshots for the shared preload runtime.'
);
const audioPlaybackEvents = [];
let audioPlaybackContext = null;
let audioPlaybackMixerNodes = null;
let audioPlaybackMode = 'metronome_2_4';
function createConnectedNode(label, extra = {}) {
  return {
    ...extra,
    connect(target) {
      audioPlaybackEvents.push(`${label}:connect`);
      return target;
    }
  };
}
const fakeAudioContext = {
  destination: { label: 'destination' },
  createGain() {
    return createConnectedNode('gain', {
      gain: {
        setValueAtTime(value, time) {
          audioPlaybackEvents.push(`gain:set:${value}:${time}`);
        },
        exponentialRampToValueAtTime(value, time) {
          audioPlaybackEvents.push(`gain:exp:${value}:${time}`);
        }
      }
    });
  },
  createOscillator() {
    return createConnectedNode('osc', {
      kind: 'osc',
      type: 'sine',
      frequency: { value: 0 },
      start(time) {
        audioPlaybackEvents.push(`osc:start:${time}`);
      },
      stop(time) {
        audioPlaybackEvents.push(`osc:stop:${time}`);
      }
    });
  },
  createBufferSource() {
    return createConnectedNode('buffer', {
      kind: 'buffer',
      buffer: null,
      playbackRate: { value: 1 },
      start(time) {
        audioPlaybackEvents.push(`buffer:start:${time}`);
      }
    });
  }
};
const audioPlaybackRuntime = createPlaybackAudioPlaybackRuntime({
  getAudioContext: () => audioPlaybackContext,
  setAudioContext: (value) => { audioPlaybackContext = value; },
  getMixerNodes: () => audioPlaybackMixerNodes,
  setMixerNodes: (value) => { audioPlaybackMixerNodes = value; },
  createAudioContext: () => fakeAudioContext,
  applyMixerSettings: () => { audioPlaybackEvents.push('mixer:apply'); },
  sampleBuffers: { drums: { hihat: { id: 'hat' }, ride_0: { id: 'ride' } } },
  trackScheduledSource: (source) => { audioPlaybackEvents.push(`track:${source.kind}`); },
  metronomeGainMultiplier: 2,
  drumsGainMultiplier: 1.5,
  drumModeOff: 'off',
  drumModeMetronome24: 'metronome_2_4',
  drumModeHihats24: 'hihats_2_4',
  drumModeFullSwing: 'full_swing',
  drumRideSampleUrls: ['ride-0'],
  getDrumsMode: () => audioPlaybackMode,
  getSwingRatio: () => 0.5,
  initialRideSampleCursor: 0
});
audioPlaybackRuntime.initAudio();
assert.ok(audioPlaybackMixerNodes?.drums, 'Drill audio playback runtime initializes shared mixer nodes.');
assert.ok(
  audioPlaybackEvents.includes('mixer:apply'),
  'Drill audio playback runtime reapplies mixer settings when the audio graph is created.'
);
audioPlaybackRuntime.scheduleDrumsForBeat(8, 1, 0.5);
assert.ok(
  audioPlaybackEvents.includes('osc:start:8'),
  'Drill audio playback runtime can schedule metronome clicks on beats 2 and 4.'
);
audioPlaybackMode = 'full_swing';
audioPlaybackRuntime.scheduleDrumsForBeat(12, 1, 0.5);
assert.ok(
  audioPlaybackEvents.some((entry) => entry === 'buffer:start:12' || entry === 'buffer:start:12.25'),
  'Drill audio playback runtime can schedule sampled swing drums through the mixer graph.'
);
let audioPlaybackAppContextMixerNodes = null;
let audioPlaybackAppContextContext = null;
const audioPlaybackAppContext = createPlaybackAudioPlaybackAppContext({
  audioState: {
    getAudioContext: () => audioPlaybackAppContextContext,
    setAudioContext: (value) => { audioPlaybackAppContextContext = value; },
    getMixerNodes: () => audioPlaybackAppContextMixerNodes,
    setMixerNodes: (value) => { audioPlaybackAppContextMixerNodes = value; },
    sampleBuffers: {
      drums: {
        hihat: { duration: 0.2 },
        ride_0: { duration: 0.2 }
      }
    }
  },
  audioHelpers: {
    createAudioContext: () => fakeAudioContext,
    applyMixerSettings: () => {
      audioPlaybackEvents.push('app-context:mixer:apply');
    },
    trackScheduledSource: () => {}
  },
  playbackSettings: {
    getDrumsMode: () => 'off',
    getSwingRatio: () => 0.5
  },
  constants: {
    metronomeGainMultiplier: 1,
    drumsGainMultiplier: 1,
    drumModeOff: 'off',
    drumModeMetronome24: 'metronome_2_4',
    drumModeHihats24: 'hihats_2_4',
    drumModeFullSwing: 'full_swing',
    drumRideSampleUrls: ['ride-a']
  }
});
audioPlaybackAppContext.initAudio();
assert.ok(
  audioPlaybackAppContextMixerNodes?.master,
  'Drill audio playback app context materializes the shared audio runtime from grouped app concerns.'
);
const scheduledAudioEvents = [];
const scheduledAudioRuntime = createPlaybackScheduledAudioRuntime({
  getAudioContext: () => ({ currentTime: 4 }),
  stopActiveComping: (stopTime, fadeDuration) => {
    scheduledAudioEvents.push(`comping:${stopTime}:${fadeDuration}`);
  },
  defaultFadeDuration: 0.33
});
let endedListener = null;
const trackedSource = {
  addEventListener(eventName, listener) {
    scheduledAudioEvents.push(`listen:${eventName}`);
    endedListener = listener;
  },
  stop(time) {
    scheduledAudioEvents.push(`stop:${time}`);
  }
};
const trackedGain = {
  gain: {
    value: 0.8,
    cancelScheduledValues(time) {
      scheduledAudioEvents.push(`cancel:${time}`);
    },
    setValueAtTime(value, time) {
      scheduledAudioEvents.push(`set:${value}:${time}`);
    },
    linearRampToValueAtTime(value, time) {
      scheduledAudioEvents.push(`ramp:${value}:${time}`);
    }
  }
};
scheduledAudioRuntime.trackScheduledSource(trackedSource, [trackedGain]);
assert.equal(
  scheduledAudioRuntime.getScheduledAudioSources().size,
  1,
  'Drill scheduled audio runtime tracks active scheduled sources.'
);
endedListener?.();
assert.equal(
  scheduledAudioRuntime.getScheduledAudioSources().size,
  0,
  'Drill scheduled audio runtime releases tracked sources when they end.'
);
scheduledAudioRuntime.trackScheduledSource(trackedSource, [trackedGain]);
scheduledAudioRuntime.stopScheduledAudio();
assert.ok(
  scheduledAudioEvents.includes('stop:4.02'),
  'Drill scheduled audio runtime stops tracked sources with a small release window.'
);
scheduledAudioRuntime.getPendingDisplayTimeouts().add(12345);
scheduledAudioRuntime.clearScheduledDisplays();
assert.equal(
  scheduledAudioRuntime.getPendingDisplayTimeouts().size,
  0,
  'Drill scheduled audio runtime clears pending display timeouts.'
);
scheduledAudioRuntime.stopActiveChordVoices();
assert.ok(
  scheduledAudioEvents.includes('comping:4:0.33'),
  'Drill scheduled audio runtime forwards chord-voice shutdown through the shared comping boundary.'
);
const scheduledAudioAppContext = createPlaybackScheduledAudioAppContext({
  audioState: {
    getAudioContext: () => ({ currentTime: 9 })
  },
  audioHelpers: {
    stopActiveComping: (stopTime, fadeDuration) => {
      scheduledAudioEvents.push(`app-context:comping:${stopTime}:${fadeDuration}`);
    }
  },
  constants: {
    getDefaultFadeDuration: () => 0.44
  }
});
scheduledAudioAppContext.stopActiveChordVoices();
assert.ok(
  scheduledAudioEvents.includes('app-context:comping:9:0.44'),
  'Drill scheduled audio app context materializes the shared scheduled-audio runtime from grouped app concerns.'
);
const samplePlaybackEvents = [];
let samplePlaybackActiveNoteGain = null;
let samplePlaybackActiveNoteFadeOut = null;
const samplePlaybackAudioContext = {
  currentTime: 2,
  createBufferSource() {
    return {
      detune: { value: 0 },
      playbackRate: { value: 1 },
      connect(target) {
        samplePlaybackEvents.push('buffer:connect');
        return target;
      },
      start(time) {
        samplePlaybackEvents.push(`buffer:start:${time}`);
      },
      stop(time) {
        samplePlaybackEvents.push(`buffer:stop:${time}`);
      }
    };
  },
  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime(value, time) {
          samplePlaybackEvents.push(`gain:set:${value}:${time}`);
          this.value = value;
        },
        linearRampToValueAtTime(value, time) {
          samplePlaybackEvents.push(`gain:ramp:${value}:${time}`);
          this.value = value;
        },
        setTargetAtTime(value, time, constant) {
          samplePlaybackEvents.push(`gain:target:${value}:${time}:${constant}`);
        },
        cancelScheduledValues(time) {
          samplePlaybackEvents.push(`gain:cancel:${time}`);
        }
      },
      connect(target) {
        samplePlaybackEvents.push('gain:connect');
        return target;
      }
    };
  }
};
const samplePlaybackRuntime = createPlaybackSamplePlaybackRuntime({
  getAudioContext: () => samplePlaybackAudioContext,
  sampleBuffers: {
    bass: { 36: { duration: 1.2 } },
    piano: { 'mf:60': { duration: 1.5 } },
    cello: { 48: { duration: 9.5 } }
  },
  getMixerDestination: (channel) => ({ channel }),
  trackScheduledSource: () => {
    samplePlaybackEvents.push('track');
  },
  loadSample: async (_category, _folder, midi) => {
    samplePlaybackEvents.push(`load:${midi}`);
  },
  getActiveNoteGain: () => samplePlaybackActiveNoteGain,
  setActiveNoteGain: (value) => { samplePlaybackActiveNoteGain = value; },
  setActiveNoteFadeOut: (value) => { samplePlaybackActiveNoteFadeOut = value; },
  getPianoFadeProfile: () => ({ fadeBefore: 0.2, timeConstant: 0.05 }),
  noteFadeout: 0.26,
  bassNoteAttack: 0.005,
  bassNoteOverlap: 0.11,
  bassNoteRelease: 0.075,
  bassGainReleaseTimeConstant: 0.012,
  chordFadeBefore: 0.1,
  chordFadeDuration: 0.2,
  bassGain: 0.8,
  stringLoopStart: 2,
  stringLoopEnd: 9,
  stringLoopCrossfade: 0.12
});
samplePlaybackRuntime.playNote(38, 3, 0.5, 100);
assert.ok(
  samplePlaybackEvents.includes('load:38'),
  'Drill sample playback runtime requests a bass sample load when the exact note is missing.'
);
assert.ok(
  samplePlaybackEvents.includes('buffer:start:3'),
  'Drill sample playback runtime can start fallback bass sample playback.'
);
assert.equal(
  samplePlaybackActiveNoteFadeOut,
  0.075,
  'Drill sample playback runtime updates the active bass-note fadeout state.'
);
const pianoVoice = samplePlaybackRuntime.playSample('piano', 60, 5, 0.8, 0.4, { layer: 'mf', legato: true });
assert.equal(
  pianoVoice?.category,
  'piano',
  'Drill sample playback runtime returns metadata for piano sample playback.'
);
assert.ok(
  samplePlaybackEvents.some((entry) => entry.startsWith('gain:target:0.0001:')),
  'Drill sample playback runtime applies release envelopes for piano samples.'
);
const stringVoice = samplePlaybackRuntime.playSample('cello', 48, 8, 10, 0.5);
assert.ok(
  stringVoice?.detuneParams?.length >= 1,
  'Drill sample playback runtime supports looped string playback for long sustained voices.'
);
let samplePlaybackAppContextActiveGain = null;
let samplePlaybackAppContextFadeOut = 0;
const samplePlaybackAppContext = createPlaybackSamplePlaybackAppContext({
  audioState: {
    getAudioContext: () => samplePlaybackAudioContext,
    sampleBuffers: {
      bass: { 36: { duration: 1.2 } },
      piano: { 'mf:60': { duration: 1.5 } },
      cello: { 48: { duration: 9.5 } }
    }
  },
  audioHelpers: {
    getMixerDestination: (channel) => ({ channel }),
    trackScheduledSource: () => {
      samplePlaybackEvents.push('app-context:track');
    },
    loadSample: async (_category, _folder, midi) => {
      samplePlaybackEvents.push(`app-context:load:${midi}`);
    },
    getPianoFadeProfile: () => ({ fadeBefore: 0.2, timeConstant: 0.05 })
  },
  playbackState: {
    getActiveNoteGain: () => samplePlaybackAppContextActiveGain,
    setActiveNoteGain: (value) => { samplePlaybackAppContextActiveGain = value; },
    setActiveNoteFadeOut: (value) => { samplePlaybackAppContextFadeOut = value; }
  },
  constants: {
    noteFadeout: 0.25,
    bassNoteAttack: 0.005,
    bassNoteOverlap: 0.05,
    bassNoteRelease: 0.2,
    bassGainReleaseTimeConstant: 0.012,
    chordFadeBefore: 0.1,
    chordFadeDuration: 0.2,
    bassGain: 0.8,
    stringLoopStart: 1,
    stringLoopEnd: 3,
    stringLoopCrossfade: 0.1
  }
});
assert.ok(
  samplePlaybackAppContext.playSample('piano', 60, 10, 0.8, 0.3, { layer: 'mf' }),
  'Drill sample playback app context materializes the shared note/sample runtime from grouped app concerns.'
);
assert.ok(
  samplePlaybackAppContextFadeOut >= 0,
  'Drill sample playback app context preserves playback-state writes for active note envelopes.'
);
let preparedCurrentCompingPlan = null;
let preparedNextCompingPlan = null;
let preparedCurrentBassPlan = [];
const walkingBassBuilds = [];
const playbackPreparationRuntime = createPracticePlaybackPreparationRuntime({
  getPlayedChordQuality: (chord, isMinor) => `${chord.quality}:${isMinor ? 'm' : 'M'}`,
  getVoicingPlanForProgression: (chords) => chords.map((_, index) => (index === 0 ? { planned: true } : null)),
  getVoicing: (_key, chord) => ({ fallback: chord.semitones }),
  getNextKeyValue: () => 5,
  getNextPaddedChords: () => [{ semitones: 7 }],
  getNextVoicingPlan: () => [{ next: true }],
  getNextCompingPlan: () => ({ id: 'next-plan' }),
  getIsMinorMode: () => true,
  setCurrentCompingPlan: (value) => { preparedCurrentCompingPlan = value; },
  setNextCompingPlan: (value) => { preparedNextCompingPlan = value; },
  getPaddedChords: () => [{ semitones: 0, quality: 'maj7' }, { semitones: 7, quality: '7' }],
  getCurrentKey: () => 0,
  getCurrentVoicingPlan: () => [{ current: true }],
  getBeatsPerChord: () => 2,
  getCompingStyle: () => 'piano',
  getTempoBpm: () => 140,
  isWalkingBassEnabled: () => true,
  getSwingRatio: () => 0.6,
  getCurrentBassPlan: () => preparedCurrentBassPlan,
  setCurrentBassPlan: (value) => { preparedCurrentBassPlan = value; },
  getNextPaddedChordsForBass: () => [{ semitones: 5 }],
  getNextKeyForBass: () => 5,
  compingEngine: {
    buildPreparedPlans: () => ({
      currentPlan: { id: 'current-plan' },
      nextPlan: { id: 'next-plan' }
    })
  },
  walkingBassGenerator: {
    buildLine: (options) => {
      walkingBassBuilds.push(options);
      return [{ midi: 40, timeBeats: 0 }];
    }
  }
});
assert.deepEqual(
  playbackPreparationRuntime.getPreparedNextProgression(),
  {
    key: 5,
    chords: [{ semitones: 7 }],
    voicingPlan: [{ next: true }],
    compingPlan: { id: 'next-plan' },
    isMinor: true
  },
  'Practice playback preparation runtime exposes the prepared next progression shape for comping decisions.'
);
assert.deepEqual(
  playbackPreparationRuntime.getVoicingAtIndex([{ semitones: 0 }], 0, 0, false),
  { planned: true },
  'Practice playback preparation runtime prefers precomputed voicings when available.'
);
playbackPreparationRuntime.rebuildPreparedCompingPlans();
assert.equal(
  preparedCurrentCompingPlan?.id,
  'current-plan',
  'Practice playback preparation runtime stores rebuilt current comping plans.'
);
assert.equal(
  preparedNextCompingPlan?.id,
  'next-plan',
  'Practice playback preparation runtime stores rebuilt next comping plans.'
);
const resolvedWalkingBassGenerator = await playbackPreparationRuntime.ensureWalkingBassGenerator();
assert.ok(
  resolvedWalkingBassGenerator && typeof resolvedWalkingBassGenerator.buildLine === 'function',
  'Practice playback preparation runtime resolves the shared walking-bass generator.'
);
assert.deepEqual(
  playbackPreparationRuntime.buildPreparedBassPlan(),
  [{ midi: 40, timeBeats: 0 }],
  'Practice playback preparation runtime builds and stores prepared bass plans through the shared generator.'
);
assert.equal(
  walkingBassBuilds[0]?.tempoBpm,
  140,
  'Practice playback preparation runtime forwards tempo to the walking-bass generator.'
);
let preparationCurrentCompingPlan = null;
let preparationNextCompingPlan = null;
let preparationCurrentBassPlan = [];
const playbackPreparationAppContext = createPracticePlaybackPreparationAppContext({
  harmony: {
    getPlayedChordQuality: (chord, isMinor) => `${chord.quality}:${isMinor ? 'm' : 'M'}`,
    getVoicingPlanForProgression: (chords) => chords.map((_, index) => (index === 0 ? { planned: true } : null)),
    getVoicing: (_key, chord) => ({ fallback: chord.semitones })
  },
  progressionState: {
    getNextKeyValue: () => 5,
    getNextPaddedChords: () => [{ semitones: 7 }],
    getNextVoicingPlan: () => [{ next: true }],
    getNextCompingPlan: () => ({ id: 'next-plan' }),
    setCurrentCompingPlan: (value) => { preparationCurrentCompingPlan = value; },
    setNextCompingPlan: (value) => { preparationNextCompingPlan = value; },
    getPaddedChords: () => [{ semitones: 0, quality: 'maj7' }],
    getCurrentKey: () => 0,
    getCurrentVoicingPlan: () => [{ current: true }],
    getCurrentBassPlan: () => preparationCurrentBassPlan,
    setCurrentBassPlan: (value) => { preparationCurrentBassPlan = value; },
    getNextPaddedChordsForBass: () => [{ semitones: 5 }],
    getNextKeyForBass: () => 5
  },
  playbackSettings: {
    getIsMinorMode: () => true,
    getBeatsPerChord: () => 2,
    getCompingStyle: () => 'piano',
    getTempoBpm: () => 140,
    isWalkingBassEnabled: () => true,
    getSwingRatio: () => 0.6
  },
  runtime: {
    compingEngine: {
      buildPreparedPlans: () => ({
        currentPlan: { id: 'ctx-current-plan' },
        nextPlan: { id: 'ctx-next-plan' }
      })
    },
    walkingBassGenerator: {
      buildLine: () => [{ midi: 41, timeBeats: 0 }]
    }
  }
});
playbackPreparationAppContext.rebuildPreparedCompingPlans();
assert.equal(
  preparationCurrentCompingPlan?.id,
  'ctx-current-plan',
  'Practice playback preparation app context materializes the shared comping-preparation runtime.'
);
assert.deepEqual(
  playbackPreparationAppContext.buildPreparedBassPlan(),
  [{ midi: 41, timeBeats: 0 }],
  'Practice playback preparation app context materializes the shared bass-preparation runtime.'
);
assert.equal(
  preparationNextCompingPlan?.id,
  'ctx-next-plan',
  'Practice playback preparation app context preserves next-progression comping writes.'
);
const playbackResourcesFacade = createPracticePlaybackResourcesAppFacade({
  audioFacade: {
    preloadStartupSamples: () => 'startup',
    preloadNearTermSamples: () => 'near-term',
    ensureNearTermSamplePreload: () => 'ensure-near',
    ensurePageSampleWarmup: () => 'page-warmup',
    ensureBackgroundSamplePreload: () => 'background'
  },
  playbackPreparation: {
    rebuildPreparedCompingPlans: () => 'rebuild',
    ensureWalkingBassGenerator: () => 'walking-bass',
    buildPreparedBassPlan: (seed) => ['bass-plan', seed]
  }
});
assert.equal(
  playbackResourcesFacade.rebuildPreparedCompingPlans(),
  'rebuild',
  'Practice playback resources facade forwards preparation helpers.'
);
assert.deepEqual(
  playbackResourcesFacade.buildPreparedBassPlan(12),
  ['bass-plan', 12],
  'Practice playback resources facade preserves bass-plan arguments.'
);
assert.equal(
  playbackResourcesFacade.ensureBackgroundSamplePreload(),
  'background',
  'Practice playback resources facade forwards preload helpers from the audio facade.'
);

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
const aBalladExport = createPracticeSessionExportFromPlaybackPlan(aBalladPlan, aBallad);
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

const practiceSessionExport = createPracticeSessionExportFromPlaybackPlan(satinPlan, satinDoll);
assert.ok(practiceSessionExport.patternString.includes('|'), 'Practice-session export produces a bar-delimited pattern string.');
assert.ok(!practiceSessionExport.patternString.includes('%'), 'Practice-session export resolves repeated bars into concrete harmony.');

const cryMeARiver = byTitle.get('Cry Me A River');
assert.ok(cryMeARiver, 'Cry Me A River is present in the raw source import.');
const cryMeARiverPlan = createChartPlaybackPlanFromDocument(cryMeARiver);
const cryMeARiverExport = createPracticeSessionExportFromPlaybackPlan(cryMeARiverPlan, cryMeARiver);
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
    return /** @type {any} */ ({ __JPT_PLAYBACK_API__: embeddedApi });
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
    return /** @type {any} */ ({ __JPT_PLAYBACK_API__: embeddedApi });
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
      __JPT_PLAYBACK_API__: embeddedApi,
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
  __JPT_PLAYBACK_API__: {
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
  ['jpt-playback-api-ready'],
  'Published embedded playback assembly providers emit the playback ready event when publishing.'
);
const bootstrappedEmbeddedApi = bootstrapEmbeddedPlaybackApi({
  publishedPlaybackAssemblyProvider: publishedEmbeddedPlaybackAssemblyProvider
});
assert.equal(
  bootstrappedEmbeddedApi,
  publishedEmbeddedPlaybackAssemblyProvider.getAssembly().embeddedApi,
  'Embedded playback bootstrap reuses the published assembly provider when one is supplied.'
);
const embeddedRuntimeFromPracticeAssembly = initializeEmbeddedPracticeRuntime({
  playbackAssemblyProvider: createPracticePlaybackAssemblyProvider({
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
        __JPT_PLAYBACK_API__: null,
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
  typeof embeddedRuntimeFromPracticeAssembly.playbackRuntime.ensureReady,
  'function',
  'Embedded playback runtime keeps publishing a usable embedded API even when backed by a practice playback assembly provider.'
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
  ['jpt-playback-api-ready'],
  'Published embedded playback assembly emits the playback ready event when publishing.'
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
const PracticePlaybackAdapter = createPracticePlaybackSessionAdapter({
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
const directAdapterCalls = [];
const directPlaybackAdapter = createDirectPlaybackSessionAdapter({
  loadDirectSession(sessionSpec, playbackSettings) {
    directAdapterCalls.push({ kind: 'load', sessionSpec, playbackSettings });
    return { ok: true, state: { ...drillRuntimeState, sessionId: sessionSpec?.id || '' } };
  },
  updateDirectPlaybackSettings(playbackSettings, sessionSpec) {
    directAdapterCalls.push({ kind: 'settings', playbackSettings, sessionSpec });
    return { ok: true, state: { ...drillRuntimeState, sessionId: sessionSpec?.id || '' } };
  },
  getDirectPlaybackState() {
    return { ...drillRuntimeState, currentBeat: 2 };
  },
  startPlayback: async () => {
    directAdapterCalls.push({ kind: 'start' });
  },
  stopPlayback: () => {
    directAdapterCalls.push({ kind: 'stop' });
  },
  togglePausePlayback: () => {
    directAdapterCalls.push({ kind: 'pause' });
  }
});
await directPlaybackAdapter.loadSession(satinSession, {
  transposition: 5,
  displayMode: 'roman'
});
assert.equal(
  directAdapterCalls.find(call => call.kind === 'load')?.playbackSettings?.transposition,
  5,
  'Direct playback session adapter prefers the direct session loader over the embedded-pattern fallback.'
);
await directPlaybackAdapter.updatePlaybackSettings({
  masterVolume: 70
}, satinSession);
assert.equal(
  directAdapterCalls.find(call => call.kind === 'settings')?.playbackSettings?.masterVolume,
  70,
  'Direct playback session adapter forwards playback settings through the direct session boundary when available.'
);
assert.equal(
  directPlaybackAdapter.getRuntimeState()?.currentBeat,
  2,
  'Direct playback session adapter can surface runtime state from a direct getter.'
);
await directPlaybackAdapter.start();
directPlaybackAdapter.pauseToggle();
directPlaybackAdapter.stop();
assert.equal(
  directAdapterCalls.filter(call => call.kind === 'start').length,
  1,
  'Direct playback session adapter preserves the shared transport controls.'
);
assert.equal(
  directAdapterCalls.filter(call => call.kind === 'pause').length,
  1,
  'Direct playback session adapter preserves the shared pause transport control.'
);
assert.equal(
  directAdapterCalls.filter(call => call.kind === 'stop').length,
  0,
  'Direct playback session adapter preserves the no-op stop behavior when playback is already stopped.'
);
await PracticePlaybackAdapter.loadSession(satinSession, {
  transposition: -2,
  displayMode: 'roman'
});
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'pattern')?.payload?.transposition,
  -2,
  'Practice playback adapter forwards transposition through the shared playback-session boundary.'
);
await PracticePlaybackAdapter.updatePlaybackSettings({
  customMediumSwingBass: true,
  displayMode: 'show-both'
});
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'settings')?.settings?.displayMode,
  'show-both',
  'Practice playback adapter forwards playback settings through the shared playback-session boundary.'
);
await PracticePlaybackAdapter.start();
PracticePlaybackAdapter.pauseToggle();
PracticePlaybackAdapter.stop();
assert.equal(drillAdapterCalls.filter(call => call.kind === 'start').length, 1, 'Practice playback adapter forwards start through the shared playback-session boundary.');
assert.equal(drillAdapterCalls.filter(call => call.kind === 'pause').length, 1, 'Practice playback adapter forwards pause through the shared playback-session boundary.');
assert.equal(drillAdapterCalls.filter(call => call.kind === 'stop').length, 0, 'Practice playback adapter preserves the no-op stop behavior when playback is already stopped.');

const PracticePlaybackRuntime = createPracticePlaybackRuntime({
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
const corePracticePlaybackRuntime = createCorePracticePlaybackRuntime({
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
  corePracticePlaybackRuntime.ensurePlaybackController(),
  corePracticePlaybackRuntime.ensurePlaybackController(),
  'Core practice playback runtime memoizes its playback controller.'
);
const PracticePlaybackRuntimeProvider = createPracticePlaybackRuntimeProvider({
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
  PracticePlaybackRuntimeProvider.getRuntime(),
  PracticePlaybackRuntimeProvider.getRuntime(),
  'Practice playback runtime provider memoizes the practice playback runtime instance.'
);
assert.equal(
  PracticePlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  PracticePlaybackRuntimeProvider.getRuntime().ensurePlaybackController(),
  'Practice playback runtime provider returns a stable runtime with a memoized controller.'
);
const directPlaybackRuntimeProvider = createDirectPlaybackRuntimeProvider({
  loadDirectSession(sessionSpec, playbackSettings) {
    directAdapterCalls.push({ kind: 'provider-load', sessionSpec, playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  updateDirectPlaybackSettings(playbackSettings) {
    directAdapterCalls.push({ kind: 'provider-settings', playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  getDirectPlaybackState() {
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
await directPlaybackRuntimeProvider.getRuntime().ensurePlaybackController().loadSession(satinSession);
assert.equal(
  directAdapterCalls.some(call => call.kind === 'provider-load'),
  true,
  'Direct playback runtime provider can load a practice session through the direct session boundary.'
);
const PracticePlaybackBridgeProvider = createPracticePlaybackBridgeProvider({
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
  PracticePlaybackBridgeProvider.getBridge(),
  PracticePlaybackBridgeProvider.getBridge(),
  'Practice playback bridge provider memoizes the direct runtime-backed bridge.'
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
const schedulerState = createPracticePlaybackSchedulerState({
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
assert.equal(schedulerCurrentBeat, 2, 'Practice playback scheduler state proxy forwards beat mutations.');
assert.deepEqual(schedulerState.currentBassPlan, [1, 2], 'Practice playback scheduler state proxy exposes current bass plan.');
assert.equal(schedulerState.pendingDisplayTimeouts, schedulerPendingDisplayTimeouts, 'Practice playback scheduler state proxy exposes pending display timeouts.');
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
const transportState = createPracticePlaybackTransportState({
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
assert.equal(transportIsPlaying, true, 'Practice playback transport state proxy forwards transport playing mutations.');
assert.equal(transportState.currentBeat, 3, 'Practice playback transport state proxy exposes beat mutations.');
const PracticePlaybackEngineAppContext = createPracticePlaybackEngineAppContext({
  dom: { transportStatus: {} },
  schedulerState,
  transportState,
  scheduleAhead: 0.1,
  noteFadeout: 0.05,
  scheduleInterval: 25,
  schedulerHelperBindings: {
    getSecondsPerBeat: () => 0.5,
    parsePattern: () => [],
    updateBeatDots: () => {}
  },
  transportHelperBindings: {
    initAudio: () => {},
    stopScheduledAudio: () => {},
    trackEvent: () => {}
  }
});
assert.equal(
  PracticePlaybackEngineAppContext.schedulerState,
  schedulerState,
  'Practice playback engine app context keeps the scheduler state boundary explicit.'
);
assert.equal(
  PracticePlaybackEngineAppContext.transportState,
  transportState,
  'Practice playback engine app context keeps the transport state boundary explicit.'
);
assert.equal(
  PracticePlaybackEngineAppContext.schedulerHelpers.getSecondsPerBeat(),
  0.5,
  'Practice playback engine app context materializes scheduler helpers from app bindings.'
);
assert.equal(
  typeof PracticePlaybackEngineAppContext.transportHelpers.initAudio,
  'function',
  'Practice playback engine app context materializes transport helpers from app bindings.'
);
const PracticePlaybackRuntimeAppAssembly = createPracticePlaybackRuntimeAppAssembly({
  dom: {
    startStop: { textContent: '', classList: { add() {}, remove() {} } },
    pause: { textContent: '', classList: { add() {}, remove() {} } },
    keyDisplay: { textContent: '' },
    chordDisplay: { textContent: '' },
    walkingBass: { checked: false }
  },
  schedulerBindings: {
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
    getPendingDisplayTimeouts: () => new Set()
  },
  transportBindings: {
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
  },
  scheduleAhead: 0.1,
  noteFadeout: 0.05,
  scheduleInterval: 25,
  schedulerHelperBindings: {
    getSecondsPerBeat: () => 0.5,
    parsePattern: () => [],
    updateBeatDots: () => {}
  },
  transportHelperBindings: {
    initAudio: () => {},
    stopScheduledAudio: () => {},
    trackEvent: () => {}
  }
});
assert.equal(
  typeof PracticePlaybackRuntimeAppAssembly.start,
  'function',
  'Practice playback runtime app assembly materializes the shared playback transport.'
);
assert.equal(
  typeof PracticePlaybackRuntimeAppAssembly.prepareNextProgressionPlayback,
  'function',
  'Practice playback runtime app assembly materializes the shared playback scheduler.'
);
const PracticePlaybackStateAppContext = createPracticePlaybackStateAppContext({
  schedulerBindings: {
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
  },
  transportBindings: {
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
  }
});
assert.equal(
  PracticePlaybackStateAppContext.schedulerState.pendingDisplayTimeouts,
  schedulerPendingDisplayTimeouts,
  'Practice playback state app context builds the scheduler proxy from app bindings.'
);
PracticePlaybackStateAppContext.transportState.currentBeat = 1;
assert.equal(
  transportCurrentBeat,
  1,
  'Practice playback state app context builds the transport proxy from app bindings.'
);
let embeddedRuntimeStopIfPlayingCalls = 0;
const embeddedRuntimeAppContextOptions = createEmbeddedPracticeRuntimeAppContextOptions({
  dom: { patternName: { value: '' }, patternSelect: { value: '' }, tempoSlider: { value: '140' }, patternError: { textContent: 'Oops' } },
  patternUi: {
    clearProgressionEditingState: () => {},
    closeProgressionManager: () => {},
    setCustomPatternSelection: () => {},
    setPatternName: () => {},
    setCustomPatternValue: () => {},
    setEditorPatternMode: () => {},
    syncPatternSelectionFromInput: () => {},
    setLastPatternSelectValue: () => {},
    syncCustomPatternUI: () => {},
    normalizeChordsPerBarForCurrentPattern: () => {},
    applyPatternModeAvailability: () => {},
    syncPatternPreview: () => {},
    applyDisplayMode: () => {},
    applyBeatIndicatorVisibility: () => {},
    applyCurrentHarmonyVisibility: () => {},
    updateKeyPickerLabels: () => {},
    refreshDisplayedHarmony: () => {},
    fitHarmonyDisplay: () => {},
    validateCustomPattern: () => true,
    getPatternErrorText: () => 'Oops',
    getCurrentPatternString: () => 'Cmaj7 | Dm7 G7',
    getCurrentPatternMode: () => 'both'
  },
  normalization: {
    normalizePatternString: (value) => String(value || '').trim(),
    normalizePresetName: (value) => String(value || '').trim(),
    normalizePatternMode: (value) => String(value || 'both'),
    normalizeCompingStyle: (value) => String(value || 'piano'),
    normalizeRepetitionsPerKey: (value) => Number(value || 1),
    normalizeDisplayMode: (value) => String(value || 'show-both'),
    normalizeHarmonyDisplayMode: (value) => String(value || 'default')
  },
  playbackSettings: {
    getSwingRatio: () => 0.6,
    getCompingStyle: () => 'piano',
    getDrumsMode: () => 'brushes',
    isWalkingBassEnabled: () => true,
    getRepetitionsPerKey: () => 2,
    applyMixerSettings: () => {}
  },
  playbackState: {
    isEmbeddedMode: true,
    getIsPlaying: () => true,
    getIsPaused: () => false,
    getIsIntro: () => false,
    getCurrentBeat: () => 1,
    getCurrentChordIdx: () => 2,
    getPaddedChordCount: () => 16,
    getTempo: () => 140
  },
  playbackRuntime: {
    ensureWalkingBassGenerator: async () => {},
    getAudioContext: () => null,
    noteFadeout: 0.1,
    stopActiveChordVoices: () => {},
    rebuildPreparedCompingPlans: () => {},
    buildPreparedBassPlan: () => {},
    getCurrentKey: () => 0,
    preloadNearTermSamples: async () => {}
  },
  transportActions: {
    startPlayback: async () => {},
    stopPlayback: () => { embeddedRuntimeStopIfPlayingCalls += 1; },
    togglePausePlayback: () => {}
  }
});
embeddedRuntimeAppContextOptions.patternAdapterOptions.stopIfPlaying();
assert.equal(
  embeddedRuntimeStopIfPlayingCalls,
  1,
  'Embedded playback runtime app context reuses grouped app actions to stop active playback.'
);
assert.equal(
  embeddedRuntimeAppContextOptions.playbackControllerOptions.noteFadeout,
  0.1,
  'Embedded playback runtime app context forwards direct runtime controller options through the grouped boundary.'
);
const directSessionHandlers = createDirectPlaybackSessionHandlers({
  applyPracticeSession(sessionSpec) {
    directAdapterCalls.push({ kind: 'direct-host-apply-session', sessionSpec });
    return { ok: true, state: drillRuntimeState };
  },
  applyPlaybackSettings(playbackSettings) {
    directAdapterCalls.push({ kind: 'direct-host-apply-settings', playbackSettings });
    return playbackSettings;
  },
  getPlaybackState() {
    return { ...drillRuntimeState, currentChordIdx: 3 };
  }
});
directSessionHandlers.loadDirectSession(satinSession, { tempo: 140 });
assert.equal(
  directAdapterCalls.some(call => call.kind === 'direct-host-apply-session'),
  true,
  'Direct playback session handlers can load a practice session through an app-level direct host.'
);
assert.equal(
  directSessionHandlers.getDirectPlaybackState()?.currentChordIdx,
  3,
  'Direct playback session handlers surface runtime state through the direct host boundary.'
);
const directSessionHost = createDirectPlaybackSessionHost({
  applyEmbeddedPattern(payload) {
    directAdapterCalls.push({ kind: 'direct-host-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    directAdapterCalls.push({ kind: 'direct-host-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return { ...drillRuntimeState, currentBeat: 5 };
  }
});
directSessionHost.loadDirectSession(satinSession, { stringsVolume: 60 });
assert.equal(
  directAdapterCalls.some(call => call.kind === 'direct-host-pattern'),
  true,
  'Direct playback session host can adapt a practice session onto the current drill UI/runtime implementation.'
);
assert.equal(
  directSessionHost.getDirectPlaybackState()?.currentBeat,
  5,
  'Direct playback session host reuses the current embedded runtime state while exposing a direct-session surface.'
);
const directRuntimeAppContextOptions = createDirectDrillRuntimeAppContextOptions({
  applyEmbeddedPattern(payload) {
    directAdapterCalls.push({ kind: 'direct-context-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  applyEmbeddedPlaybackSettings(settings) {
    directAdapterCalls.push({ kind: 'direct-context-settings', settings });
    return settings;
  },
  getEmbeddedPlaybackState() {
    return drillRuntimeState;
  },
  playbackRuntime: {
    ensureWalkingBassGenerator: async () => {},
    getAudioContext: () => null,
    noteFadeout: 0.1,
    stopActiveChordVoices: () => {},
    rebuildPreparedCompingPlans: () => {},
    buildPreparedBassPlan: () => {},
    getCurrentKey: () => 0,
    preloadNearTermSamples: async () => {},
    validateCustomPattern: () => true
  },
  playbackState: {
    getIsPlaying: () => false
  },
  transportActions: {
    startPlayback: async () => {},
    stopPlayback: () => {},
    togglePausePlayback: () => {}
  }
});
assert.equal(
  typeof directRuntimeAppContextOptions.loadDirectSession,
  'function',
  'Direct drill runtime app context exposes a direct session loader for the future chart direct runtime.'
);
assert.equal(
  directRuntimeAppContextOptions.noteFadeout,
  0.1,
  'Direct drill runtime app context preserves the shared runtime transport bindings.'
);
const directRuntimeAppAssembly = createDrillDirectRuntimeAppAssembly({
  embedded: {
    applyEmbeddedPattern(payload) {
      directAdapterCalls.push({ kind: 'direct-assembly-pattern-host', payload });
      return { ok: true, state: drillRuntimeState };
    },
    applyEmbeddedPlaybackSettings(settings) {
      directAdapterCalls.push({ kind: 'direct-assembly-settings-host', settings });
      return settings;
    },
    getEmbeddedPlaybackState() {
      return drillRuntimeState;
    }
  },
  playbackRuntime: {
    ensureWalkingBassGenerator: async () => {},
    getAudioContext: () => null,
    noteFadeout: 0.1,
    stopActiveChordVoices: () => {},
    rebuildPreparedCompingPlans: () => {},
    buildPreparedBassPlan: () => {},
    getCurrentKey: () => 0,
    preloadNearTermSamples: async () => {},
    validateCustomPattern: () => true
  },
  playbackState: {
    getIsPlaying: () => false
  },
  transportActions: {
    startPlayback: async () => {},
    stopPlayback: () => {},
    togglePausePlayback: () => {}
  }
});
assert.equal(
  typeof directRuntimeAppAssembly.loadDirectSession,
  'function',
  'Direct drill runtime app assembly materializes direct playback controller options from grouped app concerns.'
);
const directGlobalsTarget = /** @type {any} */ ({
  dispatchEvent(event) {
    this.lastDirectEventType = event.type;
  }
});
publishDirectPlaybackGlobals({
  targetWindow: directGlobalsTarget,
  directPlaybackControllerOptions: directRuntimeAppAssembly
});
assert.equal(
  readDirectPlaybackGlobals(directGlobalsTarget),
  directRuntimeAppAssembly,
  'Direct playback globals publish the app-level direct controller options for future same-page consumers.'
);
const directPlaybackOptionsClient = createDirectPlaybackOptionsClient({
  getTargetWindow: () => directGlobalsTarget,
  getHostFrame: () => /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} })
});
assert.equal(
  await directPlaybackOptionsClient.ensureOptions(),
  directRuntimeAppAssembly,
  'Direct playback options client resolves published direct controller options through the shared readiness boundary.'
);
const samePageDirectPlaybackOptionsClient = createDirectPlaybackOptionsClient({
  getTargetWindow: () => directGlobalsTarget
});
assert.equal(
  await samePageDirectPlaybackOptionsClient.ensureOptions(),
  directRuntimeAppAssembly,
  'Direct playback options client can also resolve same-page published options without requiring an iframe host.'
);
const chartDirectTargetWindow = /** @type {any} */ ({
  __JPT_DIRECT_PLAYBACK_CONTROLLER_OPTIONS__: directRuntimeAppAssembly
});
let chartFrameHostStoredFrame = null;
const chartDirectFrameHost = createChartDirectPlaybackFrameHost({
  getExistingFrame: () => chartFrameHostStoredFrame,
  setFrame: (frame) => { chartFrameHostStoredFrame = frame; },
  parent: /** @type {any} */ ({ appendChild() {} }),
  createFrame: () => /** @type {any} */ ({
    contentWindow: null,
    setAttribute() {},
    tabIndex: -1
  })
});
assert.equal(
  chartDirectFrameHost.ensureFrame(),
  chartDirectFrameHost.ensureFrame(),
  'Chart direct playback frame host memoizes the transitional iframe host.'
);
const chartDirectWindowHost = createChartDirectPlaybackWindowHost({
  getCurrentWindow: () => chartDirectTargetWindow,
  getExistingFrame: () => chartFrameHostStoredFrame,
  setFrame: (frame) => { chartFrameHostStoredFrame = frame; },
  parent: /** @type {any} */ ({ appendChild() {} }),
  createFrame: () => {
    throw new Error('Frame should not be created when same-page direct playback is available.');
  }
});
assert.equal(
  chartDirectWindowHost.getTargetWindow(),
  chartDirectTargetWindow,
  'Chart direct playback window host prefers a same-page direct runtime when one is already published.'
);
assert.equal(
  chartDirectWindowHost.ensureFrame(),
  null,
  'Chart direct playback window host avoids creating the transitional iframe when same-page direct playback is available.'
);
const chartDirectRuntimeHost = createChartDirectPlaybackRuntimeHost({
  getCurrentWindow: () => chartDirectTargetWindow,
  getExistingFrame: () => chartFrameHostStoredFrame,
  setFrame: (frame) => { chartFrameHostStoredFrame = frame; },
  getTempo: () => 155,
  getCurrentChartTitle: () => 'Chart Test',
  parent: /** @type {any} */ ({ appendChild() {} }),
  createFrame: () => /** @type {any} */ ({
    contentWindow: chartDirectTargetWindow,
    setAttribute() {},
    tabIndex: -1
  })
});
assert.equal(
  typeof chartDirectRuntimeHost.getDirectPlaybackOptions().loadDirectSession,
  'function',
  'Chart direct playback runtime host materializes the direct playback controller options from the transitional iframe host.'
);
assert.equal(
  chartDirectRuntimeHost.ensureFrame(),
  null,
  'Chart direct playback runtime host can now stay same-page when direct controller options are already published on the current window.'
);
assert.equal(
  chartDirectRuntimeHost.getCurrentTargetWindow(),
  chartDirectTargetWindow,
  'Chart direct playback runtime host exposes the preferred same-page target separately from the iframe fallback target.'
);
assert.equal(
  createChartDirectPlaybackRuntimeHostBindings({
    timeoutMs: 1000
  }).timeoutMs,
  1000,
  'Chart direct playback runtime host bindings preserve grouped chart-level host concerns for the shared direct host seam.'
);
const chartLegacyOnlyWindowHost = createChartDirectPlaybackWindowHost({
  getCurrentWindow: () => /** @type {any} */ ({ __JPT_PLAYBACK_API__: embeddedApi }),
  getExistingFrame: () => chartFrameHostStoredFrame,
  setFrame: (frame) => { chartFrameHostStoredFrame = frame; },
  parent: /** @type {any} */ ({ appendChild() {} }),
  createFrame: () => /** @type {any} */ ({
    contentWindow: chartDirectTargetWindow,
    setAttribute() {},
    tabIndex: -1
  })
});
assert.equal(
  chartLegacyOnlyWindowHost.getCurrentTargetWindow(),
  null,
  'Chart direct playback window host does not treat the legacy embedded API global as a same-page direct runtime.'
);
const chartDirectHostResolver = createChartDirectPlaybackHostResolver({
  getTargetWindow: () => chartDirectTargetWindow,
  getPreferredTargetWindow: () => chartDirectTargetWindow,
  getFallbackTargetWindow: () => null,
  getHostFrame: () => /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} })
});
assert.equal(
  await chartDirectHostResolver.ensureDirectHostOptions(),
  directRuntimeAppAssembly,
  'Chart direct playback host resolver reuses the shared direct readiness boundary.'
);
const createMockDirectWindow = () => {
  const listeners = new Map();
  return /** @type {any} */ ({
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) {
        listeners.delete(type);
      }
    },
    dispatchEvent(event) {
      const listener = listeners.get(event.type);
      if (listener) {
        listener(event);
      }
      return true;
    }
  });
};
const delayedSamePageDirectWindow = createMockDirectWindow();
const fallbackDirectWindow = /** @type {any} */ ({
  __JPT_DIRECT_PLAYBACK_CONTROLLER_OPTIONS__: {
    marker: 'fallback'
  }
});
const delayedPreferredResolver = createChartDirectPlaybackHostResolver({
  getTargetWindow: () => fallbackDirectWindow,
  getPreferredTargetWindow: () => delayedSamePageDirectWindow,
  getFallbackTargetWindow: () => fallbackDirectWindow,
  getHostFrame: () => /** @type {any} */ ({ addEventListener() {}, removeEventListener() {} }),
  preferredTimeoutMs: 25,
  timeoutMs: 100
});
globalThis.setTimeout(() => {
  delayedSamePageDirectWindow.__JPT_DIRECT_PLAYBACK_CONTROLLER_OPTIONS__ = directRuntimeAppAssembly;
  delayedSamePageDirectWindow.dispatchEvent(new Event('jpt-direct-playback-ready'));
}, 0);
assert.equal(
  await delayedPreferredResolver.ensureDirectHostOptions(),
  directRuntimeAppAssembly,
  'Chart direct playback host resolver gives a same-page direct host a short grace window before falling back to the iframe-backed target.'
);
const chartDirectControllerOptions = createChartDirectPlaybackControllerOptions({
  getTargetWindow: () => chartDirectTargetWindow,
  getPreferredTargetWindow: () => chartDirectTargetWindow,
  getFallbackTargetWindow: () => null,
  getTempo: () => 155,
  getCurrentChartTitle: () => 'Chart Test'
});
const chartDirectLoadResult = await chartDirectControllerOptions.loadDirectSession?.(satinSession, {
  transposition: 4
});
assert.equal(
  chartDirectLoadResult?.ok,
  true,
  'Chart direct playback controller options can load a chart session through the published direct host options.'
);
assert.equal(
  typeof chartDirectControllerOptions.startPlayback,
  'function',
  'Chart direct playback controller options expose direct transport controls.'
);
const chartDirectUnavailableControllerOptions = createChartDirectPlaybackControllerOptions({
  getTargetWindow: () => /** @type {any} */ ({ __JPT_PLAYBACK_API__: embeddedApi }),
  getPreferredTargetWindow: () => /** @type {any} */ ({ __JPT_PLAYBACK_API__: embeddedApi }),
  getFallbackTargetWindow: () => null,
  getHostFrame: () => null
});
assert.deepEqual(
  await chartDirectUnavailableControllerOptions.loadDirectSession?.(satinSession, {}),
  {
    ok: false,
    errorMessage: 'Direct playback host unavailable.',
    state: null
  },
  'Chart direct playback controller options no longer fall back to the legacy embedded API when direct host options are unavailable.'
);
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
const PracticePlaybackAssembly = createPracticePlaybackAssembly({
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
  PracticePlaybackAssembly.playbackController,
  PracticePlaybackAssembly.playbackRuntime.ensurePlaybackController(),
  'Core practice playback assembly materializes the same controller as its runtime.'
);
const directPlaybackAssembly = createDirectPlaybackAssembly({
  loadDirectSession(sessionSpec, playbackSettings) {
    directAdapterCalls.push({ kind: 'assembly-load', sessionSpec, playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  updateDirectPlaybackSettings(playbackSettings) {
    directAdapterCalls.push({ kind: 'assembly-settings', playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  getDirectPlaybackState() {
    return drillRuntimeState;
  }
});
assert.equal(
  directPlaybackAssembly.playbackController,
  directPlaybackAssembly.playbackRuntime.ensurePlaybackController(),
  'Direct playback assembly materializes the same controller as its runtime.'
);
const PracticePlaybackAssemblyProvider = createPracticePlaybackAssemblyProvider({
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
  PracticePlaybackAssemblyProvider.getAssembly(),
  PracticePlaybackAssemblyProvider.getAssembly(),
  'Practice playback assembly provider memoizes the practice playback assembly instance.'
);
assert.equal(
  PracticePlaybackAssemblyProvider.getAssembly().playbackController,
  PracticePlaybackAssemblyProvider.getAssembly().playbackRuntime.ensurePlaybackController(),
  'Practice playback assembly provider returns a stable assembly/controller pair.'
);
const directPlaybackAssemblyProvider = createDirectPlaybackAssemblyProvider({
  loadDirectSession(sessionSpec, playbackSettings) {
    directAdapterCalls.push({ kind: 'provider-assembly-load', sessionSpec, playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  updateDirectPlaybackSettings(playbackSettings) {
    directAdapterCalls.push({ kind: 'provider-assembly-settings', playbackSettings });
    return { ok: true, state: drillRuntimeState };
  },
  getDirectPlaybackState() {
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
    loadDirectSession() {
      return { ok: true, state: drillRuntimeState };
    },
    updateDirectPlaybackSettings() {
      return { ok: true, state: drillRuntimeState };
    },
    getDirectPlaybackState() {
      return drillRuntimeState;
    }
  }).ensurePlaybackController,
  typeof createFeatureDirectPlaybackRuntime({
    loadDirectSession() {
      return { ok: true, state: drillRuntimeState };
    },
    updateDirectPlaybackSettings() {
      return { ok: true, state: drillRuntimeState };
    },
    getDirectPlaybackState() {
      return drillRuntimeState;
    }
  }).ensurePlaybackController,
  'Feature-level direct playback runtime alias stays wired to the shared runtime implementation.'
);
assert.equal(
  typeof createDirectPlaybackController({
    loadDirectSession() {
      return { ok: true, state: drillRuntimeState };
    },
    updateDirectPlaybackSettings() {
      return { ok: true, state: drillRuntimeState };
    },
    getDirectPlaybackState() {
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
  directPlaybackRuntimeHost: {
    ensureFrame: () => /** @type {any} */ ({ contentWindow: chartDirectTargetWindow }),
    getTargetWindow: () => chartDirectTargetWindow,
    getDirectPlaybackOptions: () => chartDirectRuntimeHost.getDirectPlaybackOptions()
  },
  getPlaybackBridgeFrame: () => {
    throw new Error('Direct chart runtime context should not resolve the embedded bridge frame.');
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
assert.equal(
  createChartPlaybackRuntimeContextBindings({
    mode: 'direct'
  }).mode,
  'direct',
  'Chart playback runtime-context bindings preserve grouped chart runtime concerns for the shared context seam.'
);
assert.equal(
  createChartRuntimeControlsBindings({
    onPlayClick: () => {}
  }).onPlayClick instanceof Function,
  true,
  'Chart runtime-controls bindings preserve grouped chart event handlers for the shared controls seam.'
);
assert.equal(
  createChartRuntimeControlsAppBindings({
    chartSearchInput: { id: 'chart-search-input' }
  }).chartSearchInput.id,
  'chart-search-input',
  'Chart runtime-controls app bindings preserve grouped app-level control wiring for the shared controls seam.'
);
assert.equal(
  createChartTransportBindings({
    totalBars: 32
  }).totalBars,
  32,
  'Chart transport bindings preserve grouped transport-rendering concerns for the shared transport seam.'
);
assert.equal(
  createChartMetaBindings({
    chartMeta: { id: 'chart-meta' }
  }).chartMeta.id,
  'chart-meta',
  'Chart meta bindings preserve grouped meta-rendering concerns for the shared meta seam.'
);
assert.equal(
  createChartImportControlsBindings({
    defaultPlaylistsUrl: 'https://example.test'
  }).defaultPlaylistsUrl,
  'https://example.test',
  'Chart import-controls bindings preserve grouped import-control concerns for the shared import seam.'
);
assert.equal(
  createChartImportStatusBindings({
    message: 'Loaded'
  }).message,
  'Loaded',
  'Chart import-status bindings preserve grouped import-status concerns for the shared import seam.'
);
assert.equal(
  createChartLibraryImportBindings({
    sourceFile: 'test.irealb'
  }).sourceFile,
  'test.irealb',
  'Chart library-import bindings preserve grouped parsing concerns for the shared library-import seam.'
);
assert.equal(
  createChartImportedLibraryBindings({
    source: 'pasted iReal link'
  }).source,
  'pasted iReal link',
  'Chart imported-library bindings preserve grouped library-application concerns for the shared imported-library seam.'
);
assert.equal(
  createChartFixtureRenderBindings({
    fixtureSelect: { value: 'autumn-leaves' }
  }).fixtureSelect.value,
  'autumn-leaves',
  'Chart fixture-render bindings preserve grouped fixture-rendering concerns for the shared fixture seam.'
);
assert.equal(
  createChartDefaultLibraryBindings({
    sourceUrl: 'https://example.test/default.txt'
  }).sourceUrl,
  'https://example.test/default.txt',
  'Chart default-library bindings preserve grouped bundled-library import concerns for the shared default-library seam.'
);
assert.equal(
  createChartNavigationBindings({
    getSelectedId: () => 'autumn-leaves'
  }).getSelectedId(),
  'autumn-leaves',
  'Chart navigation bindings preserve grouped navigation concerns for the shared navigation seam.'
);
assert.equal(
  createChartNavigationStateBindings({
    selectedId: 'autumn-leaves'
  }).selectedId,
  'autumn-leaves',
  'Chart navigation-state bindings preserve grouped navigation-state concerns for the shared navigation seam.'
);
assert.equal(
  createChartSheetRendererBindings({
    getDisplayedBarGroupSize: () => 4
  }).getDisplayedBarGroupSize(),
  4,
  'Chart sheet-renderer bindings preserve grouped chart-renderer concerns for the shared sheet seam.'
);
assert.equal(
  createChartSheetRendererAppBindings({
    sheetGrid: { id: 'sheet-grid' }
  }).sheetGrid.id,
  'sheet-grid',
  'Chart sheet-renderer app bindings preserve grouped renderer-factory concerns for the shared sheet seam.'
);
assert.equal(
  createChartScreenBindings({
    renderFixture: () => 'rendered'
  }).renderFixture(),
  'rendered',
  'Chart screen bindings preserve grouped chart-screen boot concerns for the shared initialization seam.'
);
assert.equal(
  createChartScreenAppBindings({
    syncPlaybackSettings: () => 'synced'
  }).syncPlaybackSettings(),
  'synced',
  'Chart screen app bindings preserve grouped screen-initialization concerns for the shared initialization seam.'
);
assert.equal(
  createChartOverlayControlsBindings({
    onOpenOverlay: () => 'opened'
  }).onOpenOverlay(),
  'opened',
  'Chart overlay-controls bindings preserve grouped overlay wiring concerns for the shared screen seam.'
);
assert.equal(
  createChartLayoutObserversBindings({
    applyOpticalPlacements: () => 'applied'
  }).applyOpticalPlacements(),
  'applied',
  'Chart layout-observers bindings preserve grouped layout wiring concerns for the shared screen seam.'
);
assert.equal(
  createChartSelectionRenderBindings({
    selectionSummaryElement: { id: 'selection-summary' }
  }).selectionSummaryElement.id,
  'selection-summary',
  'Chart selection-render bindings preserve grouped selection UI concerns for the shared screen seam.'
);
assert.equal(
  createChartMixerBindings({
    masterVolumeValue: { id: 'master-volume-value' }
  }).masterVolumeValue.id,
  'master-volume-value',
  'Chart mixer bindings preserve grouped mixer-output concerns for the shared screen seam.'
);
assert.equal(
  createChartOverlayShellBindings({
    chartApp: { id: 'chart-app' }
  }).chartApp.id,
  'chart-app',
  'Chart overlay-shell bindings preserve grouped overlay-shell concerns for the shared screen seam.'
);
assert.equal(
  createChartBarSelectionBindings({
    renderSelectionState: () => 'rendered'
  }).renderSelectionState(),
  'rendered',
  'Chart bar-selection bindings preserve grouped selection-handler concerns for the shared screen seam.'
);
assert.equal(
  createChartPopoverBindings({
    popovers: ['manage', 'settings']
  }).popovers.length,
  2,
  'Chart popover bindings preserve grouped popover-shell concerns for the shared screen seam.'
);
assert.equal(
  createChartSelectorBindings({
    previousId: 'autumn-leaves'
  }).previousId,
  'autumn-leaves',
  'Chart selector bindings preserve grouped selector-rendering concerns for the shared selector seam.'
);
assert.equal(
  createAppShellBindings({
    mode: 'chart'
  }).mode,
  'chart',
  'App-shell bindings preserve grouped shell-initialization concerns for the shared app-shell seam.'
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
const embeddedPlaybackApi = createFeatureEmbeddedPlaybackApi({
  playbackRuntime: PracticePlaybackRuntime,
  applyEmbeddedPattern(payload) {
    drillAdapterCalls.push({ kind: 'embedded-api-pattern', payload });
    return { ok: true, state: drillRuntimeState };
  },
  getPlaybackState() {
    return /** @type {any} */ ({ ...drillRuntimeState, isEmbeddedMode: true });
  }
});
await embeddedPlaybackApi.applyEmbeddedPlaybackSettings({ transposition: 3 });
await embeddedPlaybackApi.startPlayback();
await embeddedPlaybackApi.togglePausePlayback();
assert.equal(
  drillAdapterCalls.find(call => call.kind === 'runtime-settings')?.settings?.transposition,
  3,
  'Embedded playback API can drive playback settings through the shared playback runtime boundary.'
);
assert.equal(
  drillAdapterCalls.filter(call => call.kind === 'runtime-start').length,
  1,
  'Embedded playback API starts playback through the shared playback runtime boundary.'
);
assert.equal(
  drillAdapterCalls.filter(call => call.kind === 'runtime-pause').length,
  1,
  'Embedded playback API toggles pause through the shared playback runtime boundary.'
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
  embeddedApi: embeddedPlaybackApi,
  playbackRuntime: PracticePlaybackRuntime,
  playbackController: PracticePlaybackRuntime.ensurePlaybackController()
});
const publishedGlobals = readEmbeddedPlaybackGlobals(/** @type {any} */ (globalTargetWindow));
assert.equal(publishedGlobals.embeddedApi, embeddedPlaybackApi, 'Embedded playback globals publish the embedded API through a single boundary.');
assert.equal(publishedGlobals.playbackRuntime, PracticePlaybackRuntime, 'Embedded playback globals publish the playback runtime through a single boundary.');
assert.equal(
  publishedGlobals.playbackController,
  PracticePlaybackRuntime.ensurePlaybackController(),
  'Embedded playback globals keep the legacy playback controller global for compatibility.'
);
assert.deepEqual(
  globalEvents,
  ['jpt-playback-api-ready'],
  'Embedded playback globals publish the playback ready event through a single boundary.'
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

