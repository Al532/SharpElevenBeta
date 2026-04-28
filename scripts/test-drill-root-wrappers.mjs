import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  AUDIO_MIXER_CONFIG,
  AUDIO_LEVELS,
  AUDIO_SCHEDULING,
  AUDIO_TIMING,
  COMPING_STYLES,
  DISPLAY_MODES,
  DRUM_MODES,
  HARMONY_DISPLAY_MODES,
  INSTRUMENT_RANGES,
  NEXT_PREVIEW_UNITS,
  ONE_TIME_MIGRATIONS,
  PATTERN_MODES,
  PIANO_COMPING_CONFIG,
  PIANO_SAMPLE_RANGE,
  PIANO_SETTINGS_CONFIG,
  REVIEW_STANDARD_CONVERSIONS_URL,
  SAMPLE_LIBRARY_CONFIG,
  TRAINER_APP_CONFIG,
  TRAINER_AUDIO_CONFIG,
  TRAINER_DEFAULTS,
  TRAINER_MODE_CONFIG,
  TRAINER_PRESET_CONFIG,
  TRAINER_RESOURCE_PATHS,
  VOICING_RANDOMIZATION_CONFIG,
  WELCOME_CONFIG,
  WELCOME_ONE_CHORDS,
  WELCOME_PROGRESSIONS,
  WELCOME_STANDARDS_FALLBACK
} from '../src/config/trainer-config.ts';
import { createCompingEngine } from '../src/features/practice-arrangement/practice-arrangement-comping-engine.ts';
import {
  createProgressionEntry as createProgressionEntryBase,
  isProgressionModeToken,
  normalizeProgressionEntry as normalizeProgressionEntryBase,
  normalizeProgressionsMap as normalizeProgressionsMapBase,
  parseDefaultProgressionsText as parseDefaultProgressionsTextBase
} from '../src/features/progression/progression-library.ts';
import { createPracticeArrangementCompingEngineAppBindings } from '../src/features/practice-arrangement/practice-arrangement-comping-engine-app-bindings.ts';
import { createPracticeArrangementCompingEngineRootAppAssembly } from '../src/features/practice-arrangement/practice-arrangement-comping-engine-root-app-assembly.ts';
import { createDrillDisplayRootAppFacade } from '../src/features/drill/drill-display-root-app-facade.ts';
import { createDrillKeysRootAppAssembly } from '../src/features/drill/drill-keys-root-app-assembly.ts';
import { createDrillPianoMidiRuntimeRootAppAssembly } from '../src/features/drill/drill-piano-midi-runtime-root-app-assembly.ts';
import { createDrillNormalizationRootAppContext } from '../src/features/drill/drill-normalization-root-app-context.ts';
import { createDrillPianoToolsAppBindings } from '../src/features/drill/drill-piano-tools-app-bindings.ts';
import { createDrillPianoToolsAppFacade } from '../src/features/drill/drill-piano-tools.ts';
import { createDrillPianoToolsRootAppFacade } from '../src/features/drill/drill-piano-tools-root-app-facade.ts';
import { createDrillDisplayRuntimeRootAppAssembly } from '../src/features/drill/drill-display-runtime-root-app-assembly.ts';
import { createDrillNextPreviewRootAppFacade } from '../src/features/drill/drill-next-preview-root-app-facade.ts';
import { createDrillProgressionRootAppAssembly } from '../src/features/drill/drill-progression-root-app-assembly.ts';
import { createDrillSettingsPersistenceRootAppAssembly } from '../src/features/drill/drill-settings-persistence-root-app-assembly.ts';
import { createDrillStartupDataRootAppAssembly } from '../src/features/drill/drill-startup-data-root-app-assembly.ts';
import { createPracticePlaybackRuntimeHostAppBindings } from '../src/features/practice-playback/practice-playback-runtime-host-app-bindings.ts';
import { createDrillUiEventBindingsRootAppAssembly } from '../src/features/drill/drill-ui-event-bindings-root-app-assembly.ts';
import { createDrillWelcomeRootAppFacade } from '../src/features/drill/drill-welcome-root-app-facade.ts';
import {
  createPracticePlaybackDirectRuntimeAppContext,
  createPracticePlaybackDirectStateAppContext,
  createPracticePlaybackDirectTransportAppContext,
  createPracticePlaybackEmbeddedRuntimeAppContext,
  createPracticePlaybackEmbeddedStateAppContext,
  createPracticePlaybackHostAppContext,
  createPracticePlaybackNormalizationAppContext,
  createPracticePlaybackPatternUiAppContext,
  createPracticePlaybackSettingsAppContext
} from '../src/features/practice-playback/practice-playback-app-context.ts';
import { createPracticePlaybackRootAppContext } from '../src/features/practice-playback/practice-playback-root-app-context.ts';
import { createDrillUiBootstrapRootAppAssembly } from '../src/features/drill/drill-ui-bootstrap-root-app-assembly.ts';
import { createPracticeArrangementVoicingRuntimeAppBindings } from '../src/features/practice-arrangement/practice-arrangement-voicing-runtime-app-bindings.ts';
import { createPracticeArrangementVoicingRuntimeRootAppAssembly } from '../src/features/practice-arrangement/practice-arrangement-voicing-runtime-root-app-assembly.ts';
import { createPracticeArrangementVoicingRuntime } from '../src/features/practice-arrangement/practice-arrangement-voicing-runtime.ts';
import { createPracticeArrangementWalkingBassAppBindings } from '../src/features/practice-arrangement/practice-arrangement-walking-bass-app-bindings.ts';
import { createPracticeArrangementWalkingBassRootAppAssembly } from '../src/features/practice-arrangement/practice-arrangement-walking-bass-root-app-assembly.ts';
import { createWalkingBassGenerator } from '../src/features/practice-arrangement/practice-arrangement-walking-bass.ts';

function withMockedRandom(sequence, callback) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = sequence[index] ?? sequence[sequence.length - 1] ?? 0;
    index += 1;
    return value;
  };

  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function getSourceIndexOrThrow(source, needle, label = needle) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `Expected to find ${label} in src/app.ts.`);
  return index;
}

function readAppSource() {
  return readFileSync(
    new URL('../src/app.ts', import.meta.url),
    'utf8'
  ).replace(/\r\n/g, '\n');
}

function createCompingOptions() {
  return {
    constants: {
      AUTOMATION_CURVE_STEPS: 4,
      CHORD_ANTICIPATION: 0.25,
      CHORD_FADE_BEFORE: 0.05,
      CHORD_FADE_DUR: 0.1,
      CHORD_VOLUME_MULTIPLIER: 0.2,
      NOTE_FADEOUT: 0.1,
      PIANO_COMP_DURATION_RATIO: 0.4,
      PIANO_COMP_MAX_DURATION: 0.24,
      PIANO_COMP_MIN_DURATION: 0.12,
      PIANO_VOLUME_MULTIPLIER: 0.27,
      PORTAMENTO_ALWAYS_ON: false,
      STRING_LEGATO_FADE_TIME: 0.05,
      STRING_LEGATO_GLIDE_TIME: 0.02,
      STRING_LEGATO_HOLD_TIME: 0.1,
      STRING_LEGATO_MAX_DISTANCE: 12,
      STRING_LEGATO_PRE_DIP_RATIO: 0.5,
      STRING_LEGATO_PRE_DIP_TIME: 0.02
    },
    helpers: {
      getAudioContext: () => null,
      getPreparedNextProgression: () => null,
      getPianoVoicingMode: () => 'piano',
      getSecondsPerBeat: () => 0.5,
      getSwingRatio: () => 2,
      getVoicingAtIndex: () => null,
      playSample: () => null
    }
  };
}

function createVoicingOptions() {
  const currentVoicingPlan = [{ id: 'current-voicing' }];
  const nextVoicingPlan = [{ id: 'next-voicing' }];
  const currentPaddedChords = [{
    semitones: 0,
    qualityMajor: '7',
    qualityMinor: '7',
    roman: 'V',
    modifier: ''
  }];
  const nextPaddedChords = [{
    semitones: 5,
    qualityMajor: 'maj7',
    qualityMinor: 'm7',
    roman: 'I',
    modifier: ''
  }];

  return {
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
    getCurrentPaddedChords: () => currentPaddedChords,
    getCurrentKey: () => 0,
    getCurrentVoicingPlan: () => currentVoicingPlan,
    getNextPaddedChords: () => nextPaddedChords,
    getNextKeyValue: () => 5,
    getNextVoicingPlan: () => nextVoicingPlan
  };
}

function createPianoToolsHarness() {
  const dom = {
    pianoMidiStatus: { textContent: '' },
    pianoSettingsJson: { value: '' },
    pianoTimeConstantLow: { value: '0.08' },
    pianoTimeConstantHigh: { value: '0.04' },
    pianoMidiEnabled: { checked: false },
    pianoMidiSustain: { checked: false },
    pianoMidiInput: { value: '' }
  };
  let fadeSettings = {
    timeConstantLow: 0.09,
    timeConstantHigh: 0.05
  };
  let midiSettings = {
    enabled: false,
    inputId: '',
    sustainPedalEnabled: true
  };
  let attachCalls = 0;
  let saveCalls = 0;

  return {
    options: {
      dom,
      version: 1,
      getPianoFadeSettings: () => fadeSettings,
      setPianoFadeSettings: (value) => { fadeSettings = value; },
      normalizePianoFadeSettings: (value = {}) => ({
        timeConstantLow: Number(value.timeConstantLow ?? 0),
        timeConstantHigh: Number(value.timeConstantHigh ?? 0)
      }),
      getPianoMidiSettings: () => midiSettings,
      setPianoMidiSettings: (value) => { midiSettings = value; },
      normalizePianoMidiSettings: (value = {}) => ({
        enabled: Boolean(value.enabled),
        inputId: String(value.inputId ?? ''),
        sustainPedalEnabled: value.sustainPedalEnabled !== false
      }),
      attachMidiInput: () => { attachCalls += 1; },
      saveSettings: () => { saveCalls += 1; }
    },
    getState: () => ({
      dom,
      fadeSettings,
      midiSettings,
      attachCalls,
      saveCalls
    })
  };
}

function createEventTarget(initialState = {}) {
  const listeners = new Map();

  return {
    ...initialState,
    addEventListener: (eventName, handler) => {
      listeners.set(eventName, handler);
    },
    dispatch: (eventName, event = {}) => {
      const handler = listeners.get(eventName);
      if (handler) {
        handler({
          preventDefault: () => {},
          ...event
        });
      }
    },
    hasListener: (eventName) => listeners.has(eventName),
    classList: initialState.classList ?? {
      toggle: () => {},
      add: () => {},
      remove: () => {}
    },
    focus: initialState.focus ?? (() => {})
  };
}

function testCompingEngineRootWrapper() {
  const options = createCompingOptions();
  const directCompingEngine = createCompingEngine(
    createPracticeArrangementCompingEngineAppBindings(options)
  );
  const rootCompingEngine = createPracticeArrangementCompingEngineRootAppAssembly(options);
  const preparedInput = {
    style: 'off',
    previousKey: null,
    current: {
      chords: [],
      key: 0,
      isMinor: false,
      beatsPerChord: 1
    },
    next: {
      chords: [],
      key: 0,
      isMinor: false,
      beatsPerChord: 1
    }
  };

  assert.deepEqual(
    Object.keys(rootCompingEngine).sort(),
    Object.keys(directCompingEngine).sort(),
    'Comping root wrapper preserves the comping engine surface.'
  );
  assert.deepEqual(
    rootCompingEngine.buildPreparedPlans(preparedInput),
    directCompingEngine.buildPreparedPlans(preparedInput),
    'Comping root wrapper preserves the prepared-plan behavior for the off style.'
  );
}

function testVoicingRuntimeRootWrapper() {
  const options = createVoicingOptions();
  const directVoicingRuntime = createPracticeArrangementVoicingRuntime(
    createPracticeArrangementVoicingRuntimeAppBindings(options)
  );
  const rootVoicingRuntime = createPracticeArrangementVoicingRuntimeRootAppAssembly(options);
  const currentChord = options.getCurrentPaddedChords()[0];
  const nextChord = options.getNextPaddedChords()[0];

  assert.equal(
    rootVoicingRuntime.getPlayedChordQuality(currentChord, false, nextChord),
    directVoicingRuntime.getPlayedChordQuality(currentChord, false, nextChord),
    'Voicing root wrapper preserves the shared played-chord quality behavior.'
  );
  assert.equal(
    rootVoicingRuntime.getVoicingPlanForProgression(
      options.getNextPaddedChords(),
      options.getNextKeyValue()
    ),
    directVoicingRuntime.getVoicingPlanForProgression(
      options.getNextPaddedChords(),
      options.getNextKeyValue()
    ),
    'Voicing root wrapper preserves next-progression voicing plan resolution.'
  );
}

function testPianoToolsRootWrapper() {
  const directHarness = createPianoToolsHarness();
  const rootHarness = createPianoToolsHarness();
  const directFacade = createDrillPianoToolsAppFacade(
    createDrillPianoToolsAppBindings(directHarness.options)
  );
  const rootFacade = createDrillPianoToolsRootAppFacade(rootHarness.options);

  directFacade.applyPianoMidiSettings({
    enabled: true,
    inputId: 'midi-direct',
    sustainPedalEnabled: false
  });
  rootFacade.applyPianoMidiSettings({
    enabled: true,
    inputId: 'midi-direct',
    sustainPedalEnabled: false
  });

  assert.deepEqual(
    Object.keys(rootFacade).sort(),
    Object.keys(directFacade).sort(),
    'Piano tools root wrapper preserves the facade surface.'
  );
  assert.deepEqual(
    rootHarness.getState(),
    directHarness.getState(),
    'Piano tools root wrapper preserves midi-setting application side effects.'
  );
}

