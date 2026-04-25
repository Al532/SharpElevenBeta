
import { createDrillDisplayRootAppFacade } from './drill-display-root-app-facade.js';
import { createDrillDirectRuntimeAppAssembly } from './drill-direct-runtime-app-assembly.js';
import { createDrillEmbeddedRuntimeAppAssembly } from './drill-embedded-runtime-app-assembly.js';
import { initializeEmbeddedPracticeRuntime } from './drill-embedded-runtime.js';
import { createDrillKeysRootAppAssembly } from './drill-keys-root-app-assembly.js';
import { createDrillNextPreviewRootAppFacade } from './drill-next-preview-root-app-facade.js';
import { createDrillPianoMidiRuntimeRootAppAssembly } from './drill-piano-midi-runtime-root-app-assembly.js';
import { createDrillPianoToolsRootAppFacade } from './drill-piano-tools-root-app-facade.js';
import { createPracticePlaybackRuntimeAppAssembly } from '../practice-playback/practice-playback-runtime-app-assembly.js';
import { createPracticePlaybackRuntimeHostRootAppAssembly } from '../practice-playback/practice-playback-runtime-host-root-app-assembly.js';
import { createDrillProgressionRootAppAssembly } from './drill-progression-root-app-assembly.js';
import { createDrillRuntimeStateRootAppAssembly } from './drill-runtime-state-root-app-assembly.js';
import { createDrillSettingsRootAppAssembly } from './drill-settings-root-app-assembly.js';
import { createDrillSettingsPersistenceRootAppAssembly } from './drill-settings-persistence-root-app-assembly.js';
import { createPracticePlaybackRootAppAssembly } from '../practice-playback/practice-playback-root-app-assembly.js';
import { createPracticePlaybackRootAppContext } from '../practice-playback/practice-playback-root-app-context.js';
import { createDrillStartupDataRootAppAssembly } from './drill-startup-data-root-app-assembly.js';
import { createDrillUiBootstrapRootAppAssembly } from './drill-ui-bootstrap-root-app-assembly.js';
import { createDrillUiEventBindingsRootAppAssembly } from './drill-ui-event-bindings-root-app-assembly.js';
import { createDrillWelcomeRootAppFacade } from './drill-welcome-root-app-facade.js';

type StateRef<T = unknown> = {
  get?: () => T;
  set?: (value: T) => void;
};

type StateRefs = Record<string, StateRef>;
type AdapterOptions = Record<string, unknown>;
type RuntimeStateRootAppAssemblyOptions = Parameters<typeof createDrillRuntimeStateRootAppAssembly>[0];
type SharedPlaybackRootAppContextOptions = Parameters<typeof createPracticePlaybackRootAppContext>[0];
type SharedPlaybackRootAppAssemblyOptions = Parameters<typeof createPracticePlaybackRootAppAssembly>[0];
type UiBootstrapRootAppAssemblyOptions = Parameters<typeof createDrillUiBootstrapRootAppAssembly>[0];
type UiEventBindingsRootAppAssemblyOptions = Parameters<typeof createDrillUiEventBindingsRootAppAssembly>[0];
type WelcomeRootAppFacadeOptions = Parameters<typeof createDrillWelcomeRootAppFacade>[0];

function createGetterName(name: string) {
  return `get${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function createSetterName(name: string) {
  return `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function createBindingsFromRefs(refs: StateRefs = {}) {
  const bindings: Record<string, (...args: unknown[]) => unknown> = {};
  for (const [name, ref] of Object.entries(refs)) {
    if (!ref || typeof ref.get !== 'function') continue;
    bindings[createGetterName(name)] = () => ref.get();
    if (typeof ref.set === 'function') {
      bindings[createSetterName(name)] = (value) => ref.set(value);
    }
  }
  return bindings;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asStateRefs(value: unknown): StateRefs {
  return value && typeof value === 'object'
    ? (value as StateRefs)
    : {};
}

function createGetter<T>(ref: StateRef<T>) {
  return typeof ref?.get === 'function' ? () => ref.get() : undefined;
}

function createSetter<T>(ref: StateRef<T>) {
  return typeof ref?.set === 'function' ? (value: T) => ref.set?.(value) : undefined;
}

export function createDrillDisplayDrillRootAppFacade({
  dom = {},
  stateRefs = {},
  state = {},
  constants = {},
  helpers = {}
}: AdapterOptions = {}) {
  return createDrillDisplayRootAppFacade({
    dom: asRecord(dom),
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    },
    constants: asRecord(constants),
    helpers: asRecord(helpers)
  });
}

export function createDrillKeysDrillRootAppAssembly({
  dom = {},
  stateRefs = {},
  state = {},
  constants = {},
  helpers = {}
}: AdapterOptions = {}) {
  return createDrillKeysRootAppAssembly({
    dom: asRecord(dom),
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    },
    constants: asRecord(constants),
    helpers: asRecord(helpers)
  });
}

