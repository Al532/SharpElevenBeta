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
import { createDrillAudioRuntime } from '../features/drill/drill-audio-runtime.js';
import { createEmbeddedDrillRuntimeAppContextOptions } from '../features/drill/drill-embedded-runtime-app-context.js';
import { createDrillPatternAnalysis } from '../features/drill/drill-pattern-analysis.js';
import { loadDrillPatternHelp } from '../features/drill/drill-pattern-help.js';
import { validateDrillCustomPattern } from '../features/drill/drill-pattern-validation.js';
import { createDrillPlaybackPreparationRuntime } from '../features/drill/drill-playback-preparation-runtime.js';
import { createDrillPlaybackPreparationAppContext } from '../features/drill/drill-playback-preparation-app-context.js';
import { createDrillPlaybackResourcesAppFacade } from '../features/drill/drill-playback-resources-app-facade.js';
import { createDrillPlaybackSettingsRuntime } from '../features/drill/drill-playback-settings-runtime.js';
import { createDrillSessionAnalytics } from '../features/drill/drill-session-analytics.js';
import { createDrillPlaybackRuntimeHost } from '../features/drill/drill-playback-runtime-host.js';
import {
  createDefaultDrillAppSettingsFactory,
  createDrillLoadedSettingsApplier,
  createDrillLoadedSettingsFinalizer,
  createDrillPlaybackSettingsResetter,
  createDrillSettingsSnapshotBuilder
} from '../features/drill/drill-settings.js';
import {
  createDrillEmbeddedRuntimeContextBindings,
  createDrillNormalizationBindings,
  createDrillPatternUiBindings,
  createDrillPlaybackSettingsBindings,
  createDrillPlaybackRuntimeBindings,
  createDrillPlaybackStateBindings,
  createDrillTransportActionBindings
} from '../features/drill/drill-runtime-app-bindings.js';
import { createDrillAudioRuntimeAppContext } from '../features/drill/drill-audio-runtime-app-context.js';
import { createDrillAudioStackAppAssembly } from '../features/drill/drill-audio-stack-app-assembly.js';
import { createDrillAudioStackAppFacade } from '../features/drill/drill-audio-stack-app-facade.js';
import { createDrillAudioPlaybackRuntime } from '../features/drill/drill-audio-playback-runtime.js';
import { createDrillAudioPlaybackAppContext } from '../features/drill/drill-audio-playback-app-context.js';
import { createDrillEmbeddedRuntimeAppAssembly } from '../features/drill/drill-embedded-runtime-app-assembly.js';
import { createDrillEmbeddedRuntimeHostBindings } from '../features/drill/drill-embedded-runtime-host.js';
import { createDrillPianoToolsAppFacade } from '../features/drill/drill-piano-tools.js';
import { createDrillSamplePlaybackRuntime } from '../features/drill/drill-sample-playback-runtime.js';
import { createDrillSamplePlaybackAppContext } from '../features/drill/drill-sample-playback-app-context.js';
import { createDrillSamplePreloadAppContext } from '../features/drill/drill-sample-preload-app-context.js';
import { createDrillSamplePreloadRuntime } from '../features/drill/drill-sample-preload-runtime.js';
import { createDrillScheduledAudioRuntime } from '../features/drill/drill-scheduled-audio-runtime.js';
import { createDrillScheduledAudioAppContext } from '../features/drill/drill-scheduled-audio-app-context.js';
import { createDirectPlaybackController, createDirectPlaybackRuntime as createFeatureDirectPlaybackRuntime, createDrillPlaybackRuntime } from '../features/drill/drill-playback-controller.js';
import { createDrillPlaybackEngineAppContext } from '../features/drill/drill-playback-engine-app-context.js';
import { createDrillPlaybackRuntimeAppAssembly } from '../features/drill/drill-playback-runtime-app-assembly.js';
import { createDrillPlaybackStateAppContext } from '../features/drill/drill-playback-state-app-context.js';
import {
  createDrillPlaybackSchedulerState,
  createDrillPlaybackTransportState
} from '../features/drill/drill-playback-runtime-engine.js';
import { createWalkingBassGenerator } from '../walking-bass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'jazz-1460.txt');