async function testPianoMidiRuntimeRootAssemblyPreservesMidiWorkflow() {
  const options = [];
  const dom = {
    pianoMidiInput: {
      innerHTML: 'stale',
      value: '',
      append: (option) => {
        options.push(option);
      }
    }
  };
  const midiInputA = { id: 'midi-a', name: 'Keyboard A', onmidimessage: null };
  const midiInputB = { id: 'midi-b', name: 'Keyboard B', onmidimessage: null };
  const midiAccess = {
    inputs: new Map([
      [midiInputA.id, midiInputA],
      [midiInputB.id, midiInputB]
    ]),
    onstatechange: null
  };
  let storedMidiAccess = null;
  let storedMidiAccessPromise = null;
  let currentMidiInput = null;
  let pianoMidiSettings = {
    enabled: true,
    inputId: 'midi-b',
    sustainPedalEnabled: true
  };
  let refreshedSettingsJson = 0;
  let preloadCalls = 0;
  let lastStatus = '';
  const handledMessages = [];

  const assembly = createDrillPianoMidiRuntimeRootAppAssembly({
    dom,
    runtimeState: {
      getMidiAccess: () => storedMidiAccess,
      setMidiAccess: (value) => { storedMidiAccess = value; },
      getMidiAccessPromise: () => storedMidiAccessPromise,
      setMidiAccessPromise: (value) => { storedMidiAccessPromise = value; },
      getCurrentMidiInput: () => currentMidiInput,
      setCurrentMidiInput: (value) => { currentMidiInput = value; },
      getPianoMidiSettings: () => pianoMidiSettings
    },
    runtimeHelpers: {
      normalizePianoMidiSettings: (value = {}) => ({
        enabled: Boolean(value.enabled),
        inputId: String(value.inputId ?? ''),
        sustainPedalEnabled: value.sustainPedalEnabled !== false
      }),
      setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
      refreshPianoSettingsJson: () => { refreshedSettingsJson += 1; },
      setPianoMidiStatus: (value) => { lastStatus = value; },
      handleMidiMessage: (event) => { handledMessages.push(event); },
      ensureMidiPianoRangePreload: () => { preloadCalls += 1; },
      getAudioContext: () => ({}),
      requestMIDIAccess: async () => midiAccess,
      createOptionElement: () => ({ value: '', textContent: '' })
    }
  });

  await assembly.refreshMidiInputs();

  assert.equal(
    storedMidiAccess,
    midiAccess,
    'Piano MIDI runtime root assembly preserves MIDI access acquisition.'
  );
  assert.equal(
    options.length,
    3,
    'Piano MIDI runtime root assembly preserves MIDI input option population.'
  );
  assert.equal(
    dom.pianoMidiInput.value,
    'midi-b',
    'Piano MIDI runtime root assembly preserves current MIDI input selection.'
  );
  assert.equal(
    currentMidiInput,
    midiInputB,
    'Piano MIDI runtime root assembly preserves active MIDI input attachment.'
  );
  assert.equal(
    typeof midiInputB.onmidimessage,
    'function',
    'Piano MIDI runtime root assembly preserves MIDI message handler attachment.'
  );
  assert.equal(
    lastStatus,
    'Entree: Keyboard B',
    'Piano MIDI runtime root assembly preserves active MIDI status messaging.'
  );
  assert.equal(
    refreshedSettingsJson,
    1,
    'Piano MIDI runtime root assembly preserves settings JSON refresh after repopulating inputs.'
  );
  assert.equal(
    preloadCalls,
    1,
    'Piano MIDI runtime root assembly preserves MIDI piano preload after refresh.'
  );

  midiInputB.onmidimessage({ data: [0x90, 60, 127] });
  assert.equal(
    handledMessages.length,
    1,
    'Piano MIDI runtime root assembly preserves MIDI message forwarding.'
  );

  pianoMidiSettings = { ...pianoMidiSettings, enabled: false };
  assembly.attachMidiInput();
  assert.equal(
    currentMidiInput,
    null,
    'Piano MIDI runtime root assembly preserves MIDI input detachment when MIDI is disabled.'
  );
  assert.equal(
    lastStatus,
    'MIDI inactif',
    'Piano MIDI runtime root assembly preserves disabled MIDI status messaging.'
  );
}

function testWalkingBassRootWrapper() {
  const options = {
    constants: {
      BASS_LOW: 28,
      BASS_HIGH: 48
    }
  };
  const directWalkingBassGenerator = createWalkingBassGenerator(
    createPracticeArrangementWalkingBassAppBindings(options)
  );
  const rootWalkingBassGenerator = createPracticeArrangementWalkingBassRootAppAssembly(options);
  const buildLineInput = {
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
    tempoBpm: 180,
    isMinor: false
  };
  const randomSequence = [0.12, 0.78, 0.34, 0.56, 0.91, 0.22, 0.43, 0.67];

  assert.deepEqual(
    withMockedRandom(randomSequence, () => rootWalkingBassGenerator.buildLine(buildLineInput)),
    withMockedRandom(randomSequence, () => directWalkingBassGenerator.buildLine(buildLineInput)),
    'Walking bass root wrapper preserves generated bass lines for a stable chord input.'
  );
}

function testPlaybackRuntimeHostBindingsPreserveDom() {
  const dom = {
    walkingBass: { checked: true },
    startStop: { textContent: 'Start' }
  };
  const bindings = createPracticePlaybackRuntimeHostAppBindings({
    dom,
    state: { isPlaying: false }
  });

  assert.equal(
    bindings.dom,
    dom,
    'Playback runtime host bindings preserve the grouped DOM contract needed by the transport layer.'
  );
}

function testSharedPlaybackRootContextBuildsSubcontexts() {
  const options = {
    host: { getTempo: () => 120 },
    patternUi: { getCurrentPatternMode: () => 'major' },
    normalization: { normalizePatternString: (value) => value.trim() },
    playbackSettings: { getSwingRatio: () => 2 },
    embeddedPlaybackState: { isEmbeddedMode: true },
    embeddedPlaybackRuntime: { noteFadeout: 0.1 },
    embeddedTransportActions: {},
    directPlaybackRuntime: { getAudioContext: () => null },
    directPlaybackState: { getIsPlaying: () => false },
    directTransportActions: { startPlayback: () => 'started' }
  };
  const rootContext = createPracticePlaybackRootAppContext(options);

  assert.deepEqual(
    rootContext.host,
    createPracticePlaybackHostAppContext(options.host),
    'Shared playback root app context preserves host sub-context construction.'
  );
  assert.deepEqual(
    rootContext.patternUi,
    createPracticePlaybackPatternUiAppContext(options.patternUi),
    'Shared playback root app context preserves pattern UI sub-context construction.'
  );
  assert.deepEqual(
    rootContext.normalization,
    createPracticePlaybackNormalizationAppContext(options.normalization),
    'Shared playback root app context preserves normalization sub-context construction.'
  );
  assert.deepEqual(
    rootContext.playbackSettings,
    createPracticePlaybackSettingsAppContext(options.playbackSettings),
    'Shared playback root app context preserves playback-settings sub-context construction.'
  );
  assert.deepEqual(
    rootContext.embeddedPlaybackState,
    createPracticePlaybackEmbeddedStateAppContext(options.embeddedPlaybackState),
    'Shared playback root app context preserves embedded-state sub-context construction.'
  );
  assert.deepEqual(
    rootContext.embeddedPlaybackRuntime,
    createPracticePlaybackEmbeddedRuntimeAppContext(options.embeddedPlaybackRuntime),
    'Shared playback root app context preserves embedded-runtime sub-context construction.'
  );
  assert.deepEqual(
    rootContext.directPlaybackState,
    createPracticePlaybackDirectStateAppContext(options.directPlaybackState),
    'Shared playback root app context preserves direct-state sub-context construction.'
  );
  assert.deepEqual(
    rootContext.directTransportActions,
    createPracticePlaybackDirectTransportAppContext(options.directTransportActions),
    'Shared playback root app context preserves direct-transport sub-context construction.'
  );
  assert.equal(
    typeof rootContext.directPlaybackRuntime.getAudioContext,
    'function',
    'Shared playback root app context preserves the direct-runtime surface.'
  );
}

function testSharedPlaybackRootSubcontextsPreserveGlue() {
  let suppressPatternSelectChange = false;
  let lastPatternSelectValue = '';
  const rootContext = createPracticePlaybackRootAppContext({
    host: {
      dom: { tempoSlider: { value: '132' } },
      state: {
        getLastPatternSelectValue: () => lastPatternSelectValue,
        setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
        getIsPlaying: () => false,
        getIsPaused: () => true,
        getIsIntro: () => false,
        getCurrentBeat: () => 2,
        getCurrentChordIdx: () => 3,
        getPaddedChordCount: () => 8,
        getCurrentKey: () => 5,
        getAudioContext: () => ({})
      },
      constants: {
        customPatternOptionValue: '__custom__'
      },
      helpers: {
        setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
        setPatternSelectValue: () => {},
        setEditorPatternMode: () => {},
        syncPatternSelectionFromInput: () => {},
        startPlayback: () => 'start',
        stopPlayback: () => 'stop',
        togglePausePlayback: () => 'pause'
      }
    },
    patternUi: {
      helpers: {
        clearProgressionEditingState: () => 'clear',
        closeProgressionManager: () => 'close',
        syncCustomPatternUI: () => 'sync-custom',
        normalizeChordsPerBarForCurrentPattern: () => 'normalize-bars',
        applyPatternModeAvailability: () => 'pattern-mode',
        syncPatternPreview: () => 'preview',
        applyDisplayMode: () => 'display',
        applyBeatIndicatorVisibility: () => 'beat',
        applyCurrentHarmonyVisibility: () => 'harmony',
        updateKeyPickerLabels: () => 'labels',
        refreshDisplayedHarmony: () => 'refresh',
        fitHarmonyDisplay: () => 'fit',
        validateCustomPattern: () => true,
        getCurrentPatternString: () => 'II-V-I',
        getCurrentPatternMode: () => 'major'
      }
    },
    normalization: {},
    playbackSettings: {},
    embeddedPlaybackState: {},
    embeddedPlaybackRuntime: {},
    embeddedTransportActions: {},
    directPlaybackRuntime: {
      state: {
        getAudioContext: () => ({ currentTime: 1 }),
        getCurrentKey: () => 7
      },
      constants: {
        noteFadeout: 0.1
      },
      helpers: {
        ensureWalkingBassGenerator: () => 'walking',
        stopActiveChordVoices: () => 'stop-voices',
        rebuildPreparedCompingPlans: () => 'rebuild',
        buildPreparedBassPlan: () => 'bass-plan',
        preloadNearTermSamples: () => Promise.resolve('preload'),
        validateCustomPattern: () => true
      }
    },
    directPlaybackState: {},
    directTransportActions: {}
  });
  const host = rootContext.host;

  host.setSuppressPatternSelectChange(true);
  host.setLastPatternSelectValue('ii-v-i');
  assert.equal(
    host.getTempo(),
    132,
    'Shared playback host root app context preserves host tempo glue.'
  );
  assert.equal(
    suppressPatternSelectChange && host.getLastPatternSelectValue() === 'ii-v-i',
    true,
    'Shared playback host root app context preserves host state mutation glue.'
  );

  const patternUi = rootContext.patternUi;

  assert.equal(
    patternUi.getCurrentPatternString(),
    'II-V-I',
    'Shared playback pattern UI root app context preserves pattern-string glue.'
  );
  assert.equal(
    patternUi.validateCustomPattern(),
    true,
    'Shared playback pattern UI root app context preserves pattern validation glue.'
  );

  const directRuntime = rootContext.directPlaybackRuntime;

  assert.equal(
    directRuntime.noteFadeout,
    0.1,
    'Shared playback direct runtime root app context preserves direct-runtime constants.'
  );
  assert.equal(
    directRuntime.getCurrentKey(),
    7,
    'Shared playback direct runtime root app context preserves direct-runtime state glue.'
  );
}

function testDisplayRuntimeRootAssemblyPreservesHelpers() {
  let rafCalls = 0;
  const displayElement = {
    classList: {
      remove: () => {}
    }
  };
  const chordElement = {
    querySelector: () => null,
    style: {},
    textContent: 'Cmaj7',
    scrollWidth: 120,
    parentElement: { clientWidth: 200 },
    clientWidth: 200
  };
  const options = {
    harmonyDisplay: {
      keyNamesMajor: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      keyNamesMinor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
      letters: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      naturalSemitones: [0, 2, 4, 5, 7, 9, 11],
      degreeIndices: { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 },
      escapeHtml: (value) => String(value),
      renderChordSymbolHtml: (root, quality, bass) => `${root}${quality}${bass ? `/${bass}` : ''}`,
      getDisplayTranspositionSemitones: () => 0,
      isOneChordModeActive: () => false,
      isMinorMode: () => false,
      getDisplayedQuality: () => 'maj7',
      normalizeDisplayedRootName: (value) => value,
      normalizeHarmonyDisplayMode: (value) => value,
      getUseMajorTriangleSymbol: () => true,
      getUseHalfDiminishedSymbol: () => true,
      getUseDiminishedSymbol: () => true
    },
    previewTiming: {
      getChordsPerBar: () => 2,
      getSecondsPerBeat: () => 0.5,
      getNextPreviewLeadSeconds: () => 3,
      getCurrentChordIdx: () => 2,
      getCurrentBeat: () => 1,
      getChordCount: () => 8
    },
    harmonyLayout: {
      requestAnimationFrameImpl: (callback) => {
        rafCalls += 1;
        return callback();
      },
      getDisplayElement: () => displayElement,
      getChordDisplayElement: () => chordElement,
      getNextChordDisplayElement: () => chordElement,
      getBaseChordDisplaySize: () => 5,
      isCurrentHarmonyHidden: () => false
    }
  };
  const assembly = createDrillDisplayRuntimeRootAppAssembly(options);

  assert.equal(
    assembly.harmonyDisplayHelpers.keyName(0),
    'C maj',
    'Display runtime root assembly preserves harmony display helper behavior.'
  );
  assert.equal(
    assembly.previewTimingHelpers.getRemainingBeatsUntilNextProgression(),
    11,
    'Display runtime root assembly preserves preview timing helper behavior.'
  );
  assembly.harmonyLayoutHelpers.fitHarmonyDisplay();
  assert.equal(
    rafCalls,
    1,
    'Display runtime root assembly preserves harmony layout helper behavior.'
  );
}

function testDisplayRootFacadePreservesRenderGlue() {
  let summaryCalls = 0;
  let updateKeyVisualCalls = 0;
  const keyCheckboxes = {
    querySelectorAll: () => ([
      {
        querySelector: () => ({ checked: true })
      }
    ])
  };
  const dom = {
    keyCheckboxes,
    display: {
      classList: {
        remove: () => {},
        add: () => {},
        toggle: () => {}
      }
    },
    beatIndicator: { classList: { toggle: () => {} } },
    displayPlaceholder: { classList: { toggle: () => {} } },
    displayPlaceholderMessage: { textContent: '' },
    reopenWelcome: { classList: { toggle: () => {} } },
    nextHeader: {
      textContent: '',
      classList: { add: () => {}, remove: () => {} }
    },
    keyDisplay: { innerHTML: '' },
    chordDisplay: { innerHTML: '' },
    nextKeyDisplay: {
      innerHTML: '',
      classList: { add: () => {}, remove: () => {} }
    },
    nextChordDisplay: {
      innerHTML: '',
      classList: { add: () => {}, remove: () => {} }
    },
    beatDots: []
  };

  const facade = createDrillDisplayRootAppFacade({
    dom,
    state: {
      getIsPlaying: () => true,
      getIsIntro: () => false,
      getCurrentKey: () => 0,
      getNextKeyValue: () => 5,
      getCurrentChordIdx: () => 0,
      getShowBeatIndicatorEnabled: () => false,
      getCurrentHarmonyHidden: () => true,
      getDisplayMode: () => 'chords-only',
      getPaddedChords: () => [{
        semitones: 0,
        qualityMajor: 'maj7',
        qualityMinor: 'm7',
        roman: 'I'
      }],
      getNextRawChords: () => [{
        semitones: 5,
        qualityMajor: '7',
        qualityMinor: 'm7',
        roman: 'IV'
      }]
    },
    constants: {
      keyNamesMajor: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    },
    helpers: {
      transposeDisplayPitchClass: (value) => value,
      getUpdateKeyCheckboxVisualState: () => {
        return () => { updateKeyVisualCalls += 1; };
      },
      getSyncSelectedKeysSummary: () => {
        return () => { summaryCalls += 1; };
      },
      getRemainingBeatsUntilNextProgression: () => 1,
      shouldShowNextPreview: () => true,
      keyNameHtml: (value) => `<b>${value}</b>`,
      chordSymbolHtml: (_key, chord) => `<i>${chord.roman}</i>`,
      showNextCol: () => {},
      hideNextCol: () => {},
      applyDisplaySideLayout: () => {},
      fitHarmonyDisplay: () => {}
    }
  });

  assert.equal(
    facade.keyLabelForPicker(0),
    'C',
    'Display render root facade preserves key-label rendering.'
  );

  facade.updateKeyPickerLabels();
  assert.equal(
    updateKeyVisualCalls === 1 && summaryCalls === 1,
    true,
    'Display root facade preserves key-picker label refresh glue.'
  );

  facade.refreshDisplayedHarmony();
  assert.equal(
    dom.keyDisplay.innerHTML,
    '<b>0</b>',
    'Display root facade preserves current-key display refresh glue.'
  );
  facade.setDisplayPlaceholderMessage('Ready');
  assert.equal(
    dom.displayPlaceholderMessage.textContent,
    'Ready',
    'Display root facade preserves placeholder message wiring.'
  );
}

