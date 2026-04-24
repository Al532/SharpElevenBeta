import type {
  PracticePlaybackAppBindings,
  PracticePlaybackDirectBindings,
  PracticePlaybackHostBindings,
  PracticePlaybackNormalizationBindings,
  PracticePlaybackPatternUiBindings,
  PracticePlaybackRuntimeBindings,
  PracticePlaybackSettingsBindings,
  PracticePlaybackStateBindings,
  PracticePlaybackTransportBindings
} from './practice-playback-types.js';

type SharedPlaybackAppContextOptions = {
  dom?: Record<string, unknown>;
  host?: PracticePlaybackHostBindings;
  patternUi?: PracticePlaybackPatternUiBindings;
  normalization?: PracticePlaybackNormalizationBindings;
  playbackSettings?: PracticePlaybackSettingsBindings;
  embeddedPlaybackState?: PracticePlaybackStateBindings;
  embeddedPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  embeddedTransportActions?: PracticePlaybackTransportBindings;
  directPlaybackRuntime?: PracticePlaybackRuntimeBindings;
  directPlaybackState?: PracticePlaybackStateBindings;
  directTransportActions?: PracticePlaybackTransportBindings;
  publishDirectGlobals?: boolean;
};

function cloneOptions<T extends Record<string, unknown>>(options: T): T {
  return { ...options };
}

export function createPracticePlaybackHostAppContext(
  options: PracticePlaybackHostBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackPatternUiAppContext(
  options: PracticePlaybackPatternUiBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackNormalizationAppContext(
  options: PracticePlaybackNormalizationBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackSettingsAppContext(
  options: PracticePlaybackSettingsBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackDirectRuntimeAppContext(
  options: PracticePlaybackRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackDirectStateAppContext(
  options: PracticePlaybackStateBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackDirectTransportAppContext(
  options: PracticePlaybackTransportBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackEmbeddedRuntimeAppContext(
  options: PracticePlaybackRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackEmbeddedStateAppContext(
  options: PracticePlaybackStateBindings = {}
) {
  return cloneOptions(options);
}

export function createPracticePlaybackAppBindings({
  embedded = {},
  direct = {},
  publishDirectGlobals
}: {
  embedded?: PracticePlaybackAppBindings['embedded'];
  direct?: PracticePlaybackAppBindings['direct'];
  publishDirectGlobals?: boolean;
} = {}): PracticePlaybackAppBindings {
  return {
    embedded,
    direct,
    publishDirectGlobals
  };
}

export function createPracticePlaybackRuntimeAppBindings<T extends Record<string, unknown>>(
  options: T
) {
  return cloneOptions(options);
}

export function createPracticePlaybackAppContextOptions({
  dom = {},
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  embeddedPlaybackState = {},
  embeddedPlaybackRuntime = {},
  embeddedTransportActions = {},
  directPlaybackRuntime = {},
  directPlaybackState = {},
  directTransportActions = {},
  publishDirectGlobals
}: SharedPlaybackAppContextOptions = {}) {
  return {
    embedded: {
      dom,
      host,
      patternUi,
      normalization,
      playbackSettings,
      playbackState: embeddedPlaybackState,
      playbackRuntime: embeddedPlaybackRuntime,
      transportActions: embeddedTransportActions
    },
    direct: {
      playbackRuntime: directPlaybackRuntime,
      playbackState: directPlaybackState,
      transportActions: directTransportActions
    } satisfies PracticePlaybackDirectBindings,
    publishDirectGlobals
  };
}
