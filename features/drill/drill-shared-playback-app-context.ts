type SharedPlaybackAppContextOptions = {
  dom?: Record<string, any>;
  host?: Record<string, any>;
  patternUi?: Record<string, any>;
  normalization?: Record<string, any>;
  playbackSettings?: Record<string, any>;
  embeddedPlaybackState?: Record<string, any>;
  embeddedPlaybackRuntime?: Record<string, any>;
  embeddedTransportActions?: Record<string, any>;
  directPlaybackRuntime?: Record<string, any>;
  directPlaybackState?: Record<string, any>;
  directTransportActions?: Record<string, any>;
  publishDirectGlobals?: boolean;
};

function cloneOptions(options: Record<string, any> = {}) {
  return { ...options };
}

export function createDrillSharedPlaybackHostAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackPatternUiAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackNormalizationAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackSettingsAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectRuntimeAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectStateAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackDirectTransportAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackEmbeddedRuntimeAppContext(
  options: Record<string, any> = {}
) {
  return cloneOptions(options);
}

export function createDrillSharedPlaybackEmbeddedStateAppContext(
  options: Record<string, any> = {}
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
    },
    publishDirectGlobals
  };
}