function testNormalizationRootAppContextPreservesNormalizers() {
  const context = createDrillNormalizationRootAppContext({
    constants: {
      patternModeBoth: 'both',
      patternModeMajor: 'major',
      patternModeMinor: 'minor',
      compingStyleOff: 'off',
      compingStyleStrings: 'strings',
      compingStylePiano: 'piano',
      defaultRepetitionsPerKey: 2,
      displayModeShowBoth: 'show-both',
      displayModeChordsOnly: 'chords-only',
      displayModeKeyOnly: 'key-only',
      harmonyDisplayModeDefault: 'default',
      harmonyDisplayModeRich: 'rich'
    },
    helpers: {
      normalizeChordsPerBarBase: (value) => Number.parseInt(value, 10) || 1
    }
  });

  assert.equal(
    context.normalizePatternMode('major/minor'),
    'both',
    'Normalization root context preserves pattern-mode normalization.'
  );
  assert.equal(
    context.normalizePresetName('  Autumn   Leaves  '),
    'Autumn Leaves',
    'Normalization root context preserves preset-name normalization.'
  );
  assert.equal(
    context.normalizePresetNameForInput('Autumn   Leaves'),
    'Autumn Leaves',
    'Normalization root context preserves preset-name input normalization.'
  );
  assert.equal(
    context.normalizeCompingStyle('piano-two-hand'),
    'piano',
    'Settings normalization root context preserves comping-style normalization.'
  );
  assert.equal(
    context.normalizeRepetitionsPerKey('99'),
    8,
    'Settings normalization root context preserves repetitions clamping.'
  );
  assert.equal(
    context.normalizeChordsPerBar('4'),
    4,
    'Settings normalization root context preserves chords-per-bar normalization.'
  );
  assert.equal(
    context.normalizeDisplayMode('bogus'),
    'show-both',
    'Settings normalization root context preserves display-mode fallback.'
  );
  assert.equal(
    context.normalizeHarmonyDisplayMode('bogus'),
    'default',
    'Settings normalization root context preserves harmony-display fallback.'
  );
}

async function testUiBootstrapRootAssemblyPreservesBootstrapCalls() {
  const calls = [];
  const runtimeButton = {
    addEventListener: (eventName) => calls.push(`runtime:${eventName}`)
  };
  const pianoToggle = {
    checked: false,
    addEventListener: (eventName) => calls.push(`piano:${eventName}`)
  };
  const uiBootstrap = createDrillUiBootstrapRootAppAssembly({
    screen: {
      initializeSocialShareLinks: () => calls.push('screen:social'),
      loadDefaultProgressions: async () => calls.push('screen:loadDefaultProgressions'),
      loadPatternHelp: async () => calls.push('screen:loadPatternHelp'),
      loadWelcomeStandards: async () => calls.push('screen:loadWelcomeStandards'),
      renderProgressionOptions: () => calls.push('screen:renderProgressionOptions'),
      getInitialProgressionOption: () => 'ii-v-i',
      loadSettings: () => calls.push('screen:loadSettings'),
      applySilentDefaultPresetResetMigration: () => false,
      getSavedPatternSelection: () => '',
      saveSettings: () => calls.push('screen:saveSettings'),
      buildKeyCheckboxes: () => calls.push('screen:buildKeyCheckboxes'),
      updateKeyPickerLabels: () => calls.push('screen:updateKeyPickerLabels'),
      applyDisplayMode: () => calls.push('screen:applyDisplayMode'),
      hasCustomPatternValue: () => false,
      setCustomPatternValue: () => calls.push('screen:setCustomPatternValue'),
      getSelectedProgressionPattern: () => 'ii-v-i',
      hasSelectedProgression: () => true,
      setPatternNameFromSelectedProgression: () => calls.push('screen:setPatternName'),
      setPatternNameNormalized: () => calls.push('screen:setPatternNameNormalized'),
      setEditorPatternModeFromSelectedProgression: () => calls.push('screen:setEditorPatternMode'),
      setEditorPatternModeNormalized: () => calls.push('screen:setEditorPatternModeNormalized'),
      customPatternOptionValue: '__custom__',
      applySavedPatternSelection: () => false,
      syncPatternSelectionFromInput: () => calls.push('screen:syncPatternSelection'),
      syncProgressionManagerState: () => calls.push('screen:syncProgressionManagerState'),
      syncCustomPatternUI: () => calls.push('screen:syncCustomPatternUi'),
      normalizeChordsPerBarForCurrentPattern: () => calls.push('screen:normalizeChordsPerBar'),
      applyPatternModeAvailability: () => calls.push('screen:applyPatternModeAvailability'),
      setLastPatternSelectValue: () => calls.push('screen:setLastPatternSelectValue'),
      shouldPromptForDefaultProgressionsUpdate: () => false,
      promptForUpdatedDefaultProgressions: () => calls.push('screen:promptForDefaultProgressionsUpdate'),
      hasAppliedDefaultProgressionsFingerprint: () => true,
      setAppliedDefaultProgressionsFingerprint: () => calls.push('screen:setDefaultProgressionsFingerprint'),
      getDefaultProgressionsFingerprint: () => 'fingerprint',
      ensurePageSampleWarmup: () => calls.push('screen:ensurePageSampleWarmup'),
      consumePendingPracticeSessionIntoUi: () => false,
      setWelcomeOverlayVisible: () => calls.push('screen:setWelcomeOverlayVisible'),
      maybeShowWelcomeOverlay: () => calls.push('screen:maybeShowWelcomeOverlay')
    },
    runtimeControls: {
      dom: {
        startStop: runtimeButton,
        pause: runtimeButton,
        tempoSlider: runtimeButton
      },
      onStartStopClick: () => {},
      onPauseClick: () => {},
      onTempoInput: () => {}
    },
    pianoControls: {
      dom: {
        pianoMidiEnabled: pianoToggle
      },
      applyPianoMidiSettings: () => {},
      getPianoMidiSettings: () => ({})
    },
    harmonyDisplayObservers: {
      fitHarmonyDisplay: () => calls.push('observer:fit')
    }
  });

  await uiBootstrap.initializeScreen();
  uiBootstrap.initializeRuntimeControls();
  uiBootstrap.initializePianoControls();

  assert.equal(
    typeof uiBootstrap.initializeHarmonyDisplayObservers,
    'function',
    'UI bootstrap root assembly exposes the harmony observer initializer.'
  );
  assert.equal(
    calls.includes('screen:renderProgressionOptions'),
    true,
    'UI bootstrap root assembly preserves drill screen initialization behavior.'
  );
  assert.equal(
    calls.includes('runtime:click'),
    true,
    'UI bootstrap root assembly preserves runtime controls initialization behavior.'
  );
  assert.equal(
    calls.includes('piano:change'),
    true,
    'UI bootstrap root assembly preserves piano controls initialization behavior.'
  );
}

function testProgressionRootAssemblyPreservesProgressionSurface() {
  let progressions = {
    'ii-v-i': {
      name: 'II-V-I',
      pattern: 'II-V-I',
      mode: 'major'
    }
  };
  let editingProgressionName = 'ii-v-i';
  let editingProgressionSnapshot = { pattern: 'II-V-I' };
  let progressionSelectionBeforeEditing = 'ii-v-i';
  let isCreatingProgression = true;
  let isManagingProgressions = true;
  let lastStandaloneCustomName = '';
  let lastStandaloneCustomPattern = '';
  let lastStandaloneCustomMode = 'major';
  let suppressPatternSelectChange = false;
  let keyPool = [];
  let suppressListRender = false;
  let draggedProgressionName = '';
  let pendingProgressionDeletion = null;
  let appliedDefaultProgressionsFingerprint = '';
  let acknowledgedDefaultProgressionsVersion = '';
  let shouldPromptForDefaultProgressionsUpdate = false;
  let defaultProgressionsVersion = '1';
  let defaultProgressions = { ...progressions };
  let lastPatternSelectValue = 'ii-v-i';
  let sessionActions = 0;

  const dom = {
    patternSelect: createEventTarget({ value: 'ii-v-i' }),
    customPattern: createEventTarget({ value: ' II-V-I ' }),
    patternMode: createEventTarget({ value: 'major' }),
    patternModeBoth: createEventTarget({ checked: false }),
    patternName: createEventTarget({ value: 'II-V-I' }),
    majorMinor: createEventTarget({ checked: false, disabled: false }),
    saveProgression: createEventTarget(),
    cancelProgressionEdit: createEventTarget(),
    newProgression: createEventTarget(),
    manageProgressions: createEventTarget(),
    closeProgressionManager: createEventTarget(),
    restoreDefaultProgressions: createEventTarget(),
    clearAllProgressions: createEventTarget(),
    progressionUpdateReplace: createEventTarget(),
    progressionUpdateMerge: createEventTarget(),
    progressionUpdateKeep: createEventTarget(),
    patternPicker: { classList: { toggle: () => {} } },
    patternPickerCustom: { classList: { toggle: () => {} } },
    customPatternPanel: { classList: { toggle: () => {} } },
    patternHelp: { classList: { toggle: () => {} } },
    doubleTimeRow: { classList: { toggle: () => {} } },
    patternPreviewDefaultAnchor: { parentElement: {}, insertAdjacentElement: () => {} },
    patternPreviewEditAnchor: { parentElement: {}, insertAdjacentElement: () => {} },
    patternPreviewRow: { parentElement: {} },
    patternPreview: { textContent: '' },
    patternError: { classList: { add: () => {} } },
    progressionManagerPanel: { classList: { toggle: () => {} } },
    progressionManagerList: { innerHTML: '', appendChild: () => {}, querySelectorAll: () => [] },
    progressionFeedback: {
      textContent: '',
      appendChild: () => {},
      classList: { toggle: () => {} }
    },
    progressionUpdateModal: {
      classList: { toggle: () => {} },
      setAttribute: () => {}
    },
    progressionUpdateMessage: { textContent: '' }
  };

  const assembly = createDrillProgressionRootAppAssembly({
    dom,
    editorState: {
      getProgressions: () => progressions,
      setProgressions: (value) => { progressions = value; },
      getEditingProgressionName: () => editingProgressionName,
      setEditingProgressionName: (value) => { editingProgressionName = value; },
      getEditingProgressionSnapshot: () => editingProgressionSnapshot,
      setEditingProgressionSnapshot: (value) => { editingProgressionSnapshot = value; },
      getProgressionSelectionBeforeEditing: () => progressionSelectionBeforeEditing,
      setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
      getIsCreatingProgression: () => isCreatingProgression,
      setIsCreatingProgression: (value) => { isCreatingProgression = value; },
      getIsManagingProgressions: () => isManagingProgressions,
      setIsManagingProgressions: (value) => { isManagingProgressions = value; },
      getLastStandaloneCustomName: () => lastStandaloneCustomName,
      setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
      getLastStandaloneCustomPattern: () => lastStandaloneCustomPattern,
      setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
      getLastStandaloneCustomMode: () => lastStandaloneCustomMode,
      setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; },
      getSuppressPatternSelectChange: () => suppressPatternSelectChange,
      setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
      getKeyPool: () => keyPool,
      setKeyPool: (value) => { keyPool = value; }
    },
    editorConstants: {
      CUSTOM_PATTERN_OPTION_VALUE: '__custom__',
      PATTERN_MODE_BOTH: 'both',
      PATTERN_MODE_MAJOR: 'major',
      PATTERN_MODE_MINOR: 'minor',
      ONE_CHORD_DEFAULT_QUALITIES: ['maj7'],
      ONE_CHORD_DOMINANT_QUALITIES: ['7']
    },
    editorHelpers: {
      analyzePattern: () => ({ chords: [], usesBarLines: false }),
      chordSymbol: () => 'Cmaj7',
      getDisplayTranspositionSemitones: () => 0,
      getSelectedChordsPerBar: () => 2,
      isOneChordModeActive: () => false,
      matchesOneChordQualitySet: () => false,
      normalizePatternMode: (value = 'major') => value || 'major',
      normalizePatternString: (value = '') => String(value).trim(),
      normalizePresetName: (value = '') => String(value).trim(),
      parseOneChordSpec: () => ({ active: false }),
      refreshDisplayedHarmony: () => {},
      updateKeyPickerLabels: () => {}
    },
    managerState: {
      getProgressions: () => progressions,
      setProgressions: (value) => { progressions = value; },
      getIsManagingProgressions: () => isManagingProgressions,
      setIsManagingProgressions: (value) => { isManagingProgressions = value; },
      getSuppressListRender: () => suppressListRender,
      setSuppressListRender: (value) => { suppressListRender = value; },
      getDraggedProgressionName: () => draggedProgressionName,
      setDraggedProgressionName: (value) => { draggedProgressionName = value; },
      getPendingProgressionDeletion: () => pendingProgressionDeletion,
      setPendingProgressionDeletion: (value) => { pendingProgressionDeletion = value; },
      getEditingProgressionName: () => editingProgressionName,
      setEditingProgressionName: (value) => { editingProgressionName = value; },
      getEditingProgressionSnapshot: () => editingProgressionSnapshot,
      setEditingProgressionSnapshot: (value) => { editingProgressionSnapshot = value; },
      getProgressionSelectionBeforeEditing: () => progressionSelectionBeforeEditing,
      setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
      getIsCreatingProgression: () => isCreatingProgression,
      setIsCreatingProgression: (value) => { isCreatingProgression = value; },
      getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
      setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
      getAcknowledgedDefaultProgressionsVersion: () => acknowledgedDefaultProgressionsVersion,
      setAcknowledgedDefaultProgressionsVersion: (value) => { acknowledgedDefaultProgressionsVersion = value; },
      getShouldPromptForDefaultProgressionsUpdate: () => shouldPromptForDefaultProgressionsUpdate,
      setShouldPromptForDefaultProgressionsUpdate: (value) => { shouldPromptForDefaultProgressionsUpdate = value; },
      getDefaultProgressionsVersion: () => defaultProgressionsVersion,
      setDefaultProgressionsVersion: (value) => { defaultProgressionsVersion = value; },
      getDefaultProgressions: () => defaultProgressions,
      setDefaultProgressions: (value) => { defaultProgressions = value; },
      getLastStandaloneCustomName: () => lastStandaloneCustomName,
      setLastStandaloneCustomName: (value) => { lastStandaloneCustomName = value; },
      getLastStandaloneCustomPattern: () => lastStandaloneCustomPattern,
      setLastStandaloneCustomPattern: (value) => { lastStandaloneCustomPattern = value; },
      getLastStandaloneCustomMode: () => lastStandaloneCustomMode,
      setLastStandaloneCustomMode: (value) => { lastStandaloneCustomMode = value; },
      getLastPatternSelectValue: () => lastPatternSelectValue,
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; }
    },
    managerConstants: {
      CUSTOM_PATTERN_OPTION_VALUE: '__custom__'
    },
    managerHelpers: {
      createProgressionEntry: (pattern, mode, name) => ({ pattern, mode, name }),
      getDefaultProgressionsFingerprint: () => 'fingerprint',
      normalizePatternMode: (value = 'major') => value || 'major',
      normalizePatternString: (value = '') => String(value).trim(),
      normalizeProgressionEntry: (name, entry) => ({ name: entry.name || name, pattern: entry.pattern, mode: entry.mode }),
      normalizeProgressionsMap: (value = {}) => ({ ...value }),
      saveSettings: () => {},
      trackEvent: () => {},
      trackProgressionEvent: () => {},
      validateCustomPattern: () => true
    },
    controlsState: {
      getSuppressPatternSelectChange: () => suppressPatternSelectChange,
      setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
      getLastPatternSelectValue: () => lastPatternSelectValue,
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
      getKeyPool: () => keyPool,
      setKeyPool: (value) => { keyPool = value; }
    },
    controlsConstants: {
      PATTERN_MODE_BOTH: 'both',
      PATTERN_MODE_MAJOR: 'major',
      PATTERN_MODE_MINOR: 'minor'
    },
    controlsHelpers: {
      clearOneChordCycleState: () => {},
      ensureSessionStarted: () => {},
      getProgressionAnalyticsProps: () => ({ progression_mode: 'major', progression_kind: 'preset' }),
      isOneChordModeActive: () => false,
      normalizePatternString: (value = '') => String(value).trim(),
      normalizePresetName: (value = '') => String(value).trim(),
      normalizePresetNameForInput: (value = '') => String(value).trim(),
      refreshDisplayedHarmony: () => {},
      registerSessionAction: () => { sessionActions += 1; },
      stopPlaybackIfRunning: () => {},
      toAnalyticsToken: (value = '') => String(value).toLowerCase(),
      trackEvent: () => {},
      trackProgressionEvent: () => {},
      updateKeyPickerLabels: () => {},
      validateCustomPattern: () => true
    },
    domainState: {
      getDefaultProgressions: () => defaultProgressions
    },
    domainConstants: {
      defaultPatternMode: 'major'
    },
    domainHelpers: {
      createProgressionEntryBase,
      normalizeProgressionEntryBase,
      normalizeProgressionsMapBase,
      parseDefaultProgressionsTextBase,
      isModeToken: isProgressionModeToken,
      normalizePatternMode: (value = 'major') => value === 'major/minor' ? 'both' : value,
      normalizePatternString: (value = '') => String(value).trim(),
      normalizePresetName: (value = '') => String(value).trim()
    }
  });

  assert.equal(
    typeof assembly.saveCurrentProgression,
    'function',
    'Progression root assembly preserves the progression-manager surface.'
  );
  assert.equal(
    typeof assembly.getCurrentPatternString,
    'function',
    'Progression root assembly preserves the progression-editor surface.'
  );
  assert.equal(
    dom.patternSelect.hasListener('change'),
    true,
    'Progression root assembly preserves pattern-selection control binding.'
  );
  assert.equal(
    dom.customPattern.hasListener('input'),
    true,
    'Progression root assembly preserves custom-pattern control binding.'
  );

  assembly.clearProgressionEditingState();
  assembly.closeProgressionManager();

  assert.equal(
    editingProgressionName,
    '',
    'Progression root assembly preserves live editor-state mutation through root bindings.'
  );
  assert.equal(
    editingProgressionSnapshot,
    null,
    'Progression root assembly clears the progression editing snapshot through the live state proxy.'
  );
  assert.equal(
    progressionSelectionBeforeEditing,
    '',
    'Progression root assembly clears the pre-edit progression selection through the live state proxy.'
  );
  assert.equal(
    isCreatingProgression,
    false,
    'Progression root assembly clears progression-creation state through the live state proxy.'
  );
  assert.equal(
    isManagingProgressions,
    false,
    'Progression root assembly preserves progression-manager visibility control through the live state proxy.'
  );
  assert.equal(
    assembly.getCurrentPatternString(),
    'II-V-I',
    'Progression root assembly preserves normalized current-pattern resolution.'
  );

  const parsed = assembly.parseDefaultProgressionsText([
    '# progressions-version: 2',
    'Autumn Leaves|minor|ii | V | I'
  ].join('\n'));
  assert.equal(
    parsed.version,
    '2',
    'Progression root assembly preserves default-catalog version parsing.'
  );
  assert.equal(
    Object.values(parsed.progressions)[0]?.mode,
    'minor',
    'Progression root assembly preserves default-catalog entry parsing.'
  );

  const normalized = assembly.normalizeProgressionsMap({
    custom: {
      name: 'Custom',
      pattern: 'I | IV | V',
      mode: 'major'
    }
  });
  assert.equal(
    typeof normalized.custom?.pattern,
    'string',
    'Progression root assembly preserves progression-map normalization.'
  );
  assert.equal(
    typeof assembly.getDefaultProgressionsFingerprint(defaultProgressions),
    'string',
    'Progression root assembly preserves fingerprint generation.'
  );
}

