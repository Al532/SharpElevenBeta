import { createPlaybackAudioRuntime } from './playback-audio-runtime.js';
import type {
  PlaybackAudioCacheContext,
  PlaybackAudioConstantsContext,
  PlaybackSamplePolicy,
  PlaybackAudioStateContext
} from './playback-audio-types.js';

type PlaybackAudioRuntimeAppContextOptions = {
  audioState?: PlaybackAudioStateContext;
  cacheState?: PlaybackAudioCacheContext;
  constants?: PlaybackAudioConstantsContext;
  fetchImpl?: typeof fetch;
  samplePolicy?: PlaybackSamplePolicy;
};

export function createPlaybackAudioRuntimeAppContext({
  audioState = {},
  cacheState = {},
  constants = {},
  fetchImpl,
  samplePolicy
}: PlaybackAudioRuntimeAppContextOptions = {}) {
  return createPlaybackAudioRuntime({
    sampleBuffers: cacheState.sampleBuffers,
    sampleLoadPromises: cacheState.sampleLoadPromises,
    sampleFileBuffers: cacheState.sampleFileBuffers,
    sampleFileFetchPromises: cacheState.sampleFileFetchPromises,
    getProtectedSampleCategories: cacheState.getProtectedSampleCategories,
    getAudioContext: audioState.getAudioContext,
    appVersion: constants.appVersion,
    fetchImpl,
    samplePolicy
  });
}

