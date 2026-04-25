import type {
  DirectPlaybackControllerOptions,
  PlaybackOperationResult,
  PlaybackRuntimeState
} from '../../core/types/contracts';

import { createChartDirectPlaybackHostResolver } from './chart-direct-playback-host.js';

function createUnavailableDirectPlaybackResult(): PlaybackOperationResult {
  return {
    ok: false,
    errorMessage: 'Direct playback host unavailable.',
    state: null
  };
}

export function createChartDirectPlaybackControllerOptions({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getPreferredTargetWindow?: () => Window | null;
  getFallbackTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  timeoutMs?: number;
} = {}): DirectPlaybackControllerOptions {
  const directPlaybackHost = createChartDirectPlaybackHostResolver({
    getTargetWindow,
    getPreferredTargetWindow,
    getFallbackTargetWindow,
    getHostFrame,
    timeoutMs
  });

  return {
    isPlaying() {
      return Boolean(directPlaybackHost.getDirectHostOptions()?.getDirectPlaybackState?.()?.isPlaying);
    },
    async loadDirectSession(sessionSpec, playbackSettings = {}) {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.loadDirectSession === 'function') {
        return directHostOptions.loadDirectSession(sessionSpec, playbackSettings);
      }
      return createUnavailableDirectPlaybackResult();
    },
    async updateDirectPlaybackSettings(playbackSettings = {}, sessionSpec = null) {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.updateDirectPlaybackSettings === 'function') {
        return directHostOptions.updateDirectPlaybackSettings(playbackSettings, sessionSpec);
      }
      return createUnavailableDirectPlaybackResult();
    },
    getDirectPlaybackState() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.getDirectPlaybackState === 'function') {
        return (directHostOptions.getDirectPlaybackState() || null) as Partial<PlaybackRuntimeState> | null;
      }
      return null;
    },
    async startPlayback() {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.startPlayback === 'function') {
        await directHostOptions.startPlayback();
        return;
      }
      throw new Error('Direct playback host unavailable.');
    },
    stopPlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.stopPlayback === 'function') {
        directHostOptions.stopPlayback();
      }
    },
    togglePausePlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.togglePausePlayback === 'function') {
        directHostOptions.togglePausePlayback();
      }
    }
  };
}