async function testUiEventBindingsRootAssemblyPreservesEventWiring() {
  const calls = [];
  const originalDocument = globalThis.document;
  const analyticsLink = createEventTarget();
  const welcomeGoal = createEventTarget({ value: 'practice' });
  const welcomeProgression = createEventTarget({ value: 'ii-v-i-major' });
  const welcomeOneChord = createEventTarget({ value: 'maj7' });
  const welcomeInstrument = createEventTarget({ value: '0' });
  const lifecycleTarget = createEventTarget();
  const visibilityTarget = createEventTarget({ hidden: false });
  const userGestureTarget = createEventTarget();
  let focusCalls = 0;
  let selectCalls = 0;
  let pianoFadeSettings = { timeConstantLow: 0.2, timeConstantHigh: 0.1 };
  let pianoMidiSettings = { enabled: true, inputId: 'midi-a', sustainPedalEnabled: false };
  let audioContext = { state: 'suspended' };
  let refreshMidiCalls = 0;
  let stopVoicesCalls = 0;
  let syncUiCalls = 0;
  let attachMidiCalls = 0;
  let clipboardText = '';
  let pianoStatusMessage = '';
  let alertMessage = '';
  const dom = {
    tempoSlider: createEventTarget({ value: '140' }),
    repetitionsPerKey: createEventTarget(),
    patternSelect: createEventTarget(),
    patternName: createEventTarget(),
    customPattern: createEventTarget(),
    patternMode: createEventTarget(),
    patternModeBoth: createEventTarget({ checked: false }),
    chordsPerBar: createEventTarget({ value: '2' }),
    doubleTimeToggle: createEventTarget({ checked: true }),
    majorMinor: createEventTarget(),
    compingStyle: createEventTarget({ value: 'rootless' }),
    walkingBass: createEventTarget(),
    stringsVolume: createEventTarget(),
    drumsSelect: createEventTarget({ value: 'ride' }),
    debugToggle: createEventTarget({ checked: true }),
    resetSettings: createEventTarget(),
    welcomeStandardSelect: createEventTarget({ value: 'autumn-leaves' }),
    welcomeShowNextTime: createEventTarget(),
    welcomeApply: createEventTarget(),
    welcomeSkip: createEventTarget(),
    reopenWelcome: createEventTarget(),
    pianoSettingsCopy: createEventTarget(),
    pianoSettingsApply: createEventTarget(),
    pianoSettingsReset: createEventTarget(),
    pianoSettingsJson: {
      value: '{"preset":true}',
      focus: () => { focusCalls += 1; },
      select: () => { selectCalls += 1; }
    }
  };
  let settingsSaved = 0;
  let walkingBassEnsured = 0;
  let lifecycleCalls = 0;
  let lifecycleToggleCalls = 0;
  let lifecycleResumeCalls = 0;
  let lifecycleIsPlaying = true;
  let lifecycleIsPaused = false;
  let analyticsDebugEnabled = false;

  globalThis.document = {
    querySelectorAll: (selector) => {
      if (selector === 'input[name="welcome-goal"]') return [welcomeGoal];
      if (selector === 'input[name="welcome-progression"]') return [welcomeProgression];
      if (selector === 'input[name="welcome-one-chord"]') return [welcomeOneChord];
      if (selector === 'input[name="welcome-instrument"]') return [welcomeInstrument];
      return [];
    }
  };

  try {
    const assembly = createDrillUiEventBindingsRootAppAssembly({
      welcomeControls: {
        updateWelcomePanelVisibility: () => calls.push('welcome:updatePanel'),
        updateWelcomeSummary: () => calls.push('welcome:updateSummary'),
        trackEvent: (name) => calls.push(`track:${name}`),
        syncWelcomeShowNextTimePreference: () => calls.push('welcome:syncNextTime'),
        saveSettings: () => { settingsSaved += 1; },
        applyWelcomeRecommendation: () => calls.push('welcome:apply'),
        skipWelcomeOverlay: () => calls.push('welcome:skip'),
        setWelcomeOverlayVisible: (value) => calls.push(`welcome:visible:${value}`),
        welcomeStandardSelect: dom.welcomeStandardSelect,
        welcomeShowNextTime: dom.welcomeShowNextTime,
        welcomeApply: dom.welcomeApply,
        welcomeSkip: dom.welcomeSkip,
        reopenWelcome: dom.reopenWelcome
      },
      analyticsLink: {
        element: analyticsLink,
        trackEvent: (name) => calls.push(`analytics:${name}`)
      },
      settingsControls: {
        dom,
        saveSettings: () => { settingsSaved += 1; },
        stopPlaybackIfRunning: () => calls.push('settings:stopPlayback'),
        trackEvent: (name) => calls.push(`settings:${name}`),
        getTempoBucket: () => '120-149',
        getRepetitionsPerKey: () => 4,
        getSelectedChordsPerBar: () => 2,
        isPlaying: () => false,
        getAudioContext: () => null,
        noteFadeout: 0.1,
        stopActiveChordVoices: () => calls.push('settings:stopVoices'),
        rebuildPreparedCompingPlans: () => calls.push('settings:rebuildComping'),
        getCurrentKey: () => 0,
        preloadNearTermSamples: () => Promise.resolve(),
        getCompingStyle: () => 'rootless',
        isWalkingBassEnabled: () => true,
        ensureWalkingBassGenerator: async () => { walkingBassEnsured += 1; },
        buildPreparedBassPlan: () => calls.push('settings:buildBassPlan'),
        applyMixerSettings: () => calls.push('settings:applyMixer'),
        isChordsEnabled: () => false,
        setAnalyticsDebugEnabled: (value) => { analyticsDebugEnabled = value; },
        resetPlaybackSettings: () => calls.push('settings:reset')
      },
      pianoPresetControls: {
        dom,
        refreshPianoSettingsJson: () => calls.push('piano:refreshJson'),
        setPianoMidiStatus: (value) => { pianoStatusMessage = value; },
        applyPianoPresetFromJsonText: () => calls.push('piano:applyPreset'),
        getPianoMidiSettings: () => pianoMidiSettings,
        refreshMidiInputs: async () => { refreshMidiCalls += 1; },
        normalizePianoFadeSettings: (value) => ({
          timeConstantLow: Number(value.timeConstantLow),
          timeConstantHigh: Number(value.timeConstantHigh)
        }),
        normalizePianoMidiSettings: (value) => ({
          enabled: Boolean(value.enabled),
          inputId: String(value.inputId ?? ''),
          sustainPedalEnabled: value.sustainPedalEnabled !== false
        }),
        defaultPianoFadeSettings: { timeConstantLow: 0.09, timeConstantHigh: 0.05 },
        defaultPianoMidiSettings: {
          enabled: false,
          inputId: '',
          sustainPedalEnabled: true
        },
        setPianoFadeSettings: (value) => { pianoFadeSettings = value; },
        setPianoMidiSettings: (value) => { pianoMidiSettings = value; },
        stopAllMidiPianoVoices: () => { stopVoicesCalls += 1; },
        syncPianoToolsUi: () => { syncUiCalls += 1; },
        attachMidiInput: () => { attachMidiCalls += 1; },
        saveSettings: () => { settingsSaved += 1; },
        clipboard: { writeText: async (value) => { clipboardText = value; } },
        alert: (message) => { alertMessage = message; }
      },
      lifecycleControls: {
        visibilityTarget,
        userGestureTarget,
        getIsPlaying: () => lifecycleIsPlaying,
        getIsPaused: () => lifecycleIsPaused,
        getAudioContext: () => audioContext,
        resumeAudioContext: () => {
          lifecycleResumeCalls += 1;
          audioContext.state = 'running';
        },
        togglePausePlayback: () => {
          lifecycleToggleCalls += 1;
          lifecycleIsPaused = !lifecycleIsPaused;
        }
      },
      lifecycleTarget,
      trackSessionDuration: () => { lifecycleCalls += 1; }
    });

    assembly.bindAnalyticsLink();
    assembly.bindWelcomeEvents();
    assembly.bindSettingsEvents();
    assembly.bindPianoPresetEvents();
    assembly.bindLifecycleEvents();

    analyticsLink.dispatch('click');
    welcomeGoal.dispatch('change');
    dom.welcomeShowNextTime.dispatch('change');
    dom.tempoSlider.dispatch('change');
    dom.doubleTimeToggle.dispatch('change');
    dom.walkingBass.dispatch('change');
    dom.debugToggle.dispatch('change');
    dom.resetSettings.dispatch('click');
    dom.pianoSettingsCopy.dispatch('click');
    await Promise.resolve();
    dom.pianoSettingsApply.dispatch('click');
    await Promise.resolve();
    dom.pianoSettingsReset.dispatch('click');
    await Promise.resolve();
    userGestureTarget.dispatch('pointerdown');
    visibilityTarget.hidden = true;
    visibilityTarget.dispatch('visibilitychange');
    await Promise.resolve();
    visibilityTarget.hidden = false;
    visibilityTarget.dispatch('visibilitychange');
    await Promise.resolve();
    lifecycleTarget.dispatch('pagehide');
    await Promise.resolve();
    lifecycleTarget.dispatch('pageshow');
    await Promise.resolve();

    assert.equal(
      calls.includes('analytics:demo_link_clicked'),
      true,
      'UI event-bindings root assembly preserves analytics-link wiring.'
    );
    assert.equal(
      calls.includes('track:welcome_goal_changed'),
      true,
      'UI event-bindings root assembly preserves welcome-control wiring.'
    );
    assert.equal(
      calls.includes('settings:tempo_changed'),
      true,
      'UI event-bindings root assembly preserves settings analytics wiring.'
    );
    assert.equal(
      dom.chordsPerBar.value,
      '2',
      'UI event-bindings root assembly preserves double-time chord-density syncing.'
    );
    assert.equal(
      settingsSaved >= 2,
      true,
      'UI event-bindings root assembly preserves settings persistence wiring.'
    );
    assert.equal(
      walkingBassEnsured,
      1,
      'UI event-bindings root assembly preserves walking-bass warmup wiring.'
    );
    assert.equal(
      analyticsDebugEnabled,
      true,
      'UI event-bindings root assembly preserves analytics debug wiring.'
    );
    assert.equal(
      lifecycleCalls,
      1,
      'UI event-bindings root assembly preserves lifecycle session tracking wiring.'
    );
    assert.equal(
      lifecycleToggleCalls,
      0,
      'UI event-bindings root assembly preserves lifecycle wiring without forcing transport pause/resume toggles.'
    );
    assert.equal(
      lifecycleResumeCalls >= 1,
      true,
      'UI event-bindings root assembly preserves user-gesture audio resume wiring.'
    );
    assert.equal(
      clipboardText,
      '{"preset":true}',
      'UI event-bindings root assembly preserves piano preset copy wiring.'
    );
    assert.equal(
      refreshMidiCalls,
      1,
      'UI event-bindings root assembly preserves piano preset apply MIDI refresh wiring.'
    );
    assert.deepEqual(
      pianoFadeSettings,
      { timeConstantLow: 0.09, timeConstantHigh: 0.05 },
      'UI event-bindings root assembly preserves piano preset reset fade restoration.'
    );
    assert.deepEqual(
      pianoMidiSettings,
      { enabled: false, inputId: '', sustainPedalEnabled: true },
      'UI event-bindings root assembly preserves piano preset reset MIDI restoration.'
    );
    assert.equal(
      stopVoicesCalls,
      1,
      'UI event-bindings root assembly preserves piano preset reset voice shutdown wiring.'
    );
    assert.equal(
      syncUiCalls,
      1,
      'UI event-bindings root assembly preserves piano preset reset UI sync wiring.'
    );
    assert.equal(
      attachMidiCalls,
      1,
      'UI event-bindings root assembly preserves piano preset reset MIDI attach wiring.'
    );
    assert.equal(
      pianoStatusMessage,
      'Reglages piano reinitialises',
      'UI event-bindings root assembly preserves piano preset status messaging.'
    );
    assert.equal(
      alertMessage,
      '',
      'UI event-bindings root assembly avoids spurious piano preset alerts during successful flows.'
    );
    assert.equal(
      focusCalls,
      0,
      'UI event-bindings root assembly preserves clipboard-first preset copy behavior.'
    );
    assert.equal(
      selectCalls,
      0,
      'UI event-bindings root assembly avoids fallback selection when clipboard succeeds.'
    );
  } finally {
    globalThis.document = originalDocument;
  }
}

