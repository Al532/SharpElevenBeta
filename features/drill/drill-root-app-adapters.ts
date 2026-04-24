
import { createDrillDisplayRootAppFacade } from './drill-display-root-app-facade.js';
import { createDrillKeysRootAppAssembly } from './drill-keys-root-app-assembly.js';
import { createDrillNextPreviewRootAppFacade } from './drill-next-preview-root-app-facade.js';
import { createDrillPianoMidiRuntimeRootAppAssembly } from './drill-piano-midi-runtime-root-app-assembly.js';
import { createDrillPianoToolsRootAppFacade } from './drill-piano-tools-root-app-facade.js';
import { createDrillPlaybackRuntimeHostRootAppAssembly } from './drill-playback-runtime-host-root-app-assembly.js';
import { createDrillProgressionRootAppAssembly } from './drill-progression-root-app-assembly.js';
import { createDrillRuntimeStateRootAppAssembly } from './drill-runtime-state-root-app-assembly.js';
import { createDrillSettingsRootAppAssembly } from './drill-settings-root-app-assembly.js';
import { createDrillSettingsPersistenceRootAppAssembly } from './drill-settings-persistence-root-app-assembly.js';
import { createDrillSharedPlaybackRootAppAssembly } from './drill-shared-playback-root-app-assembly.js';
import { createDrillSharedPlaybackRootAppContext } from './drill-shared-playback-root-app-context.js';
import { createDrillStartupDataRootAppAssembly } from './drill-startup-data-root-app-assembly.js';
import { createDrillUiBootstrapRootAppAssembly } from './drill-ui-bootstrap-root-app-assembly.js';
import { createDrillUiEventBindingsRootAppAssembly } from './drill-ui-event-bindings-root-app-assembly.js';
import { createDrillWelcomeRootAppFacade } from './drill-welcome-root-app-facade.js';

type StateRef<T = unknown> = {
  get?: () => T;
  set?: (value: T) => void;
};

type StateRefs = Record<string, StateRef>;
type AdapterOptions = Record<string, any>;

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
    dom,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    constants,
    helpers
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
    dom,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    constants,
    helpers
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
    dom,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    constants,
    helpers
  });
}

export function createDrillPianoMidiRuntimeDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  runtimeState = {},
  runtimeHelpers = {}
}: AdapterOptions = {}) {
  return createDrillPianoMidiRuntimeRootAppAssembly({
    dom,
    runtimeState: {
      ...createBindingsFromRefs(runtimeStateRefs),
      ...runtimeState
    },
    runtimeHelpers
  });
}

export function createDrillPianoToolsDrillRootAppFacade({
  stateRefs = {},
  ...options
}: AdapterOptions = {}) {
  return createDrillPianoToolsRootAppFacade({
    ...options,
    getPianoFadeSettings: createGetter(stateRefs.pianoFadeSettings) || options.getPianoFadeSettings,
    setPianoFadeSettings: createSetter(stateRefs.pianoFadeSettings) || options.setPianoFadeSettings,
    getPianoMidiSettings: createGetter(stateRefs.pianoMidiSettings) || options.getPianoMidiSettings,
    setPianoMidiSettings: createSetter(stateRefs.pianoMidiSettings) || options.setPianoMidiSettings
  });
}

export function createDrillPlaybackRuntimeHostDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  audioStateRefs = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
}: AdapterOptions = {}) {
  return createDrillPlaybackRuntimeHostRootAppAssembly({
    dom,
    runtimeState: {
      ...createBindingsFromRefs(runtimeStateRefs),
      ...runtimeState
    },
    audioState: {
      ...createBindingsFromRefs(audioStateRefs),
      ...audioState
    },
    preloadState,
    playbackConstants,
    runtimeHelpers
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
    dom,
    editorState: {
      ...createBindingsFromRefs(editorStateRefs),
      ...editorState
    },
    editorConstants,
    editorHelpers,
    managerState: {
      ...createBindingsFromRefs(managerStateRefs),
      ...managerState
    },
    managerConstants,
    managerHelpers,
    controlsState: {
      ...createBindingsFromRefs(controlsStateRefs),
      ...controlsState
    },
    controlsConstants,
    controlsHelpers,
    domainState,
    domainConstants,
    domainHelpers
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
  return createDrillRuntimeStateRootAppAssembly({
    keyPoolState: {
      ...createBindingsFromRefs(keyPoolStateRefs),
      ...keyPoolState
    },
    sessionAnalyticsDom,
    sessionAnalyticsState: {
      ...createBindingsFromRefs(sessionAnalyticsStateRefs),
      ...sessionAnalyticsState
    },
    sessionAnalyticsHelpers,
    sessionAnalyticsConstants,
    sessionAnalyticsNow
  } as any);
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
    defaults,
    dom,
    snapshotConstants,
    snapshotState: {
      ...createBindingsFromRefs(snapshotStateRefs),
      ...snapshotState
    },
    snapshotHelpers,
    loadApplierConstants,
    loadApplierState: {
      ...createBindingsFromRefs(loadApplierStateRefs),
      ...loadApplierState
    },
    loadApplierHelpers,
    loadFinalizerConstants,
    loadFinalizerState: {
      ...createBindingsFromRefs(loadFinalizerStateRefs),
      ...loadFinalizerState
    },
    loadFinalizerHelpers,
    resetterState: {
      ...createBindingsFromRefs(resetterStateRefs),
      ...resetterState
    },
    resetterHelpers
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
    dom,
    constants,
    helpers,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    }
  });
}

