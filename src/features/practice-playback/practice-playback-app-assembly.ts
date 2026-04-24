import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionController,
  PlaybackSettings
} from '../../core/types/contracts';
import type { PracticePlaybackAppAssembly, PracticePlaybackDirectBindings, PracticePlaybackEmbeddedBindings } from './practice-playback-types.js';

import { publishDirectPlaybackGlobals } from '../../core/playback/direct-playback-globals.js';

type PracticePlaybackEmbeddedRuntimeInitializer = (options: unknown) => {
  playbackController: PlaybackSessionController;
  applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState: () => Partial<PlaybackRuntimeState> | null | undefined;
};

type PracticePlaybackAppAssemblyAdapters = {
  createEmbeddedRuntimeAssembly?: (options: {
    dom?: Record<string, unknown>;
    host?: PracticePlaybackEmbeddedBindings['host'];
    patternUi?: PracticePlaybackEmbeddedBindings['patternUi'];
    normalization?: PracticePlaybackEmbeddedBindings['normalization'];
    playbackSettings?: PracticePlaybackEmbeddedBindings['playbackSettings'];
    playbackState?: PracticePlaybackEmbeddedBindings['playbackState'];
    playbackRuntime?: PracticePlaybackEmbeddedBindings['playbackRuntime'];
    transportActions?: PracticePlaybackEmbeddedBindings['transportActions'];
  }) => unknown;
  initializeEmbeddedRuntime?: PracticePlaybackEmbeddedRuntimeInitializer;
  createDirectRuntimeAssembly?: (options: {
    embedded: {
      applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
      applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => unknown;
      getEmbeddedPlaybackState: () => Partial<PlaybackRuntimeState> | null | undefined;
    };
    playbackRuntime?: PracticePlaybackDirectBindings['playbackRuntime'];
    playbackState?: PracticePlaybackDirectBindings['playbackState'];
    transportActions?: PracticePlaybackDirectBindings['transportActions'];
  }) => DirectPlaybackControllerOptions;
};

function requireAdapter<T>(adapter: T | undefined, name: string): T {
  if (!adapter) {
    throw new Error(`Practice playback adapter missing: ${name}.`);
  }
  return adapter;
}

export function createPracticePlaybackAppAssembly({
  embedded = {},
  direct = {},
  publishDirectGlobals = true,
  adapters = {}
}: {
  embedded?: PracticePlaybackEmbeddedBindings;
  direct?: PracticePlaybackDirectBindings;
  publishDirectGlobals?: boolean;
  adapters?: PracticePlaybackAppAssemblyAdapters;
} = {}): PracticePlaybackAppAssembly {
  const createEmbeddedRuntimeAssembly = requireAdapter(
    adapters.createEmbeddedRuntimeAssembly,
    'createEmbeddedRuntimeAssembly'
  );
  const initializeEmbeddedRuntime = requireAdapter(
    adapters.initializeEmbeddedRuntime,
    'initializeEmbeddedRuntime'
  );
  const createDirectRuntimeAssembly = requireAdapter(
    adapters.createDirectRuntimeAssembly,
    'createDirectRuntimeAssembly'
  );

  const {
    playbackController,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  } = initializeEmbeddedRuntime(createEmbeddedRuntimeAssembly({
    dom: embedded.dom,
    host: embedded.host,
    patternUi: embedded.patternUi,
    normalization: embedded.normalization,
    playbackSettings: embedded.playbackSettings,
    playbackState: embedded.playbackState,
    playbackRuntime: embedded.playbackRuntime,
    transportActions: embedded.transportActions
  }));

  const directPlaybackControllerOptions = createDirectRuntimeAssembly({
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
