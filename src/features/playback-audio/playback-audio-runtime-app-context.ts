import { createPlaybackAudioRuntime } from './playback-audio-runtime.js';
import type {
  PlaybackAudioCacheContext,
  PlaybackAudioConstantsContext,
  PlaybackAudioStateContext
} from './playback-audio-types.js';

type PlaybackAudioRuntimeAppContextOptions = {
  audioState?: PlaybackAudioStateContext;
  cacheState?: PlaybackAudioCacheContext;
  constants?: PlaybackAudioConstantsContext;
  fetchImpl?: typeof fetch;
};

export function createPlaybackAudioRuntimeAppContext({
  audioState = {},
  cacheState = {},
  constants = {},
  fetchImpl
}: PlaybackAudioRuntimeAppContextOptions = {}) {
  return createPlaybackAudioRuntime({
    sampleBuffers: cacheState.sampleBuffers,
    sampleLoadPromises: cacheState.sampleLoadPromises,
    sampleFileBuffers: cacheState.sampleFileBuffers,
    sampleFileFetchPromises: cacheState.sampleFileFetchPromises,
    getAudioContext: audioState.getAudioContext,
    appVersion: constants.appVersion,
    fetchImpl
  });
}