export function createDrillNextPreviewDrillRootAppFacade({
  dom = {},
  stateRefs = {},
  state = {},
  constants = {},
  helpers = {}
}: AdapterOptions = {}) {
  return createDrillNextPreviewRootAppFacade({
    dom: asRecord(dom),
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    },
    constants: asRecord(constants),
    helpers: asRecord(helpers)
  });
}

export function createDrillPianoMidiRuntimeDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  runtimeState = {},
  runtimeHelpers = {}
}: AdapterOptions = {}) {
  return createDrillPianoMidiRuntimeRootAppAssembly({
    dom: asRecord(dom),
    runtimeState: {
      ...createBindingsFromRefs(asStateRefs(runtimeStateRefs)),
      ...asRecord(runtimeState)
    },
    runtimeHelpers: asRecord(runtimeHelpers)
  });
}

export function createDrillPianoToolsDrillRootAppFacade({
  stateRefs = {},
  ...options
}: AdapterOptions = {}) {
  const typedStateRefs = asStateRefs(stateRefs);
  const typedOptions = asRecord(options);
  return createDrillPianoToolsRootAppFacade({
    ...typedOptions,
    getPianoFadeSettings: createGetter(typedStateRefs.pianoFadeSettings) || typedOptions.getPianoFadeSettings,
    setPianoFadeSettings: createSetter(typedStateRefs.pianoFadeSettings) || typedOptions.setPianoFadeSettings,
    getPianoMidiSettings: createGetter(typedStateRefs.pianoMidiSettings) || typedOptions.getPianoMidiSettings,
    setPianoMidiSettings: createSetter(typedStateRefs.pianoMidiSettings) || typedOptions.setPianoMidiSettings
  });
}

export function createPracticePlaybackRuntimeHostDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  audioStateRefs = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: AdapterOptions = {}) {
  return createPracticePlaybackRuntimeHostRootAppAssembly({
    dom: asRecord(dom),
    runtimeState: {
      ...createBindingsFromRefs(asStateRefs(runtimeStateRefs)),
      ...asRecord(runtimeState)
    },
    audioState: {
      ...createBindingsFromRefs(asStateRefs(audioStateRefs)),
      ...asRecord(audioState)
    },
    preloadState: asRecord(preloadState),
    playbackConstants: asRecord(playbackConstants),
    runtimeHelpers: asRecord(runtimeHelpers),
    createRuntimeAppAssembly: createPracticePlaybackRuntimeAppAssembly
  });
}

export function createDrillProgressionDrillRootAppAssembly({
  dom = {},
  editorStateRefs = {},
  editorState = {},
  editorConstants = {},
  editorHelpers = {},
  managerStateRefs = {},
  managerState = {},
  managerConstants = {},
  managerHelpers = {},
  controlsStateRefs = {},
  controlsState = {},
  controlsConstants = {},
  controlsHelpers = {},
  domainState = {},
  domainConstants = {},
  domainHelpers = {}
}: AdapterOptions = {}) {
  return createDrillProgressionRootAppAssembly({
    dom: asRecord(dom),
    editorState: {
      ...createBindingsFromRefs(asStateRefs(editorStateRefs)),
      ...asRecord(editorState)
    },
    editorConstants: asRecord(editorConstants),
    editorHelpers: asRecord(editorHelpers),
    managerState: {
      ...createBindingsFromRefs(asStateRefs(managerStateRefs)),
      ...asRecord(managerState)
    },
    managerConstants: asRecord(managerConstants),
    managerHelpers: asRecord(managerHelpers),
    controlsState: {
      ...createBindingsFromRefs(asStateRefs(controlsStateRefs)),
      ...asRecord(controlsState)
    },
    controlsConstants: asRecord(controlsConstants),
    controlsHelpers: asRecord(controlsHelpers),
    domainState: asRecord(domainState),
    domainConstants: asRecord(domainConstants),
    domainHelpers: asRecord(domainHelpers)
  });
}

