import type {
  DrillSharedPlaybackDirectBindings,
  DrillSharedPlaybackHostBindings,
  DrillSharedPlaybackNormalizationBindings,
  DrillSharedPlaybackPatternUiBindings,
  DrillSharedPlaybackRuntimeBindings,
  DrillSharedPlaybackSettingsBindings,
  DrillSharedPlaybackStateBindings,
  DrillSharedPlaybackTransportBindings
} from './drill-shared-playback-types.js';

type SharedPlaybackAppContextOptions = {
  dom?: Record<string, unknown>;
  host?: DrillSharedPlaybackHostBindings;
  patternUi?: DrillSharedPlaybackPatternUiBindings;
  normalization?: DrillSharedPlaybackNormalizationBindings;
  playbackSettings?: DrillSharedPlaybackSettingsBindings;
  embeddedPlaybackState?: DrillSharedPlaybackStateBindings;
  embeddedPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  embeddedTransportActions?: DrillSharedPlaybackTransportBindings;
  directPlaybackRuntime?: DrillSharedPlaybackRuntimeBindings;
  directPlaybackState?: DrillSharedPlaybackStateBindings;
  directTransportActions?: DrillSharedPlaybackTransportBindings;
  publishDirectGlobals?: boolean;
};

function cloneOptions<T extends Record<string, unknown>>(options: T): T {
  return { ...options };
}

export function createDrillSharedPlaybackHostAppContext(
  options: DrillSharedPlaybackHostBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackPatternUiAppContext(
  options: DrillSharedPlaybackPatternUiBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackNormalizationAppContext(
  options: DrillSharedPlaybackNormalizationBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackSettingsAppContext(
  options: DrillSharedPlaybackSettingsBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectRuntimeAppContext(
  options: DrillSharedPlaybackRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectStateAppContext(
  options: DrillSharedPlaybackStateBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectTransportAppContext(
  options: DrillSharedPlaybackTransportBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackEmbeddedRuntimeAppContext(
  options: DrillSharedPlaybackRuntimeBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackEmbeddedStateAppContext(
  options: DrillSharedPlaybackStateBindings = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackAppContextOptions({
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
    } satisfies DrillSharedPlaybackDirectBindings,
    publishDirectGlobals
  };
}