function testUiBootstrapScreenRootAppContextPreservesScreenGlue() {
  const dom = {
    customPattern: { value: '' },
    patternName: { value: '  ii-v-i  ' },
    patternMode: { value: 'minor' },
    patternSelect: { value: '' }
  };
  let appliedDefaultProgressionsFingerprint = '';
  let lastPatternSelectValue = '';
  let saveCalls = 0;
  let welcomeOverlayVisible = true;
  let afterApplyTriggered = 0;

  const uiBootstrap = createDrillUiBootstrapRootAppAssembly({
    screenDom: dom,
    screenState: {
      getProgressions: () => ({
        turnaround: { name: 'Turnaround' },
        'ii-v-i': { name: 'II-V-I' }
      }),
      getSavedPatternSelection: () => 'ii-v-i',
      getShouldPromptForDefaultProgressionsUpdate: () => false,
      getAppliedDefaultProgressionsFingerprint: () => appliedDefaultProgressionsFingerprint,
      setAppliedDefaultProgressionsFingerprint: (value) => { appliedDefaultProgressionsFingerprint = value; },
      setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; }
    },
    screenConstants: {
      customPatternOptionValue: '__custom__'
    },
    screenHelpers: {
      initializeSocialShareLinks: () => {},
      loadDefaultProgressions: async () => {},
      loadPatternHelp: async () => {},
      loadWelcomeStandards: async () => {},
      renderProgressionOptions: () => {},
      loadSettings: () => {},
      applySilentDefaultPresetResetMigration: () => false,
      getSelectedProgressionPattern: () => 'II-V-I',
      hasSelectedProgression: () => true,
      getSelectedProgressionName: () => 'II-V-I',
      normalizePresetName: (value) => value.trim().toUpperCase(),
      setEditorPatternMode: (value) => { dom.patternMode.value = value; },
      getSelectedProgressionMode: () => 'major',
      normalizePatternMode: (value) => String(value).trim(),
      saveSettings: () => { saveCalls += 1; },
      buildKeyCheckboxes: () => {},
      updateKeyPickerLabels: () => {},
      applyDisplayMode: () => {},
      syncPatternSelectionFromInput: () => {},
      syncProgressionManagerState: () => {},
      syncCustomPatternUI: () => {},
      normalizeChordsPerBarForCurrentPattern: () => {},
      applyPatternModeAvailability: () => {},
      getDefaultProgressionsFingerprint: () => 'fp-1',
      ensurePageSampleWarmup: () => {},
      consumePendingPracticeSessionIntoUi: ({ afterApply }) => {
        afterApply();
        afterApplyTriggered += 1;
        return true;
      },
      setWelcomeOverlayVisible: (value) => { welcomeOverlayVisible = value; },
      maybeShowWelcomeOverlay: () => {}
    },
    runtimeControls: { dom: {} },
    pianoControls: { dom: {} },
    harmonyDisplayObservers: {}
  });

  assert.equal(
    Object.keys({
      turnaround: { name: 'Turnaround' },
      'ii-v-i': { name: 'II-V-I' }
    })[0],
    'turnaround',
    'UI bootstrap raw screen options preserve initial progression option resolution.'
  );

  return uiBootstrap.initializeScreen().then(() => {
    assert.equal(
      dom.customPattern.value,
      'II-V-I',
      'UI bootstrap raw screen options preserve custom-pattern value wiring.'
    );
    assert.equal(
      dom.patternName.value,
      'II-V-I',
      'UI bootstrap raw screen options preserve pattern-name syncing from the selected progression.'
    );
    assert.equal(
      dom.patternMode.value,
      'major',
      'UI bootstrap raw screen options preserve editor-mode syncing from the selected progression.'
    );
    assert.equal(
      dom.patternSelect.value,
      'ii-v-i',
      'UI bootstrap raw screen options preserve saved pattern-select state.'
    );
    assert.equal(
      lastPatternSelectValue,
      'ii-v-i',
      'UI bootstrap raw screen options preserve last pattern-select snapshot wiring.'
    );
    assert.equal(
      appliedDefaultProgressionsFingerprint,
      'fp-1',
      'UI bootstrap raw screen options preserve default-progressions fingerprint state wiring.'
    );
    assert.equal(
      saveCalls,
      1,
      'UI bootstrap raw screen options preserve pending-session post-apply save wiring.'
    );
    assert.equal(
      welcomeOverlayVisible,
      false,
      'UI bootstrap raw screen options preserve pending-session welcome overlay hiding.'
    );
    assert.equal(
      afterApplyTriggered,
      1,
      'UI bootstrap raw screen options preserve pending-session afterApply execution.'
    );
  });
}

function testRuntimeControlsRootAppContextPreservesRuntimeGlue() {
  const trackedEvents = [];
  const dom = {
    startStop: createEventTarget(),
    pause: createEventTarget(),
    tempoSlider: createEventTarget({ value: '142' }),
    tempoValue: { textContent: '' },
    nextPreviewValue: createEventTarget({ value: '3.5' }),
    nextPreviewUnitToggle: createEventTarget({ checked: true }),
    selectAllKeys: createEventTarget(),
    invertKeys: createEventTarget(),
    clearAllKeys: createEventTarget(),
    saveKeyPreset: createEventTarget(),
    loadKeyPreset: createEventTarget(),
    transpositionSelect: createEventTarget({ value: '5' }),
    displayMode: createEventTarget({ value: 'key' }),
    harmonyDisplayMode: createEventTarget({ value: 'rich' }),
    useMajorTriangleSymbol: createEventTarget(),
    useHalfDiminishedSymbol: createEventTarget(),
    useDiminishedSymbol: createEventTarget(),
    showBeatIndicator: createEventTarget(),
    hideCurrentHarmony: createEventTarget(),
    masterVolume: createEventTarget({ value: '65' }),
    bassVolume: createEventTarget({ value: '55' }),
    stringsVolume: createEventTarget({ value: '45' }),
    drumsVolume: createEventTarget({ value: '35' })
  };
  let isPlaying = false;
  let nextPreviewLeadUnit = 'bars';
  let saveCalls = 0;
  let displayRefreshes = 0;
  let stopChordCalls = 0;
  let rebuildCalls = 0;
  let bassPlanCalls = 0;
  let previewCommits = 0;
  let convertPreviewCalls = 0;
  let setPreviewInputUnit = '';
  let selectAllCalls = 0;
  let invertCalls = 0;
  let displayModeCalls = 0;
  let beatIndicatorCalls = 0;
  let currentHarmonyCalls = 0;
  let fitCalls = 0;
  let mixerCalls = 0;

  const uiBootstrap = createDrillUiBootstrapRootAppAssembly({
    screen: {},
    runtimeControlsDom: dom,
    runtimeControlsState: {
      getIsPlaying: () => isPlaying,
      getAudioContext: () => ({ currentTime: 12 }),
      getCurrentKey: () => 7,
      getNextPreviewLeadUnit: () => nextPreviewLeadUnit,
      getNextPreviewInputUnit: () => 'seconds'
    },
    runtimeControlsConstants: {
      noteFadeout: 0.1,
      nextPreviewUnitBars: 'bars',
      nextPreviewUnitSeconds: 'seconds'
    },
    runtimeControlsHelpers: {
      stop: () => trackedEvents.push({ name: 'stop' }),
      start: () => trackedEvents.push({ name: 'start' }),
      togglePause: () => trackedEvents.push({ name: 'pause' }),
      syncNextPreviewControlDisplay: () => trackedEvents.push({ name: 'sync_preview_display' }),
      refreshDisplayedHarmony: () => { displayRefreshes += 1; },
      stopActiveChordVoices: () => { stopChordCalls += 1; },
      rebuildPreparedCompingPlans: () => { rebuildCalls += 1; },
      buildPreparedBassPlan: () => { bassPlanCalls += 1; },
      commitNextPreviewValueFromInput: () => { previewCommits += 1; },
      saveSettings: () => { saveCalls += 1; },
      trackEvent: (name, payload) => trackedEvents.push({ name, payload }),
      formatPreviewNumber: (value) => `fmt:${value}`,
      getNextPreviewLeadBars: () => 2,
      getNextPreviewLeadSeconds: () => 3.5,
      convertNextPreviewValueToUnit: () => { convertPreviewCalls += 1; },
      setNextPreviewInputUnit: (value) => { setPreviewInputUnit = value; },
      setAllKeysEnabled: () => { selectAllCalls += 1; },
      getEnabledKeyCount: () => 12,
      invertKeysEnabled: () => { invertCalls += 1; },
      saveCurrentKeySelectionPreset: () => trackedEvents.push({ name: 'save_key_preset' }),
      loadKeySelectionPreset: () => trackedEvents.push({ name: 'load_key_preset' }),
      updateKeyPickerLabels: () => trackedEvents.push({ name: 'update_key_picker_labels' }),
      syncPatternPreview: () => trackedEvents.push({ name: 'sync_pattern_preview' }),
      applyDisplayMode: () => { displayModeCalls += 1; },
      normalizeDisplayMode: (value) => value,
      normalizeHarmonyDisplayMode: (value) => value,
      applyBeatIndicatorVisibility: () => { beatIndicatorCalls += 1; },
      applyCurrentHarmonyVisibility: () => { currentHarmonyCalls += 1; },
      fitHarmonyDisplay: () => { fitCalls += 1; },
      applyMixerSettings: () => { mixerCalls += 1; }
    },
    pianoControls: { dom: {} },
    harmonyDisplayObservers: {}
  });

  uiBootstrap.initializeRuntimeControls();

  dom.startStop.dispatch('click');
  assert.equal(
    trackedEvents[0]?.name,
    'start',
    'UI bootstrap raw runtime options preserve start/stop glue when idle.'
  );

  isPlaying = true;
  dom.startStop.dispatch('click');
  assert.equal(
    trackedEvents[1]?.name,
    'stop',
    'UI bootstrap raw runtime options preserve start/stop glue while playing.'
  );

  dom.tempoSlider.dispatch('input');
  assert.equal(
    dom.tempoValue.textContent,
    '142',
    'UI bootstrap raw runtime options preserve tempo display syncing.'
  );
  assert.equal(
    stopChordCalls === 1 && rebuildCalls === 1 && bassPlanCalls === 1,
    true,
    'UI bootstrap raw runtime options preserve live playback rebuilds on tempo input.'
  );

  dom.nextPreviewValue.dispatch('change');
  assert.equal(
    previewCommits,
    1,
    'UI bootstrap raw runtime options preserve next-preview commit glue.'
  );
  assert.equal(
    trackedEvents.some((event) => event.name === 'next_preview_changed'),
    true,
    'UI bootstrap raw runtime options preserve next-preview analytics.'
  );

  nextPreviewLeadUnit = 'seconds';
  dom.nextPreviewUnitToggle.dispatch('change');
  assert.equal(
    convertPreviewCalls,
    1,
    'UI bootstrap raw runtime options preserve next-preview unit conversion.'
  );
  assert.equal(
    setPreviewInputUnit,
    'seconds',
    'UI bootstrap raw runtime options preserve next-preview input unit syncing.'
  );

  dom.selectAllKeys.dispatch('click');
  dom.invertKeys.dispatch('click');
  dom.clearAllKeys.dispatch('click');
  assert.equal(
    selectAllCalls === 2 && invertCalls === 1,
    true,
    'UI bootstrap raw runtime options preserve key-selection bulk actions.'
  );

  dom.transpositionSelect.dispatch('change');
  dom.displayMode.dispatch('change');
  dom.harmonyDisplayMode.dispatch('change');
  dom.useMajorTriangleSymbol.dispatch('change');
  dom.showBeatIndicator.dispatch('change');
  dom.hideCurrentHarmony.dispatch('change');
  dom.masterVolume.dispatch('input');
  dom.bassVolume.dispatch('input');
  dom.drumsVolume.dispatch('input');
  dom.masterVolume.dispatch('change');
  dom.bassVolume.dispatch('change');
  dom.stringsVolume.dispatch('change');
  dom.drumsVolume.dispatch('change');

  assert.equal(
    displayRefreshes >= 4,
    true,
    'UI bootstrap raw runtime options preserve display refresh callbacks.'
  );
  assert.equal(
    displayModeCalls,
    1,
    'UI bootstrap raw runtime options preserve display-mode application glue.'
  );
  assert.equal(
    beatIndicatorCalls,
    1,
    'UI bootstrap raw runtime options preserve beat-indicator visibility glue.'
  );
  assert.equal(
    currentHarmonyCalls === 1 && fitCalls === 1,
    true,
    'UI bootstrap raw runtime options preserve current-harmony visibility glue.'
  );
  assert.equal(
    mixerCalls,
    3,
    'UI bootstrap raw runtime options preserve mixer input callbacks.'
  );
  assert.equal(
    saveCalls >= 8,
    true,
    'UI bootstrap raw runtime options preserve settings persistence across runtime controls.'
  );
}

function testDisplayControlsRootFacadePreservesDisplayHelpers() {
  const beatIndicator = {
    classList: {
      toggle: (name, hidden) => {
        beatIndicator.hidden = name === 'hidden' ? hidden : beatIndicator.hidden;
      }
    }
  };
  const displayElement = {
    classes: new Set(),
    classList: {
      remove: (...names) => names.forEach(name => displayElement.classes.delete(name)),
      add: (name) => displayElement.classes.add(name),
      toggle: (name, enabled) => {
        if (enabled) {
          displayElement.classes.add(name);
        } else {
          displayElement.classes.delete(name);
        }
      }
    }
  };
  let sideLayoutCalls = 0;
  let fitCalls = 0;

  const facade = createDrillDisplayRootAppFacade({
    dom: {
      beatIndicator,
      display: displayElement,
      keyDisplay: { innerHTML: '' },
      chordDisplay: { innerHTML: '' },
      nextHeader: { textContent: '', classList: { add: () => {}, remove: () => {} } },
      nextKeyDisplay: { classList: { add: () => {}, remove: () => {} } },
      nextChordDisplay: { classList: { add: () => {}, remove: () => {} } },
      displayPlaceholder: { classList: { toggle: () => {} } },
      reopenWelcome: { classList: { toggle: () => {} } },
      displayPlaceholderMessage: { textContent: '' },
      beatDots: []
    },
    state: {
      getShowBeatIndicatorEnabled: () => false,
      getCurrentHarmonyHidden: () => true,
      getDisplayMode: () => 'chords-only'
    },
    helpers: {
      applyDisplaySideLayout: () => { sideLayoutCalls += 1; },
      fitHarmonyDisplay: () => { fitCalls += 1; }
    }
  });

  facade.applyBeatIndicatorVisibility();
  facade.applyCurrentHarmonyVisibility();
  facade.applyDisplayMode();

  assert.equal(
    beatIndicator.hidden,
    true,
    'Display controls root facade preserves beat-indicator visibility behavior.'
  );
  assert.equal(
    facade.isCurrentHarmonyHidden(),
    true,
    'Display controls root facade preserves current-harmony hidden-state resolution.'
  );
  assert.equal(
    displayElement.classes.has('display-hide-current'),
    true,
    'Display controls root facade preserves current-harmony visibility behavior.'
  );
  assert.equal(
    displayElement.classes.has('display-chords-only'),
    true,
    'Display controls root facade preserves display-mode application behavior.'
  );
  assert.equal(
    sideLayoutCalls,
    1,
    'Display controls root facade preserves display-side layout callbacks.'
  );
  assert.equal(
    fitCalls,
    1,
    'Display controls root facade preserves harmony-fit callbacks.'
  );
}

