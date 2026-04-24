import type {
  DrillSharedPlaybackHostBindings,
  DrillSharedPlaybackNormalizationBindings,
  DrillSharedPlaybackPatternUiBindings,
  DrillSharedPlaybackRuntimeBindings,
  DrillSharedPlaybackSettingsBindings,
  DrillSharedPlaybackStateBindings,
  DrillSharedPlaybackTransportBindings
} from './drill-shared-playback-types.js';

type DrillSharedPlaybackStateAppContextOptions = {
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
