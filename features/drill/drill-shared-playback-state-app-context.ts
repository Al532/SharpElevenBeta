type DrillSharedPlaybackStateAppContextOptions = {
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
};

export function createDrillSharedPlaybackStateAppContext({
  host = {},
  patternUi = {},
  normalization = {},
  playbackSettings = {},
  embeddedPlaybackState = {},
  embeddedPlaybackRuntime = {},
  embeddedTransportActions = {},
  directPlaybackRuntime = {},
  directPlaybackState = {},
  directTransportActions = {}
}: DrillSharedPlaybackStateAppContextOptions = {}) {
  return {
    host,
    patternUi,
    normalization,
    playbackSettings,
    embeddedPlaybackState,
    embeddedPlaybackRuntime,
    embeddedTransportActions,
    directPlaybackRuntime,
    directPlaybackState,
    directTransportActions
  };
}
