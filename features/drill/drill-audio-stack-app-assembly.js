// @ts-check

import { createDrillAudioPlaybackAppContext } from './drill-audio-playback-app-context.js';
import { createDrillAudioRuntimeAppContext } from './drill-audio-runtime-app-context.js';
import { createDrillSamplePlaybackAppContext } from './drill-sample-playback-app-context.js';
import { createDrillSamplePreloadAppContext } from './drill-sample-preload-app-context.js';
import { createDrillScheduledAudioAppContext } from './drill-scheduled-audio-app-context.js';

/**
 * Creates the full audio/sample runtime stack used by the historical drill app
 * from grouped app concerns. This keeps the top-level runtime section in
 * `app.js` compact while preserving the existing behavior.
 *
 * @param {object} [options]
 * @param {object} [options.audioRuntime]
 * @param {object} [options.samplePreload]
 * @param {object} [options.scheduledAudio]
 * @param {object} [options.audioPlayback]
 * @param {object} [options.samplePlayback]
 */
export function createDrillAudioStackAppAssembly({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {}
} = {}) {
  return {
    audioRuntime: createDrillAudioRuntimeAppContext(audioRuntime),
    samplePreload: createDrillSamplePreloadAppContext(samplePreload),
    scheduledAudio: createDrillScheduledAudioAppContext(scheduledAudio),
    audioPlayback: createDrillAudioPlaybackAppContext(audioPlayback),
    samplePlayback: createDrillSamplePlaybackAppContext(samplePlayback)
  };
}
