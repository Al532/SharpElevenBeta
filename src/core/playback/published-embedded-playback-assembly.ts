import type {
  EmbeddedPatternPayload,
  EmbeddedPlaybackAssembly,
  EmbeddedPlaybackRuntimeState,
  PlaybackOperationResult,
  PlaybackRuntime,
  ChartPerformanceCue
} from '../types/contracts';

import { createEmbeddedPlaybackAssembly } from './embedded-playback-assembly.js';
import { publishEmbeddedPlaybackGlobals } from './embedded-playback-globals.js';
import { PLAYBACK_API_READY_EVENT } from './embedded-playback-identifiers.js';

export function createPublishedEmbeddedPlaybackAssembly({
  targetWindow = window,
  readyEventName = PLAYBACK_API_READY_EVENT,
  playbackRuntime,
  applyEmbeddedPattern,
  queuePerformanceCue,
  getPlaybackState
}: {
  targetWindow?: Window | null;
  readyEventName?: string;
  playbackRuntime: PlaybackRuntime;
  applyEmbeddedPattern?: (
    payload: EmbeddedPatternPayload
  ) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  queuePerformanceCue?: (cue: ChartPerformanceCue) => PlaybackOperationResult | Promise<PlaybackOperationResult>;
  getPlaybackState?: () => EmbeddedPlaybackRuntimeState;
}): EmbeddedPlaybackAssembly {
  const assembly = createEmbeddedPlaybackAssembly({
    playbackRuntime,
    applyEmbeddedPattern,
    queuePerformanceCue,
    getPlaybackState
  });

  publishEmbeddedPlaybackGlobals({
    targetWindow,
    embeddedApi: assembly.embeddedApi,
    playbackRuntime: assembly.playbackRuntime,
    playbackController: assembly.playbackController,
    readyEventName
  });

  return assembly;
}
