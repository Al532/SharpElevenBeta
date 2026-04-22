import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';

import { publishDirectPlaybackGlobals } from '../../core/playback/direct-playback-globals.js';
import { createDrillDirectRuntimeAppAssembly } from './drill-direct-runtime-app-assembly.js';
import { createDrillEmbeddedRuntimeAppAssembly } from './drill-embedded-runtime-app-assembly.js';
import { initializeEmbeddedDrillRuntime } from './drill-embedded-runtime.js';

export function createDrillSharedPlaybackAppAssembly({
  embedded = {},
  direct = {},
  publishDirectGlobals = true
}: {
  embedded?: {
    dom?: Record<string, any>;
    host?: Record<string, any>;
    patternUi?: Record<string, any>;
    normalization?: Record<string, any>;
    playbackSettings?: Record<string, any>;
    playbackState?: Record<string, any>;
    playbackRuntime?: Record<string, any>;
    transportActions?: Record<string, any>;
  };
  direct?: {
    playbackRuntime?: Record<string, any>;
    playbackState?: Record<string, any>;
    transportActions?: Record<string, any>;
  };
  publishDirectGlobals?: boolean;
} = {}): {
  playbackController: PlaybackSessionController;
  applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState: () => Partial<PlaybackRuntimeState> | null | undefined;
  directPlaybackControllerOptions: DirectPlaybackControllerOptions;
} {
  const {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  } = initializeEmbeddedDrillRuntime(createDrillEmbeddedRuntimeAppAssembly({
    dom: embedded.dom,
    host: embedded.host,
    patternUi: embedded.patternUi,
    normalization: embedded.normalization,
    playbackSettings: embedded.playbackSettings,
    playbackState: embedded.playbackState,
    playbackRuntime: embedded.playbackRuntime,
    transportActions: embedded.transportActions
  }));

  const directPlaybackControllerOptions = createDrillDirectRuntimeAppAssembly({
    embedded: {
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState
    },
    playbackRuntime: direct.playbackRuntime,
    playbackState: direct.playbackState,
    transportActions: direct.transportActions
  });

  if (publishDirectGlobals) {
    publishDirectPlaybackGlobals({
      directPlaybackControllerOptions
    });
  }

  return {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState,
    directPlaybackControllerOptions
  };
}
