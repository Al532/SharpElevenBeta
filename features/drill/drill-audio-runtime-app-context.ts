import { createDrillAudioRuntime } from './drill-audio-runtime.js';
import type {
  DrillAudioCacheContext,
  DrillAudioConstantsContext,
  DrillAudioStateContext
} from './drill-audio-types.js';

type DrillAudioRuntimeAppContextOptions = {
  audioState?: DrillAudioStateContext;
  cacheState?: DrillAudioCacheContext;
  constants?: DrillAudioConstantsContext;
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