export function createDrillRuntimeStateDrillRootAppAssembly({
  keyPoolStateRefs = {},
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsStateRefs = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
}: AdapterOptions = {}) {
  const options: RuntimeStateRootAppAssemblyOptions = {
    keyPoolState: {
      ...createBindingsFromRefs(asStateRefs(keyPoolStateRefs)),
      ...asRecord(keyPoolState)
    },
    sessionAnalyticsDom: asRecord(sessionAnalyticsDom),
    sessionAnalyticsState: {
      ...createBindingsFromRefs(asStateRefs(sessionAnalyticsStateRefs)),
      ...asRecord(sessionAnalyticsState)
    },
    sessionAnalyticsHelpers: asRecord(sessionAnalyticsHelpers),
    sessionAnalyticsConstants: asRecord(sessionAnalyticsConstants),
    sessionAnalyticsNow: typeof sessionAnalyticsNow === 'function'
      ? (() => Number(sessionAnalyticsNow()))
      : undefined
  };
  return createDrillRuntimeStateRootAppAssembly(options);
}

export function createDrillSettingsDrillRootAppAssembly({
  defaults = {},
  dom = {},
  snapshotConstants = {},
  snapshotStateRefs = {},
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierConstants = {},
  loadApplierStateRefs = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerConstants = {},
  loadFinalizerStateRefs = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterStateRefs = {},
  resetterState = {},
  resetterHelpers = {}
}: AdapterOptions = {}) {
  return createDrillSettingsRootAppAssembly({
    defaults: asRecord(defaults),
    dom: asRecord(dom),
    snapshotConstants: asRecord(snapshotConstants),
    snapshotState: {
      ...createBindingsFromRefs(asStateRefs(snapshotStateRefs)),
      ...asRecord(snapshotState)
    },
    snapshotHelpers: asRecord(snapshotHelpers),
    loadApplierConstants: asRecord(loadApplierConstants),
    loadApplierState: {
      ...createBindingsFromRefs(asStateRefs(loadApplierStateRefs)),
      ...asRecord(loadApplierState)
    },
    loadApplierHelpers: asRecord(loadApplierHelpers),
    loadFinalizerConstants: asRecord(loadFinalizerConstants),
    loadFinalizerState: {
      ...createBindingsFromRefs(asStateRefs(loadFinalizerStateRefs)),
      ...asRecord(loadFinalizerState)
    },
    loadFinalizerHelpers: asRecord(loadFinalizerHelpers),
    resetterState: {
      ...createBindingsFromRefs(asStateRefs(resetterStateRefs)),
      ...asRecord(resetterState)
    },
    resetterHelpers: asRecord(resetterHelpers)
  });
}

export function createDrillSettingsPersistenceDrillRootAppAssembly({
  dom = {},
  constants = {},
  helpers = {},
  stateRefs = {},
  state = {}
}: AdapterOptions = {}) {
  return createDrillSettingsPersistenceRootAppAssembly({
    dom: asRecord(dom),
    constants: asRecord(constants),
    helpers: asRecord(helpers),
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    }
  });
}

export function createPracticePlaybackDrillRootAppAssembly({
  dom = {},
  hostStateRefs = {},
  directPlaybackRuntimeStateRefs = {},
  directPlaybackStateRefs = {},
  ...rootBindings
}: AdapterOptions = {}) {
  const rootAppContext = createPracticePlaybackRootAppContext({
    ...rootBindings,
    host: {
      ...asRecord(rootBindings.host),
      state: {
        ...createBindingsFromRefs(asStateRefs(hostStateRefs)),
        ...asRecord(asRecord(rootBindings.host).state)
      }
    },
    directPlaybackRuntime: {
      ...asRecord(rootBindings.directPlaybackRuntime),
      state: {
        ...createBindingsFromRefs(asStateRefs(directPlaybackRuntimeStateRefs)),
        ...asRecord(asRecord(rootBindings.directPlaybackRuntime).state)
      }
    },
    directPlaybackState: {
      ...createBindingsFromRefs(asStateRefs(directPlaybackStateRefs)),
      ...asRecord(rootBindings.directPlaybackState)
    }
  } as SharedPlaybackRootAppContextOptions);

  return {
    rootAppContext,
    ...createPracticePlaybackRootAppAssembly({
      dom,
      ...rootAppContext,
      adapters: {
        createEmbeddedRuntimeAssembly: createDrillEmbeddedRuntimeAppAssembly,
        initializeEmbeddedRuntime: initializeEmbeddedPracticeRuntime,
        createDirectRuntimeAssembly: createDrillDirectRuntimeAppAssembly
      }
    } as SharedPlaybackRootAppAssemblyOptions)
  };
}

export function createDrillStartupDataDrillRootAppAssembly({
  stateRefs = {},
  state = {},
  welcomeStandards = {},
  patternHelp = {},
  defaultProgressions = {}
}: AdapterOptions = {}) {
  return createDrillStartupDataRootAppAssembly({
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    },
    welcomeStandards: asRecord(welcomeStandards),
    patternHelp: asRecord(patternHelp),
    defaultProgressions: asRecord(defaultProgressions)
  });
}