function testDisplayShellRootFacadePreservesUiShellHelpers() {
  const nextHeader = {
    textContent: '',
    classList: {
      remove: (name) => { if (name === 'hidden') nextHeader.hidden = false; },
      add: (name) => { if (name === 'hidden') nextHeader.hidden = true; }
    },
    hidden: true
  };
  const nextKeyDisplay = {
    classList: {
      remove: (name) => { if (name === 'hidden') nextKeyDisplay.hidden = false; },
      add: (name) => { if (name === 'hidden') nextKeyDisplay.hidden = true; }
    },
    hidden: true
  };
  const nextChordDisplay = {
    classList: {
      remove: (name) => { if (name === 'hidden') nextChordDisplay.hidden = false; },
      add: (name) => { if (name === 'hidden') nextChordDisplay.hidden = true; }
    },
    hidden: true
  };
  const displayPlaceholder = {
    classList: {
      toggle: (name, hidden) => { if (name === 'hidden') displayPlaceholder.hidden = hidden; }
    },
    hidden: true
  };
  const reopenWelcome = {
    classList: {
      toggle: (name, hidden) => { if (name === 'hidden') reopenWelcome.hidden = hidden; }
    },
    hidden: true
  };
  const displayPlaceholderMessage = { textContent: '' };
  const beatDots = Array.from({ length: 4 }, () => ({
    classes: new Set(),
    classList: {
      toggle(name, enabled) {
        if (enabled) {
          this.owner.classes.add(name);
        } else {
          this.owner.classes.delete(name);
        }
      },
      remove(...names) {
        names.forEach(name => this.owner.classes.delete(name));
      },
      owner: null
    }
  }));
  beatDots.forEach(dot => {
    dot.classList.owner = dot;
  });
  let fitCalls = 0;

  const facade = createDrillDisplayRootAppFacade({
    dom: {
      nextHeader,
      nextKeyDisplay,
      nextChordDisplay,
      displayPlaceholder,
      reopenWelcome,
      displayPlaceholderMessage,
      beatDots,
      beatIndicator: { classList: { toggle: () => {} } },
      display: { classList: { remove: () => {}, add: () => {}, toggle: () => {} } },
      keyDisplay: { innerHTML: '' },
      chordDisplay: { innerHTML: '' }
    },
    constants: {
      defaultDisplayPlaceholderMessage: 'Ready to practice'
    },
    helpers: {
      fitHarmonyDisplay: () => { fitCalls += 1; }
    }
  });

  facade.showNextCol();
  facade.setDisplayPlaceholderVisible(true);
  facade.setDisplayPlaceholderMessage();
  facade.updateBeatDots(2, false);
  facade.clearBeatDots();
  facade.hideNextCol();

  assert.equal(
    nextHeader.textContent,
    '',
    'Display shell root facade preserves next-column header toggling.'
  );
  assert.equal(
    nextHeader.hidden,
    true,
    'Display shell root facade preserves next-column visibility toggling.'
  );
  assert.equal(
    displayPlaceholder.hidden,
    false,
    'Display shell root facade preserves display-placeholder visibility toggling.'
  );
  assert.equal(
    reopenWelcome.hidden,
    false,
    'Display shell root facade preserves reopen-welcome visibility toggling.'
  );
  assert.equal(
    displayPlaceholderMessage.textContent,
    'Ready to practice',
    'Display shell root facade preserves default placeholder messaging.'
  );
  assert.equal(
    beatDots.every(dot => dot.classes.size === 0),
    true,
    'Display shell root facade preserves beat-dot clearing behavior.'
  );
  assert.equal(
    fitCalls,
    2,
    'Display shell root facade preserves harmony-fit calls on next-column toggles.'
  );
}

async function testStartupDataRootAssemblyPreservesLoaderBehavior() {
  let welcomeStandards = {};
  let patternHelpCalls = 0;
  let defaultProgressionsVersion = '';
  let defaultProgressions = {};
  let progressions = {};
  const fetchCalls = [];
  const originalDocument = globalThis.document;
  const select = {
    value: '',
    innerHTML: '',
    options: [],
    append(option) {
      this.options.push(option);
    }
  };
  const responses = new Map([
    ['welcome-url?v=1.2.3', { ok: true, text: async () => 'Autumn Leaves|major|key: C | I | IV' }],
    ['progressions-url?v=1.2.3', { ok: false, status: 404, text: async () => '' }],
    ['progressions-url', { ok: true, text: async () => 'defaults' }]
  ]);

  globalThis.document = {
    createElement: () => ({ value: '', textContent: '', selected: false })
  };

  try {
    const assembly = createDrillStartupDataRootAppAssembly({
      state: {
        setWelcomeStandards: (value) => { welcomeStandards = value; },
        setDefaultProgressionsVersion: (value) => { defaultProgressionsVersion = value; },
        setDefaultProgressions: (value) => { defaultProgressions = value; },
        setProgressions: (value) => { progressions = value; }
      },
      welcomeStandards: {
        fetchImpl: async (url) => {
          fetchCalls.push(url);
          return responses.get(url);
        },
        url: 'welcome-url',
        version: '1.2.3',
        welcomeStandardsFallback: { fallback: { title: 'Fallback' } },
        select,
        getWelcomeStandards: () => welcomeStandards,
        noteLetterToSemitone: { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 },
        patternModeMinor: 'minor',
        compingStylePiano: 'piano',
        normalizePatternMode: (value) => value === 'minor' ? 'minor' : 'major'
      },
      patternHelp: {
        loadPracticePatternHelp: async ({ dom, url, version }) => {
          patternHelpCalls += 1;
          assert.equal(dom.marker, 'pattern-help');
          assert.equal(url, 'pattern-url');
          assert.equal(version, 'help-v1');
        },
        dom: { marker: 'pattern-help' },
        url: 'pattern-url',
        version: 'help-v1'
      },
      defaultProgressions: {
        fetchImpl: async (url) => {
          fetchCalls.push(url);
          return responses.get(url);
        },
        url: 'progressions-url',
        appVersion: '1.2.3',
        parseDefaultProgressionsText: () => ({
          version: '9',
          progressions: {
            turnaround: { name: 'Turnaround', pattern: 'I-VI-II-V', mode: 'major' }
          }
        }),
        normalizeProgressionsMap: (value) => ({ ...value }),
        getDefaultProgressions: () => defaultProgressions
      }
    });

    await assembly.loadWelcomeStandards();
    await assembly.loadPatternHelp();
    await assembly.loadDefaultProgressions();

    assert.equal(
      Object.keys(welcomeStandards).length,
      1,
      'Startup data root assembly preserves welcome-standards loading behavior.'
    );
    assert.equal(
      select.options.length,
      1,
      'Startup data root assembly preserves welcome-options rendering after load.'
    );
    assert.equal(
      patternHelpCalls,
      1,
      'Startup data root assembly preserves pattern-help loading behavior.'
    );
    assert.equal(
      defaultProgressionsVersion,
      '9',
      'Startup data root assembly preserves default-progressions version loading.'
    );
    assert.deepEqual(
      progressions,
      defaultProgressions,
      'Startup data root assembly preserves normalized progressions state refresh.'
    );
    assert.deepEqual(
      fetchCalls,
      ['welcome-url?v=1.2.3', 'progressions-url?v=1.2.3', 'progressions-url'],
      'Startup data root assembly preserves versioned/fallback fetch sequencing.'
    );
  } finally {
    globalThis.document = originalDocument;
  }
}

function testWelcomeStandardsRootAssemblyPreservesParsingAndRendering() {
  const select = {
    value: '',
    innerHTML: '',
    options: [],
    append(option) {
      this.options.push(option);
    }
  };
  let welcomeStandards = {};
  const originalDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ value: '', textContent: '', selected: false })
  };

  try {
    const assembly = createDrillStartupDataRootAppAssembly({
      welcomeStandards: {
        select,
        getWelcomeStandards: () => welcomeStandards,
        noteLetterToSemitone: { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 },
        patternModeMinor: 'minor',
        compingStylePiano: 'piano',
        normalizePatternMode: (value) => value === 'minor' ? 'minor' : 'major'
      }
    });

    welcomeStandards = assembly.parseWelcomeStandardsText([
      '# Tempo: 150',
      'All The Things You Are|major|key: Ab | I | IV',
      '',
      'Blue Bossa|minor|key: C | i | iv'
    ].join('\n'));

    assert.equal(
      Object.keys(welcomeStandards).length,
      2,
      'Welcome standards root assembly preserves welcome-standards parsing.'
    );
    assert.deepEqual(
      welcomeStandards['all-the-things-you-are'].enabledKeys,
      [false, false, false, false, false, false, false, false, true, false, false, false],
      'Welcome standards root assembly preserves single-key enabled-key parsing.'
    );

    assembly.renderWelcomeStandardOptions();
    assert.equal(
      select.options.length,
      2,
      'Welcome standards root assembly preserves welcome-standard option rendering.'
    );
    assert.equal(
      select.options[0].selected,
      true,
      'Welcome standards root assembly preserves first-option default selection.'
    );
  } finally {
    globalThis.document = originalDocument;
  }
}

function testSettingsPersistenceRootAssemblyPreservesSaveLoadGlue() {
  let savedPreset = null;
  let loadedPreset = null;
  let appliedSettings = null;
  let finalized = 0;
  let savedSharedPlayback = null;
  let savedStoredSettings = null;
  const dom = {
    masterVolume: { value: '60' },
    bassVolume: { value: '90' },
    stringsVolume: { value: '80' },
    drumsVolume: { value: '70' }
  };

  const assembly = createDrillSettingsPersistenceRootAppAssembly({
    dom,
    constants: {
      defaultMixerVolumes: {
        masterVolume: 50,
        bassVolume: 100,
        stringsVolume: 100,
        drumsVolume: 100
      }
    },
    helpers: {
      saveSharedPlaybackSettings: (value) => { savedSharedPlayback = value; },
      saveStoredProgressionSettings: (value) => { savedStoredSettings = value; },
      buildSettingsSnapshot: () => ({ pattern: 'II-V-I' }),
      getCompingStyle: () => 'piano',
      getDrumsMode: () => 'swing',
      isWalkingBassEnabled: () => true,
      loadStoredProgressionSettings: () => ({ pattern: 'saved' }),
      loadStoredKeySelectionPreset: () => [true, false, true, false, true, false, true, false, true, false, true, false],
      applyLoadedSettings: (value) => { appliedSettings = value; },
      finalizeLoadedSettings: () => { finalized += 1; }
    },
    state: {
      setSavedKeySelectionPreset: (value) => { loadedPreset = value; }
    }
  });

  assembly.saveSettings();
  assert.equal(
    savedSharedPlayback?.masterVolume,
    60,
    'Settings persistence root assembly preserves shared-playback settings save glue.'
  );
  assert.deepEqual(
    savedStoredSettings,
    { pattern: 'II-V-I' },
    'Settings persistence root assembly preserves stored-settings snapshot saving.'
  );

  dom.masterVolume.value = '';
  dom.bassVolume.value = '';
  dom.stringsVolume.value = '';
  dom.drumsVolume.value = '';
  assembly.saveSettings();
  assert.deepEqual(
    {
      masterVolume: savedSharedPlayback?.masterVolume,
      bassVolume: savedSharedPlayback?.bassVolume,
      stringsVolume: savedSharedPlayback?.stringsVolume,
      drumsVolume: savedSharedPlayback?.drumsVolume
    },
    {
      masterVolume: 50,
      bassVolume: 100,
      stringsVolume: 100,
      drumsVolume: 100
    },
    'Settings persistence root assembly saves audible mixer defaults instead of converting empty slider values to zero.'
  );

  assembly.loadSettings();
  assert.deepEqual(
    appliedSettings,
    { pattern: 'saved' },
    'Settings persistence root assembly preserves stored-settings load glue.'
  );
  assert.deepEqual(
    loadedPreset,
    [true, false, true, false, true, false, true, false, true, false, true, false],
    'Settings persistence root assembly preserves saved key-preset loading.'
  );
  assert.equal(
    finalized,
    1,
    'Settings persistence root assembly preserves finalize-loaded-settings glue.'
  );
}