export function createDrillSharedPlaybackDrillRootAppAssembly({
  dom = {},
  hostStateRefs = {},
  directPlaybackRuntimeStateRefs = {},
  directPlaybackStateRefs = {},
  ...rootBindings
}: AdapterOptions = {}) {
  const rootAppContext = createDrillSharedPlaybackRootAppContext({
    ...rootBindings,
    host: {
      ...(rootBindings.host || {}),
      state: {
        ...createBindingsFromRefs(hostStateRefs),
        ...(rootBindings.host?.state || {})
      }
    },
    directPlaybackRuntime: {
      ...(rootBindings.directPlaybackRuntime || {}),
      state: {
        ...createBindingsFromRefs(directPlaybackRuntimeStateRefs),
        ...(rootBindings.directPlaybackRuntime?.state || {})
      }
    },
    directPlaybackState: {
      ...createBindingsFromRefs(directPlaybackStateRefs),
      ...(rootBindings.directPlaybackState || {})
    }
  } as any);

  return {
    rootAppContext,
    ...createDrillSharedPlaybackRootAppAssembly({
      dom,
      ...rootAppContext
    } as any)
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
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    welcomeStandards,
    patternHelp,
    defaultProgressions
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
    screen,
    screenDom,
    screenState: {
      ...createBindingsFromRefs(screenStateRefs),
      ...screenState
    },
    screenConstants,
    screenHelpers,
    harmonyDisplayObservers,
    pianoControls,
    runtimeControls,
    runtimeControlsDom,
    runtimeControlsState: {
      ...createBindingsFromRefs(runtimeControlsStateRefs),
      ...runtimeControlsState
    },
    runtimeControlsConstants,
    runtimeControlsHelpers
  } as any);
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
  return createDrillUiEventBindingsRootAppAssembly({
    welcomeControls,
    analyticsLink,
    settingsControls: {
      ...settingsControls,
      isPlaying: createGetter(settingsStateRefs.isPlaying) || settingsControls.isPlaying,
      getAudioContext: createGetter(settingsStateRefs.audioContext) || settingsControls.getAudioContext,
      getCurrentKey: createGetter(settingsStateRefs.currentKey) || settingsControls.getCurrentKey
    },
    pianoPresetControls: {
      ...pianoPresetControls,
      getPianoMidiSettings: createGetter(pianoPresetStateRefs.pianoMidiSettings) || pianoPresetControls.getPianoMidiSettings,
      setPianoFadeSettings: createSetter(pianoPresetStateRefs.pianoFadeSettings) || pianoPresetControls.setPianoFadeSettings,
      setPianoMidiSettings: createSetter(pianoPresetStateRefs.pianoMidiSettings) || pianoPresetControls.setPianoMidiSettings
    },
    lifecycleControls: {
      ...lifecycleControls,
      getIsPlaying: createGetter(lifecycleStateRefs.isPlaying) || lifecycleControls.getIsPlaying,
      getIsPaused: createGetter(lifecycleStateRefs.isPaused) || lifecycleControls.getIsPaused,
      getAudioContext: createGetter(lifecycleStateRefs.audioContext) || lifecycleControls.getAudioContext
    },
    lifecycleTarget,
    trackSessionDuration
  } as any);
}

export function createDrillWelcomeDrillRootAppFacade({
  dom = {},
  stateRefs = {},
  state = {},
  constants = {},
  helpers = {}
}: AdapterOptions = {}) {
  return createDrillWelcomeRootAppFacade({
    dom,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    constants,
    helpers
  } as any);
}