export function createDrillUiBootstrapDrillRootAppAssembly({
  screen = {},
  screenDom = {},
  screenStateRefs = {},
  screenState = {},
  screenConstants = {},
  screenHelpers = {},
  harmonyDisplayObservers = {},
  pianoControls = {},
  runtimeControls = {},
  runtimeControlsDom = {},
  runtimeControlsStateRefs = {},
  runtimeControlsState = {},
  runtimeControlsConstants = {},
  runtimeControlsHelpers = {}
}: AdapterOptions = {}) {
  return createDrillUiBootstrapRootAppAssembly({
    screen: asRecord(screen),
    screenDom: asRecord(screenDom),
    screenState: {
      ...createBindingsFromRefs(asStateRefs(screenStateRefs)),
      ...asRecord(screenState)
    },
    screenConstants: asRecord(screenConstants),
    screenHelpers: asRecord(screenHelpers),
    harmonyDisplayObservers: asRecord(harmonyDisplayObservers),
    pianoControls: asRecord(pianoControls),
    runtimeControls: asRecord(runtimeControls),
    runtimeControlsDom: asRecord(runtimeControlsDom),
    runtimeControlsState: {
      ...createBindingsFromRefs(asStateRefs(runtimeControlsStateRefs)),
      ...asRecord(runtimeControlsState)
    },
    runtimeControlsConstants: asRecord(runtimeControlsConstants),
    runtimeControlsHelpers: asRecord(runtimeControlsHelpers)
  } as UiBootstrapRootAppAssemblyOptions);
}

export function createDrillUiEventBindingsDrillRootAppAssembly({
  welcomeControls = {},
  analyticsLink = {},
  settingsControls = {},
  settingsStateRefs = {},
  pianoPresetControls = {},
  pianoPresetStateRefs = {},
  lifecycleControls = {},
  lifecycleStateRefs = {},
  lifecycleTarget = globalThis.window,
  trackSessionDuration
}: AdapterOptions = {}) {
  const typedSettingsControls = asRecord(settingsControls);
  const typedSettingsStateRefs = asStateRefs(settingsStateRefs);
  const typedPianoPresetControls = asRecord(pianoPresetControls);
  const typedPianoPresetStateRefs = asStateRefs(pianoPresetStateRefs);
  const typedLifecycleControls = asRecord(lifecycleControls);
  const typedLifecycleStateRefs = asStateRefs(lifecycleStateRefs);
  return createDrillUiEventBindingsRootAppAssembly({
    welcomeControls: asRecord(welcomeControls),
    analyticsLink: asRecord(analyticsLink),
    settingsControls: {
      ...typedSettingsControls,
      isPlaying: createGetter(typedSettingsStateRefs.isPlaying) || typedSettingsControls.isPlaying,
      getAudioContext: createGetter(typedSettingsStateRefs.audioContext) || typedSettingsControls.getAudioContext,
      getCurrentKey: createGetter(typedSettingsStateRefs.currentKey) || typedSettingsControls.getCurrentKey
    },
    pianoPresetControls: {
      ...typedPianoPresetControls,
      getPianoMidiSettings: createGetter(typedPianoPresetStateRefs.pianoMidiSettings) || typedPianoPresetControls.getPianoMidiSettings,
      setPianoFadeSettings: createSetter(typedPianoPresetStateRefs.pianoFadeSettings) || typedPianoPresetControls.setPianoFadeSettings,
      setPianoMidiSettings: createSetter(typedPianoPresetStateRefs.pianoMidiSettings) || typedPianoPresetControls.setPianoMidiSettings
    },
    lifecycleControls: {
      ...typedLifecycleControls,
      getIsPlaying: createGetter(typedLifecycleStateRefs.isPlaying) || typedLifecycleControls.getIsPlaying,
      getIsPaused: createGetter(typedLifecycleStateRefs.isPaused) || typedLifecycleControls.getIsPaused,
      getAudioContext: createGetter(typedLifecycleStateRefs.audioContext) || typedLifecycleControls.getAudioContext
    },
    lifecycleTarget,
    trackSessionDuration
  } as UiEventBindingsRootAppAssemblyOptions);
}

export function createDrillWelcomeDrillRootAppFacade({
  dom = {},
  stateRefs = {},
  state = {},
  constants = {},
  helpers = {}
}: AdapterOptions = {}) {
  return createDrillWelcomeRootAppFacade({
    dom: asRecord(dom),
    state: {
      ...createBindingsFromRefs(asStateRefs(stateRefs)),
      ...asRecord(state)
    },
    constants: asRecord(constants),
    helpers: asRecord(helpers)
  } as WelcomeRootAppFacadeOptions);
}


