import type {
  EmbeddedPlaybackApi,
  EmbeddedPlaybackGlobals,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackSessionController
} from '../types/contracts';

import { createEmbeddedPlaybackApi } from './embedded-playback-api.js';
import {
  PLAYBACK_API_GLOBAL,
  PLAYBACK_API_READY_EVENT,
  PLAYBACK_RUNTIME_GLOBAL,
  PLAYBACK_SESSION_CONTROLLER_GLOBAL
} from './embedded-playback-identifiers.js';

export function publishEmbeddedPlaybackGlobals({
  targetWindow = window,
  embeddedApi,
  playbackRuntime = null,
  playbackController = null,
  readyEventName = PLAYBACK_API_READY_EVENT
}: {
  targetWindow?: Window | null;
  embeddedApi?: EmbeddedPlaybackApi;
  playbackRuntime?: PlaybackRuntime | null;
  playbackController?: PlaybackSessionController | null;
  readyEventName?: string;
} = {}): void {
  if (!targetWindow || !embeddedApi) return;

  targetWindow[PLAYBACK_API_GLOBAL] = embeddedApi;
  targetWindow[PLAYBACK_RUNTIME_GLOBAL] = playbackRuntime || undefined;
  targetWindow[PLAYBACK_SESSION_CONTROLLER_GLOBAL] = playbackController || undefined;
  targetWindow.dispatchEvent(new CustomEvent(readyEventName));
}

export function readEmbeddedPlaybackGlobals(targetWindow: Window | null | undefined = window): EmbeddedPlaybackGlobals {
  return {
    embeddedApi: targetWindow?.[PLAYBACK_API_GLOBAL] || null,
    playbackRuntime: targetWindow?.[PLAYBACK_RUNTIME_GLOBAL] || null,
    playbackController: targetWindow?.[PLAYBACK_SESSION_CONTROLLER_GLOBAL] || null
  };
}

export function resolveEmbeddedPlaybackApi(
  targetWindow: Window | null | undefined = window
): EmbeddedPlaybackApi | null {
  const {
    embeddedApi,
    playbackRuntime,
    playbackController
  } = readEmbeddedPlaybackGlobals(targetWindow);

  if (!embeddedApi && !playbackRuntime && !playbackController) {
    return null;
  }

  const hasCallableApi =
    typeof embeddedApi?.applyEmbeddedPattern === 'function'
    && typeof embeddedApi?.applyEmbeddedPlaybackSettings === 'function'
    && typeof embeddedApi?.startPlayback === 'function'
    && typeof embeddedApi?.stopPlayback === 'function'
    && typeof embeddedApi?.togglePausePlayback === 'function';

  if (hasCallableApi && typeof embeddedApi?.getPlaybackState === 'function') {
    return embeddedApi;
  }

  if (hasCallableApi && !playbackRuntime && !playbackController) {
    return {
      ...embeddedApi,
      getPlaybackState:
        typeof embeddedApi?.getPlaybackState === 'function'
          ? embeddedApi.getPlaybackState.bind(embeddedApi)
          : () => null
    } as EmbeddedPlaybackApi;
  }

  if (!playbackRuntime && !playbackController) {
    return null;
  }

  return createEmbeddedPlaybackApi({
    playbackRuntime: playbackRuntime || undefined,
    playbackController: playbackController || undefined,
    applyEmbeddedPattern:
      typeof embeddedApi?.applyEmbeddedPattern === 'function'
        ? embeddedApi.applyEmbeddedPattern.bind(embeddedApi)
        : () => ({
          ok: false,
          errorMessage: 'Playback bridge does not expose applyEmbeddedPattern.',
          state:
            typeof embeddedApi?.getPlaybackState === 'function'
              ? embeddedApi.getPlaybackState()
              : playbackRuntime?.getRuntimeState?.() || playbackController?.getState?.().runtime || null
        } as PlaybackOperationResult),
    getPlaybackState:
      typeof embeddedApi?.getPlaybackState === 'function'
        ? embeddedApi.getPlaybackState.bind(embeddedApi)
        : undefined
  });
}