function testAppHoistingContractsRemainInPlace() {
  const source = readAppSource();

  const seamContracts = [
    {
      label: 'createDefaultAppSettings',
      wrapper: 'function createDefaultAppSettings(',
      assignment: 'createDefaultAppSettingsImpl = settingsCreateDefaultAppSettings;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'clearProgressionEditingState',
      wrapper: 'function clearProgressionEditingState(',
      assignment: 'clearProgressionEditingStateImpl = progressionClearProgressionEditingState;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'closeProgressionManager',
      wrapper: 'function closeProgressionManager(',
      assignment: 'closeProgressionManagerImpl = progressionCloseProgressionManager;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'setPatternSelectValue',
      wrapper: 'function setPatternSelectValue(',
      assignment: 'setPatternSelectValueImpl = progressionSetPatternSelectValue;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'getSelectedProgressionName',
      wrapper: 'function getSelectedProgressionName(',
      assignment: 'getSelectedProgressionNameImpl = progressionGetSelectedProgressionName;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'getSelectedProgressionPattern',
      wrapper: 'function getSelectedProgressionPattern(',
      assignment: 'getSelectedProgressionPatternImpl = progressionGetSelectedProgressionPattern;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'setEditorPatternMode',
      wrapper: 'function setEditorPatternMode(',
      assignment: 'setEditorPatternModeImpl = progressionSetEditorPatternMode;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'getSelectedProgressionMode',
      wrapper: 'function getSelectedProgressionMode(',
      assignment: 'getSelectedProgressionModeImpl = progressionGetSelectedProgressionMode;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'syncPatternSelectionFromInput',
      wrapper: 'function syncPatternSelectionFromInput(',
      assignment: 'syncPatternSelectionFromInputImpl = progressionSyncPatternSelectionFromInput;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'syncCustomPatternUI',
      wrapper: 'function syncCustomPatternUI(',
      assignment: 'syncCustomPatternUIImpl = progressionSyncCustomPatternUI;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'syncProgressionManagerState',
      wrapper: 'function syncProgressionManagerState(',
      assignment: 'syncProgressionManagerStateImpl = progressionSyncProgressionManagerState;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'applyPatternModeAvailability',
      wrapper: 'function applyPatternModeAvailability(',
      assignment: 'applyPatternModeAvailabilityImpl = progressionApplyPatternModeAvailability;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'syncPatternPreview',
      wrapper: 'function syncPatternPreview(',
      assignment: 'syncPatternPreviewImpl = progressionSyncPatternPreview;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'showNextCol',
      wrapper: 'function showNextCol(',
      assignment: 'showNextColImpl = displayShowNextCol;',
      consumer: 'const drillDisplay = createDrillDisplayRootAppFacade({'
    },
    {
      label: 'hideNextCol',
      wrapper: 'function hideNextCol(',
      assignment: 'hideNextColImpl = displayHideNextCol;',
      consumer: 'const drillDisplay = createDrillDisplayRootAppFacade({'
    },
    {
      label: 'applyCurrentHarmonyVisibility',
      wrapper: 'function applyCurrentHarmonyVisibility(',
      assignment: 'applyCurrentHarmonyVisibilityImpl = displayApplyCurrentHarmonyVisibility;',
      consumer: 'const drillDisplay = createDrillDisplayRootAppFacade({'
    },
    {
      label: 'start',
      wrapper: 'function start(',
      assignment: 'startImpl = playbackStart;',
      consumer: '} = createDrillWelcomeRootAppFacade({'
    },
    {
      label: 'saveSettings',
      wrapper: 'function saveSettings(',
      assignment: 'saveSettingsImpl = () => drillSettingsPersistence.saveSettings();',
      consumer: '} = createDrillKeysRootAppAssembly({'
    },
    {
      label: 'getNextPreviewLeadSeconds',
      wrapper: 'function getNextPreviewLeadSeconds(',
      assignment: 'getNextPreviewLeadSecondsImpl = nextPreviewGetNextPreviewLeadSeconds;',
      consumer: '} = createDrillDisplayRuntimeRootAppAssembly({'
    },
    {
      label: 'attachMidiInput',
      wrapper: 'function attachMidiInput(',
      assignment: 'attachMidiInputImpl = pianoMidiAttachInput;',
      consumer: '} = createDrillPianoToolsRootAppFacade({'
    }
  ];

  seamContracts.forEach(({ label, wrapper, assignment, consumer }) => {
    const wrapperIndex = getSourceIndexOrThrow(source, wrapper, `${label} wrapper`);
    const consumerIndex = getSourceIndexOrThrow(source, consumer, `${label} consumer`);
    const assignmentIndex = getSourceIndexOrThrow(source, assignment, `${label} assignment`);

    assert.ok(
      wrapperIndex >= 0,
      `${label} wrapper must stay implemented as a hoisted function in src/app.ts.`
    );
    assert.ok(
      consumerIndex < assignmentIndex,
      `${label} implementation assignment must stay after the consumer wiring it protects.`
    );
  });
}

function testTrainerConfigExportsExpectedDefaults() {
  assert.deepEqual(
    PIANO_SAMPLE_RANGE,
    { low: 45, high: 89 },
    'Trainer config preserves the shared piano sample range.'
  );
  assert.equal(
    PIANO_SETTINGS_CONFIG.defaultMidiSettings.sustainPedalEnabled,
    true,
    'Trainer config preserves default sustain-pedal enablement.'
  );
  assert.equal(
    PATTERN_MODES.both,
    'both',
    'Trainer config preserves pattern mode tokens.'
  );
  assert.equal(
    NEXT_PREVIEW_UNITS.seconds,
    'seconds',
    'Trainer config preserves next-preview units.'
  );
  assert.equal(
    DISPLAY_MODES.showBoth,
    'show-both',
    'Trainer config preserves display mode tokens.'
  );
  assert.equal(
    HARMONY_DISPLAY_MODES.rich,
    'rich',
    'Trainer config preserves harmony display mode tokens.'
  );
  assert.deepEqual(
    TRAINER_DEFAULTS.supportedChordsPerBar,
    [1, 2, 4],
    'Trainer config preserves supported chords-per-bar defaults.'
  );
  assert.equal(
    TRAINER_RESOURCE_PATHS.patternHelp,
    'progression-suffixes.txt',
    'Trainer config preserves resource path defaults.'
  );
  assert.equal(
    REVIEW_STANDARD_CONVERSIONS_URL,
    './parsing-projects/review-standard-conversions.txt',
    'Trainer config preserves the welcome standards review source URL.'
  );
  assert.equal(
    WELCOME_CONFIG.storageKeys.onboardingCompleted,
    'welcomeCompleted',
    'Trainer config preserves welcome storage keys.'
  );
  assert.equal(
    WELCOME_PROGRESSIONS['ii-v-i-major'].compingStyle,
    COMPING_STYLES.piano,
    'Trainer config preserves welcome progression presets.'
  );
  assert.equal(
    WELCOME_ONE_CHORDS.maj7.patternMode,
    PATTERN_MODES.both,
    'Trainer config preserves welcome one-chord presets.'
  );
  assert.equal(
    WELCOME_STANDARDS_FALLBACK['autumn-leaves'].patternMode,
    PATTERN_MODES.minor,
    'Trainer config preserves welcome standards fallback presets.'
  );
  assert.deepEqual(
    INSTRUMENT_RANGES.guideTone,
    { low: 49, high: 60 },
    'Trainer config preserves guide-tone range defaults.'
  );
  assert.equal(
    AUDIO_SCHEDULING.scheduleIntervalMs,
    25,
    'Trainer config preserves scheduler cadence defaults.'
  );
  assert.equal(
    AUDIO_TIMING.noteFadeOutSeconds,
    0.26,
    'Trainer config preserves shared audio timing defaults.'
  );
  assert.equal(
    AUDIO_LEVELS.chordVolumeMultiplier,
    1.35,
    'Trainer config preserves shared audio level defaults.'
  );
  assert.equal(
    DRUM_MODES.fullSwing,
    'full_swing',
    'Trainer config preserves drum mode tokens.'
  );
  assert.equal(
    AUDIO_MIXER_CONFIG.defaultMasterVolumePercent,
    '50',
    'Trainer config preserves mixer/master defaults.'
  );
  assert.equal(
    SAMPLE_LIBRARY_CONFIG.drumRideSampleUrls.length,
    13,
    'Trainer config preserves ride sample library defaults.'
  );
  assert.equal(
    PIANO_COMPING_CONFIG.durationRatio,
    0.4,
    'Trainer config preserves piano comping defaults.'
  );
  assert.equal(
    VOICING_RANDOMIZATION_CONFIG.sumSlack,
    10,
    'Trainer config preserves voicing randomization defaults.'
  );
  assert.equal(
    TRAINER_MODE_CONFIG.displayModes,
    DISPLAY_MODES,
    'Trainer config preserves grouped mode bindings.'
  );
  assert.equal(
    TRAINER_APP_CONFIG.defaults,
    TRAINER_DEFAULTS,
    'Trainer config preserves grouped app bindings.'
  );
  assert.equal(
    TRAINER_AUDIO_CONFIG.audioTiming,
    AUDIO_TIMING,
    'Trainer config preserves grouped audio bindings.'
  );
  assert.equal(
    TRAINER_PRESET_CONFIG.welcomeProgressions,
    WELCOME_PROGRESSIONS,
    'Trainer config preserves grouped preset bindings.'
  );
  assert.equal(
    ONE_TIME_MIGRATIONS.masterVolumeDefault50,
    '2026-04-master-volume-default-50',
    'Trainer config preserves one-time migration ids.'
  );
}

function testAppConfigBindingsRemainCentralized() {
  const source = readAppSource();

  const expectedBindings = [
    "const {\n  defaults: TRAINER_DEFAULTS,",
    "const {\n  patternModes: PATTERN_MODES,",
    "const {\n  oneTimeMigrations: ONE_TIME_MIGRATIONS,",
    "const DEFAULT_PROGRESSIONS_URL = TRAINER_DEFAULTS.progressionsUrl;",
    "const DRUM_MODE_OFF = DRUM_MODES.off;",
    "const DRUM_HIHAT_SAMPLE_URL = SAMPLE_LIBRARY_CONFIG.drumHiHatSampleUrl;",
    "const CHORD_ANTICIPATION = PIANO_COMPING_CONFIG.chordAnticipationSeconds;",
    "const VOICING_RANDOMIZATION_CHANCE = VOICING_RANDOMIZATION_CONFIG.randomizationChance;",
    "const PATTERN_HELP_URL = `${APP_BASE_URL}${TRAINER_RESOURCE_PATHS.patternHelp}`;"
  ];

  expectedBindings.forEach((needle) => {
    assert.notEqual(
      source.indexOf(needle),
      -1,
      `Expected src/app.ts to keep centralized config binding: ${needle}`
    );
  });

  const forbiddenInlineDefinitions = [
    "const DRUM_MODE_OFF = 'off';",
    "const DRUM_HIHAT_SAMPLE_URL = 'assets/13_heavy_hi-hat_chick.mp3';",
    "const PIANO_COMP_DURATION_RATIO = 0.4;",
    "const VOICING_RANDOMIZATION_CHANCE = 0.3;",
    "const PATTERN_HELP_URL = `${APP_BASE_URL}progression-suffixes.txt`;"
  ];

  forbiddenInlineDefinitions.forEach((needle) => {
    assert.equal(
      source.includes(needle),
      false,
      `Expected src/app.ts not to reintroduce inline config literal: ${needle}`
    );
  });
}

function testNextPreviewRootFacadePreservesPreviewControls() {
  let nextPreviewLeadUnit = 'bars';
  let nextPreviewLeadValue = 2;
  let refreshCalls = 0;
  const dom = {
    tempoSlider: { value: '120' },
    nextPreviewUnitToggle: { checked: false },
    nextPreviewValue: { value: '', step: '' },
    nextPreviewHint: { textContent: '' }
  };

  const facade = createDrillNextPreviewRootAppFacade({
    dom,
    state: {
      getNextPreviewLeadUnit: () => nextPreviewLeadUnit,
      setNextPreviewLeadUnit: (value) => { nextPreviewLeadUnit = value; },
      getNextPreviewLeadValue: () => nextPreviewLeadValue,
      setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; }
    },
    constants: {
      NEXT_PREVIEW_UNIT_BARS: 'bars',
      NEXT_PREVIEW_UNIT_SECONDS: 'seconds',
      DEFAULT_NEXT_PREVIEW_LEAD_BARS: 2
    },
    helpers: {
      getSecondsPerBeat: () => 0.5,
      refreshDisplayedHarmony: () => { refreshCalls += 1; }
    }
  });

  assert.equal(
    facade.getNextPreviewLeadSeconds(),
    4,
    'Next preview root facade preserves bars-to-seconds conversion.'
  );

  facade.syncNextPreviewControlDisplay();
  assert.equal(
    dom.nextPreviewHint.textContent,
    '4 seconds at 120 BPM',
    'Next preview root facade preserves preview hint formatting in bar mode.'
  );

  facade.convertNextPreviewValueToUnit('seconds');
  facade.setNextPreviewInputUnit('seconds');
  assert.equal(
    dom.nextPreviewUnitToggle.checked,
    true,
    'Next preview root facade preserves unit-toggle syncing.'
  );
  assert.equal(
    nextPreviewLeadUnit,
    'seconds',
    'Next preview root facade preserves unit conversion state.'
  );
  assert.equal(
    nextPreviewLeadValue,
    4,
    'Next preview root facade preserves value conversion when switching to seconds.'
  );

  dom.nextPreviewValue.value = '3.5';
  facade.commitNextPreviewValueFromInput();
  assert.equal(
    nextPreviewLeadValue,
    3.5,
    'Next preview root facade preserves input commit normalization.'
  );
  assert.equal(
    refreshCalls,
    1,
    'Next preview root facade preserves harmony refresh after committing a new preview value.'
  );
}

function testKeySelectionRootFacadePreservesKeySelectionWorkflow() {
  let enabledKeys = [true, false, true, false, true, false, true, false, true, false, true, false];
  let keyPool = ['stale'];
  let savedKeySelectionPreset = null;
  let savedPresetPayload = null;
  let settingsSaved = 0;
  const trackedEvents = [];
  const labels = Array.from({ length: 12 }, () => {
    const checkbox = { checked: false };
    const text = { innerHTML: '' };
    return {
      checkbox,
      text,
      classList: {
        toggle: () => {}
      },
      style: {},
      querySelector: (selector) => {
        if (selector === 'input[type="checkbox"]') return checkbox;
        if (selector === '.key-checkbox-text') return text;
        return null;
      }
    };
  });
  const dom = {
    selectedKeysSummary: {
      textContent: '',
      innerHTML: '',
      setAttribute: function (name, value) {
        this[name] = value;
      }
    },
    keyCheckboxes: {
      querySelectorAll: () => labels
    }
  };

  const facade = createDrillKeysRootAppAssembly({
    dom,
    state: {
      getEnabledKeys: () => enabledKeys,
      setEnabledKeys: (value) => { enabledKeys = value; },
      setKeyPool: (value) => { keyPool = value; },
      getSavedKeySelectionPreset: () => savedKeySelectionPreset,
      setSavedKeySelectionPreset: (value) => { savedKeySelectionPreset = value; }
    },
    constants: {
      PIANO_BLACK_KEY_COLUMNS: { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 },
      PIANO_WHITE_KEY_COLUMNS: { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 }
    },
    helpers: {
      getDisplayTranspositionSemitones: () => 0,
      keyLabelForPicker: (index) => `K${index}`,
      renderAccidentalTextHtml: (value) => `<span>${value}</span>`,
      saveStoredKeySelectionPreset: (value) => { savedPresetPayload = value; },
      saveSettings: () => { settingsSaved += 1; },
      trackEvent: (name, payload) => trackedEvents.push({ name, payload }),
      alert: (message) => trackedEvents.push({ name: 'alert', payload: message })
    }
  });

  facade.syncSelectedKeysSummary();
  assert.equal(
    dom.selectedKeysSummary.innerHTML,
    'Keys: <span>K0</span> &middot; <span>K2</span> &middot; <span>K4</span> &middot; <span>K6</span> &middot; <span>K8</span> &middot; <span>K10</span>',
    'Keys root assembly preserves selected-key summary rendering.'
  );

  facade.applyEnabledKeys(enabledKeys.map(() => true));
  assert.equal(
    dom.selectedKeysSummary.innerHTML,
    'Keys: All',
    'Keys root assembly preserves the compact all-keys summary when every key is enabled.'
  );

  facade.applyEnabledKeys(enabledKeys.map(() => false));
  assert.deepEqual(
    keyPool,
    [],
    'Keys root assembly preserves key-pool reset when applying enabled keys.'
  );

  facade.restoreAllKeysIfNoneSelectedOnClose();
  assert.equal(
    facade.getEnabledKeyCount(),
    12,
    'Keys root assembly preserves restoring all keys when closing an empty selection.'
  );
  assert.equal(
    settingsSaved,
    1,
    'Keys root assembly preserves settings persistence on empty-selection restore.'
  );

  facade.saveCurrentKeySelectionPreset();
  assert.deepEqual(
    savedPresetPayload,
    enabledKeys,
    'Keys root assembly preserves key-preset persistence.'
  );

  facade.applyEnabledKeys(enabledKeys.map(() => false));
  facade.loadKeySelectionPreset();
  assert.equal(
    facade.getEnabledKeyCount(),
    12,
    'Keys root assembly preserves key-preset loading.'
  );
  assert.equal(
    trackedEvents.some((event) => event.name === 'key_preset_saved'),
    true,
    'Keys root assembly preserves key-preset saved analytics.'
  );
  assert.equal(
    trackedEvents.some((event) => event.name === 'key_preset_loaded'),
    true,
    'Keys root assembly preserves key-preset loaded analytics.'
  );
}

