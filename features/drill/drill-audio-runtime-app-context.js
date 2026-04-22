// @ts-check

import { createDrillAudioRuntime } from './drill-audio-runtime.js';

/**
 * Creates the sample-loading runtime from grouped app concerns so `app.js`
 * stays focused on state ownership instead of wiring fetch/decode/cache details.
 *
 * @param {object} [options]
 * @param {object} [options.audioState]
 * @param {object} [options.cacheState]
 * @param {object} [options.constants]
 */
export function createDrillAudioRuntimeAppContext({
  audioState = {},
  cacheState = {},
  constants = {}
} = {}) {
  return createDrillAudioRuntime({
    sampleBuffers: cacheState.sampleBuffers,
    sampleLoadPromises: cacheState.sampleLoadPromises,
    sampleFileBuffers: cacheState.sampleFileBuffers,
    sampleFileFetchPromises: cacheState.sampleFileFetchPromises,
    getAudioContext: audioState.getAudioContext,
    appVersion: constants.appVersion
  });
}