const drillPatternAnalysis = createDrillPatternAnalysis({
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
const patternHelpDom = { patternHelp: { innerHTML: '' } };
await loadDrillPatternHelp({
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
  validateDrillCustomPattern({
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
  validateDrillCustomPattern({
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
const drillPlaybackSettingsRuntime = createDrillPlaybackSettingsRuntime({
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
  drillPlaybackSettingsRuntime.getCompingStyle(),
  'piano',
  'Drill playback settings runtime normalizes comping style through shared helpers.'
);
assert.equal(
  drillPlaybackSettingsRuntime.isChordsEnabled(),
  true,
  'Drill playback settings runtime enables chords when comping is active and strings volume is non-zero.'
);
assert.equal(
  drillPlaybackSettingsRuntime.getDrumsMode(),
  'full_swing',
  'Drill playback settings runtime reads drum mode from DOM state with legacy defaults.'
);
assert.equal(
  drillPlaybackSettingsRuntime.getBassMidi(2, 0),
  38,
  'Drill playback settings runtime maps bass pitch classes into the configured preload range.'
);
assert.equal(
  drillPlaybackSettingsRuntime.bassMidiToNoteName(38),
  'D2',
  'Drill playback settings runtime exposes bass-note labels for debug and UI helpers.'
);
drillPlaybackSettingsRuntime.applyMixerSettings();
assert.equal(
  appliedMixerPayloads.length,
  1,
  'Drill playback settings runtime forwards mixer synchronization through the injected audio helper.'
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
const resetPlaybackSettings = createDrillPlaybackSettingsResetter({
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
  'Drill playback-settings resetter reapplies the default enabled-key set.'
);
assert.equal(
  resetPreviewLeadValue,
  2,
  'Drill playback-settings resetter restores the next-preview lead value from default app settings.'
);
assert.equal(
  resetPianoFadeSettings.timeConstantLow,
  0.1,
  'Drill playback-settings resetter restores piano fade settings through the shared settings boundary.'
);
assert.equal(
  resetPianoMidiSettings.enabled,
  false,
  'Drill playback-settings resetter restores piano MIDI settings through the shared settings boundary.'
);
assert.equal(
  resetTrackedEvent,
  'settings_reset',
  'Drill playback-settings resetter keeps the settings-reset analytics event.'
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
const drillPlaybackRuntimeHost = createDrillPlaybackRuntimeHost({
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
  }
});
assert.equal(
  typeof drillPlaybackRuntimeHost.start,
  'function',
  'Drill playback runtime host exposes transport controls through the extracted host boundary.'
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
  createDrillPlaybackStateBindings({
    isEmbeddedMode: true,
    getIsPlaying: () => true
  }).isEmbeddedMode,
  true,
  'Drill runtime app bindings preserve embedded-mode state flags.'
);
assert.equal(
  typeof createDrillPatternUiBindings({
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
  typeof createDrillPlaybackSettingsBindings({
    applyMixerSettings: () => {}
  }).applyMixerSettings,
  'function',
  'Drill runtime app bindings preserve playback-settings hooks consumed by the embedded runtime.'
);
assert.equal(
  createDrillPlaybackRuntimeBindings({
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
const audioRuntime = createDrillAudioRuntime({
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
const audioRuntimeAppContext = createDrillAudioRuntimeAppContext({
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
const audioStackAssembly = createDrillAudioStackAppAssembly({
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
const audioStackFacade = createDrillAudioStackAppFacade({
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
const samplePreloadEvents = [];
const samplePreloadRuntime = createDrillSamplePreloadRuntime({
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
const samplePreloadAppContext = createDrillSamplePreloadAppContext({
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
const audioPlaybackRuntime = createDrillAudioPlaybackRuntime({
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
const audioPlaybackAppContext = createDrillAudioPlaybackAppContext({
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
const scheduledAudioRuntime = createDrillScheduledAudioRuntime({
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
const scheduledAudioAppContext = createDrillScheduledAudioAppContext({
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
const samplePlaybackRuntime = createDrillSamplePlaybackRuntime({
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
const samplePlaybackAppContext = createDrillSamplePlaybackAppContext({
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
const playbackPreparationRuntime = createDrillPlaybackPreparationRuntime({
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
  'Drill playback preparation runtime exposes the prepared next progression shape for comping decisions.'
);
assert.deepEqual(
  playbackPreparationRuntime.getVoicingAtIndex([{ semitones: 0 }], 0, 0, false),
  { planned: true },
  'Drill playback preparation runtime prefers precomputed voicings when available.'
);
playbackPreparationRuntime.rebuildPreparedCompingPlans();
assert.equal(
  preparedCurrentCompingPlan?.id,
  'current-plan',
  'Drill playback preparation runtime stores rebuilt current comping plans.'
);
assert.equal(
  preparedNextCompingPlan?.id,
  'next-plan',
  'Drill playback preparation runtime stores rebuilt next comping plans.'
);
const resolvedWalkingBassGenerator = await playbackPreparationRuntime.ensureWalkingBassGenerator();
assert.ok(
  resolvedWalkingBassGenerator && typeof resolvedWalkingBassGenerator.buildLine === 'function',
  'Drill playback preparation runtime resolves the shared walking-bass generator.'
);
assert.deepEqual(
  playbackPreparationRuntime.buildPreparedBassPlan(),
  [{ midi: 40, timeBeats: 0 }],
  'Drill playback preparation runtime builds and stores prepared bass plans through the shared generator.'
);
assert.equal(
  walkingBassBuilds[0]?.tempoBpm,
  140,
  'Drill playback preparation runtime forwards tempo to the walking-bass generator.'
);
let preparationCurrentCompingPlan = null;
let preparationNextCompingPlan = null;
let preparationCurrentBassPlan = [];
const playbackPreparationAppContext = createDrillPlaybackPreparationAppContext({
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
  'Drill playback preparation app context materializes the shared comping-preparation runtime.'
);
assert.deepEqual(
  playbackPreparationAppContext.buildPreparedBassPlan(),
  [{ midi: 41, timeBeats: 0 }],
  'Drill playback preparation app context materializes the shared bass-preparation runtime.'
);
assert.equal(
  preparationNextCompingPlan?.id,
  'ctx-next-plan',
  'Drill playback preparation app context preserves next-progression comping writes.'
);
const playbackResourcesFacade = createDrillPlaybackResourcesAppFacade({
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
  'Drill playback resources facade forwards preparation helpers.'
);
assert.deepEqual(
  playbackResourcesFacade.buildPreparedBassPlan(12),
  ['bass-plan', 12],
  'Drill playback resources facade preserves bass-plan arguments.'
);
assert.equal(
  playbackResourcesFacade.ensureBackgroundSamplePreload(),
  'background',
  'Drill playback resources facade forwards preload helpers from the audio facade.'
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
const drillPlaybackEngineAppContext = createDrillPlaybackEngineAppContext({
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
  drillPlaybackEngineAppContext.schedulerState,
  schedulerState,
  'Drill playback engine app context keeps the scheduler state boundary explicit.'
);
assert.equal(
  drillPlaybackEngineAppContext.transportState,
  transportState,
  'Drill playback engine app context keeps the transport state boundary explicit.'
);
assert.equal(
  drillPlaybackEngineAppContext.schedulerHelpers.getSecondsPerBeat(),
  0.5,
  'Drill playback engine app context materializes scheduler helpers from app bindings.'
);
assert.equal(
  typeof drillPlaybackEngineAppContext.transportHelpers.initAudio,
  'function',
  'Drill playback engine app context materializes transport helpers from app bindings.'
);
const drillPlaybackRuntimeAppAssembly = createDrillPlaybackRuntimeAppAssembly({
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
  typeof drillPlaybackRuntimeAppAssembly.start,
  'function',
  'Drill playback runtime app assembly materializes the shared playback transport.'
);
assert.equal(
  typeof drillPlaybackRuntimeAppAssembly.prepareNextProgressionPlayback,
  'function',
  'Drill playback runtime app assembly materializes the shared playback scheduler.'
);
const drillPlaybackStateAppContext = createDrillPlaybackStateAppContext({
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
  drillPlaybackStateAppContext.schedulerState.pendingDisplayTimeouts,
  schedulerPendingDisplayTimeouts,
  'Drill playback state app context builds the scheduler proxy from app bindings.'
);
drillPlaybackStateAppContext.transportState.currentBeat = 1;
assert.equal(
  transportCurrentBeat,
  1,
  'Drill playback state app context builds the transport proxy from app bindings.'
);
let embeddedRuntimeStopIfPlayingCalls = 0;
const embeddedRuntimeAppContextOptions = createEmbeddedDrillRuntimeAppContextOptions({
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
  'Embedded drill runtime app context reuses grouped app actions to stop active playback.'
);
assert.equal(
  embeddedRuntimeAppContextOptions.playbackControllerOptions.noteFadeout,
  0.1,
  'Embedded drill runtime app context forwards direct runtime controller options through the grouped boundary.'
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