function testKeyPickerRootAssemblyPreservesPickerControls() {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const keydownListeners = [];
  let keyPickerOpen = false;
  let selectedKeysSummaryFocusCalls = 0;
  let closeButtonFocusCalls = 0;
  let stopPlaybackCalls = 0;
  let saveSettingsCalls = 0;
  let keyPool = ['stale'];
  let enabledKeys = [true, false, true, false, true, false, true, false, true, false, true, false];
  const trackedEvents = [];
  const keyCheckboxes = {
    innerHTML: 'stale',
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
    querySelectorAll() {
      return this.children;
    }
  };
  const keyPicker = createEventTarget({ open: false });
  const keyPickerBackdrop = createEventTarget();
  const closeKeyPicker = createEventTarget({
    focus: () => { closeButtonFocusCalls += 1; }
  });
  const selectedKeysSummary = {
    focus: () => { selectedKeysSummaryFocusCalls += 1; }
  };

  globalThis.document = {
    body: {
      classList: {
        toggle: () => {}
      }
    },
    addEventListener: (eventName, handler) => {
      if (eventName === 'keydown') {
        keydownListeners.push(handler);
      }
    },
    createElement: (tagName) => {
      if (tagName === 'label') {
        const label = {
          className: '',
          children: [],
          classList: { toggle: () => {} },
          style: {},
          appendChild(child) {
            this.children.push(child);
          },
          querySelector(selector) {
            if (selector === 'input[type="checkbox"]') {
              return this.children.find((child) => child.type === 'checkbox') || null;
            }
            if (selector === '.key-checkbox-text') {
              return this.children.find((child) => child.className === 'key-checkbox-text') || null;
            }
            return null;
          }
        };
        return label;
      }
      if (tagName === 'input') {
        return createEventTarget({
          type: '',
          checked: false,
          dataset: {}
        });
      }
      if (tagName === 'span') {
        return {
          className: '',
          innerHTML: ''
        };
      }
      return {};
    }
  };
  globalThis.window = {
    requestAnimationFrame: (callback) => callback()
  };

  try {
    const assembly = createDrillKeysRootAppAssembly({
      dom: {
        keyPicker,
        keyPickerBackdrop,
        closeKeyPicker,
        selectedKeysSummary,
        keyCheckboxes
      },
      state: {
        getEnabledKeys: () => enabledKeys,
        setEnabledKeys: (value) => { enabledKeys = value; },
        setKeyPool: (value) => { keyPool = value; }
      },
      constants: {
        PIANO_BLACK_KEY_COLUMNS: { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 },
        PIANO_WHITE_KEY_COLUMNS: { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 }
      },
      helpers: {
        setKeyPickerOpen: (isOpen) => {
          keyPickerOpen = Boolean(isOpen);
          keyPicker.open = Boolean(isOpen);
        },
        stopPlaybackIfRunning: () => { stopPlaybackCalls += 1; },
        getDisplayTranspositionSemitones: () => 0,
        keyLabelForPicker: (index) => `K${index}`,
        renderAccidentalTextHtml: (value) => `<span>${value}</span>`,
        saveSettings: () => { saveSettingsCalls += 1; },
        trackEvent: (name, payload) => trackedEvents.push({ name, payload }),
        saveStoredKeySelectionPreset: () => {},
        alert: () => {}
      }
    });

    assembly.initialize();

    closeKeyPicker.dispatch('click');
    keyPickerBackdrop.dispatch('click');
    assert.equal(
      keyPickerOpen,
      false,
      'Key picker root assembly preserves key-picker close wiring.'
    );

    keyPicker.open = true;
    keyPicker.dispatch('toggle');
    assert.equal(
      stopPlaybackCalls,
      1,
      'Key picker root assembly preserves stop-playback-on-open behavior.'
    );
    assert.equal(
      closeButtonFocusCalls,
      1,
      'Key picker root assembly preserves close-button focus on open.'
    );

    keydownListeners[0]?.({ key: 'Escape' });
    assert.equal(
      selectedKeysSummaryFocusCalls,
      1,
      'Key picker root assembly preserves Escape-close focus return.'
    );

    keyPicker.open = false;
    enabledKeys = enabledKeys.map(() => false);
    keyPicker.dispatch('toggle');
    assert.equal(
      saveSettingsCalls,
      1,
      'Keys root assembly preserves empty-selection restore on close.'
    );

    assembly.buildKeyCheckboxes();
    assert.equal(
      keyCheckboxes.children.length,
      12,
      'Keys root assembly preserves checkbox construction.'
    );
    assert.equal(
      keyCheckboxes.children[0].querySelector('.key-checkbox-text').innerHTML,
      '<span>K0</span>',
      'Keys root assembly preserves summary sync and label rendering after building checkboxes.'
    );

    const firstCheckbox = keyCheckboxes.children[0].querySelector('input[type="checkbox"]');
    firstCheckbox.checked = false;
    firstCheckbox.dispatch('change');
    assert.equal(
      enabledKeys[0],
      false,
      'Keys root assembly preserves per-key toggle state updates.'
    );
    assert.deepEqual(
      keyPool,
      [],
      'Keys root assembly preserves key-pool reset after per-key toggle changes.'
    );
    assert.equal(
      saveSettingsCalls,
      2,
      'Keys root assembly preserves settings persistence after per-key toggle changes.'
    );
    assert.equal(
      trackedEvents[0]?.name,
      'key_selection_changed',
      'Keys root assembly preserves per-key toggle analytics.'
    );

    assembly.setAllKeysEnabled(true);
    assert.equal(
      enabledKeys.every(Boolean),
      true,
      'Keys root assembly preserves select-all behavior.'
    );

    assembly.invertKeysEnabled();
    assert.equal(
      enabledKeys.every((isEnabled) => !isEnabled),
      true,
      'Keys root assembly preserves invert-keys behavior.'
    );
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
}

function testWelcomeRootFacadePreservesWelcomeWorkflow() {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalHTMLElement = globalThis.HTMLElement;
  let hasCompletedWelcomeOnboarding = false;
  let shouldShowWelcomeNextTime = true;
  let suppressPatternSelectChange = false;
  let progressionSelectionBeforeEditing = '';
  let isCreatingProgression = false;
  let lastPatternSelectValue = '';
  let nextPreviewLeadValue = 0;
  let enabledKeysApplied = null;
  let welcomeOverlayFocused = false;
  const trackedEvents = [];
  const dom = {
    welcomeOverlay: {
      hidden: true,
      classList: { toggle: (name, hidden) => { if (name === 'hidden') dom.welcomeOverlay.hidden = hidden; } },
      setAttribute: () => {},
      toggleAttribute: () => {},
      contains: () => false
    },
    reopenWelcome: { focus: () => {} },
    startStop: { focus: () => {} },
    welcomeApply: { focus: () => { welcomeOverlayFocused = true; } },
    welcomeStandardSelect: { value: 'autumn-leaves' },
    welcomeGoalPanels: [
      { dataset: { welcomePanel: 'progression' }, classList: { toggle: () => {} } },
      { dataset: { welcomePanel: 'standard' }, classList: { toggle: () => {} } }
    ],
    welcomeSummary: { textContent: '' },
    welcomeShowNextTime: { checked: false },
    patternSelect: { value: 'ii-v-i' },
    patternName: { value: '' },
    customPattern: { value: '' },
    majorMinor: { checked: false },
    transpositionSelect: { value: '' },
    tempoSlider: { value: '' },
    tempoValue: { textContent: '' },
    repetitionsPerKey: { value: '' },
    chordsPerBar: { value: '' },
    compingStyle: { value: '' },
    walkingBass: { checked: false },
    drumsSelect: { value: '' },
    displayMode: { value: '' },
    showBeatIndicator: { checked: false },
    hideCurrentHarmony: { checked: false },
    masterVolume: { value: '' },
    bassVolume: { value: '' },
    stringsVolume: { value: '' },
    drumsVolume: { value: '' }
  };

  globalThis.HTMLElement = class HTMLElement {};
  globalThis.document = {
    body: {
      classList: { toggle: () => {} }
    },
    activeElement: null,
    querySelector: (selector) => {
      const mapping = {
        'input[name="welcome-goal"]:checked': { value: 'one-chord' },
        'input[name="welcome-instrument"]:checked': { value: '2' },
        'input[name="welcome-one-chord"]:checked': { value: 'maj7' },
        'input[name="welcome-progression"]:checked': { value: 'ii-v-i-major' }
      };
      return mapping[selector] || null;
    }
  };
  globalThis.window = {
    requestAnimationFrame: (callback) => callback()
  };

  try {
    const facade = createDrillWelcomeRootAppFacade({
      dom,
      state: {
        getHasCompletedWelcomeOnboarding: () => hasCompletedWelcomeOnboarding,
        setHasCompletedWelcomeOnboarding: (value) => { hasCompletedWelcomeOnboarding = value; },
        getShouldShowWelcomeNextTime: () => shouldShowWelcomeNextTime,
        setShouldShowWelcomeNextTime: (value) => { shouldShowWelcomeNextTime = value; },
        getWelcomeStandards: () => ({
          'autumn-leaves': { summary: 'Autumn Leaves setup' }
        }),
        getProgressions: () => ({ 'ii-v-i': {} }),
        setSuppressPatternSelectChange: (value) => { suppressPatternSelectChange = value; },
        setProgressionSelectionBeforeEditing: (value) => { progressionSelectionBeforeEditing = value; },
        setIsCreatingProgression: (value) => { isCreatingProgression = value; },
        setLastPatternSelectValue: (value) => { lastPatternSelectValue = value; },
        setNextPreviewLeadValue: (value) => { nextPreviewLeadValue = value; },
        getDefaultEnabledKeys: () => new Array(12).fill(true)
      },
      constants: {
        CUSTOM_PATTERN_OPTION_VALUE: '__custom__',
        DEFAULT_CHORDS_PER_BAR: 1,
        DRUM_MODE_FULL_SWING: 'swing',
        NEXT_PREVIEW_UNIT_BARS: 'bars',
        PATTERN_MODE_BOTH: 'both',
        WELCOME_GOAL_ONE_CHORD: 'one-chord',
        WELCOME_GOAL_PROGRESSION: 'progression',
        WELCOME_GOAL_STANDARD: 'standard',
        WELCOME_ONE_CHORDS: {
          maj7: { summary: 'One chord setup', instrument: '2', tempo: 110 }
        },
        WELCOME_PROGRESSIONS: {},
        WELCOME_STANDARDS_FALLBACK: {}
      },
      helpers: {
        createDefaultAppSettings: ({ goal, instrument }) => ({
          goal,
          instrument,
          enabledKeys: new Array(12).fill(true)
        }),
        normalizeRepetitionsPerKey: (value) => value ?? 2,
        normalizeChordsPerBar: (value) => value ?? 1,
        normalizeCompingStyle: (value) => value ?? 'strings',
        normalizeDisplayMode: (value) => value ?? 'both',
        clearProgressionEditingState: () => {},
        closeProgressionManager: () => {},
        setPatternSelectValue: () => {},
        getSelectedProgressionName: () => 'II-V-I',
        getSelectedProgressionPattern: () => 'II-V-I',
        setEditorPatternMode: () => {},
        getSelectedProgressionMode: () => 'major',
        syncPatternSelectionFromInput: () => {},
        syncDoubleTimeToggle: () => {},
        applyEnabledKeys: (value) => { enabledKeysApplied = value; },
        syncCustomPatternUI: () => {},
        normalizeChordsPerBarForCurrentPattern: () => {},
        syncProgressionManagerState: () => {},
        applyPatternModeAvailability: () => {},
        validateCustomPattern: () => true,
        syncPatternPreview: () => {},
        syncNextPreviewControlDisplay: () => {},
        applyDisplayMode: () => {},
        applyBeatIndicatorVisibility: () => {},
        applyCurrentHarmonyVisibility: () => {},
        applyMixerSettings: () => {},
        updateKeyPickerLabels: () => {},
        refreshDisplayedHarmony: () => {},
        saveSettings: () => {},
        start: () => {},
        trackEvent: (name) => trackedEvents.push(name),
        setNextPreviewInputUnit: () => {},
        normalizeNextPreviewLeadValue: (value) => value ?? 2
      }
    });

    facade.updateWelcomeSummary();
    assert.equal(
      dom.welcomeSummary.textContent,
      'One chord setup',
      'Welcome root facade preserves welcome-summary rendering from the selected recommendation.'
    );

    facade.applyWelcomeRecommendation();
    assert.equal(
      suppressPatternSelectChange,
      false,
      'Welcome root facade preserves suppression reset after applying a recommendation.'
    );
    assert.equal(
      nextPreviewLeadValue,
      2,
      'Welcome root facade preserves welcome next-preview application.'
    );
    assert.deepEqual(
      enabledKeysApplied,
      new Array(12).fill(true),
      'Welcome root facade preserves welcome enabled-keys application.'
    );
    assert.equal(
      lastPatternSelectValue,
      'ii-v-i',
      'Welcome root facade preserves last-pattern selection syncing.'
    );

    facade.setWelcomeOverlayVisible(true);
    assert.equal(
      welcomeOverlayFocused,
      true,
      'Welcome root facade preserves welcome overlay focus behavior.'
    );

    facade.skipWelcomeOverlay();
    assert.equal(
      hasCompletedWelcomeOnboarding,
      true,
      'Welcome root facade preserves onboarding completion tracking.'
    );
    assert.equal(
      shouldShowWelcomeNextTime,
      false,
      'Welcome root facade preserves show-next-time preference syncing.'
    );
    assert.equal(
      trackedEvents.includes('welcome_preset_applied') && trackedEvents.includes('welcome_skipped'),
      true,
      'Welcome root facade preserves welcome analytics events.'
    );
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
    globalThis.HTMLElement = originalHTMLElement;
  }
}

testCompingEngineRootWrapper();
testVoicingRuntimeRootWrapper();
testPianoToolsRootWrapper();
await testPianoMidiRuntimeRootAssemblyPreservesMidiWorkflow();
testWalkingBassRootWrapper();
testPlaybackRuntimeHostBindingsPreserveDom();
testSharedPlaybackRootContextBuildsSubcontexts();
testSharedPlaybackRootSubcontextsPreserveGlue();
testDisplayRuntimeRootAssemblyPreservesHelpers();
testDisplayRootFacadePreservesRenderGlue();
testDisplayControlsRootFacadePreservesDisplayHelpers();
testDisplayShellRootFacadePreservesUiShellHelpers();
testNormalizationRootAppContextPreservesNormalizers();
testAppHoistingContractsRemainInPlace();
testTrainerConfigExportsExpectedDefaults();
testAppConfigBindingsRemainCentralized();
await testUiBootstrapScreenRootAppContextPreservesScreenGlue();
testRuntimeControlsRootAppContextPreservesRuntimeGlue();
await testStartupDataRootAssemblyPreservesLoaderBehavior();
testWelcomeStandardsRootAssemblyPreservesParsingAndRendering();
testSettingsPersistenceRootAssemblyPreservesSaveLoadGlue();
testNextPreviewRootFacadePreservesPreviewControls();
testKeySelectionRootFacadePreservesKeySelectionWorkflow();
testKeyPickerRootAssemblyPreservesPickerControls();
testWelcomeRootFacadePreservesWelcomeWorkflow();
testProgressionRootAssemblyPreservesProgressionSurface();
await testUiEventBindingsRootAssemblyPreservesEventWiring();
await testUiBootstrapRootAssemblyPreservesBootstrapCalls();

