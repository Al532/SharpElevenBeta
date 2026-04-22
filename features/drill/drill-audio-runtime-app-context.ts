import { createDrillAudioRuntime } from './drill-audio-runtime.js';

type DrillAudioRuntimeAppContextOptions = {
  audioState?: Record<string, any>;
  cacheState?: Record<string, any>;
  constants?: Record<string, any>;
  fetchImpl?: typeof fetch;
};

export function createDrillAudioRuntimeAppContext({
  audioState = {},
  cacheState = {},
  constants = {},
  fetchImpl
}: DrillAudioRuntimeAppContextOptions = {}) {
  return createDrillAudioRuntime({
    sampleBuffers: cacheState.sampleBuffers,
    sampleLoadPromises: cacheState.sampleLoadPromises,
    sampleFileBuffers: cacheState.sampleFileBuffers,
    sampleFileFetchPromises: cacheState.sampleFileFetchPromises,
    getAudioContext: audioState.getAudioContext,
    appVersion: constants.appVersion,
    fetchImpl
  });
}
