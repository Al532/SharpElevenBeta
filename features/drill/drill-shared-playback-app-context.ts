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
