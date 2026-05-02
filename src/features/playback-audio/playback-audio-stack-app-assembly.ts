// @ts-check

import { createPlaybackAudioPlaybackAppContext } from './playback-audio-playback-app-context.js';
import { createPlaybackAudioRuntimeAppContext } from './playback-audio-runtime-app-context.js';
import { createPlaybackSamplePlaybackAppContext } from './playback-sample-playback-app-context.js';
import { createPlaybackSamplePreloadAppContext } from './playback-sample-preload-app-context.js';
import { createPlaybackScheduledAudioAppContext } from './playback-scheduled-audio-app-context.js';

/**
 * Creates the full audio/sample runtime stack used by the practice playback host
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
export function createPlaybackAudioStackAppAssembly({
  audioRuntime = {},
  samplePreload = {},
  scheduledAudio = {},
  audioPlayback = {},
  samplePlayback = {}
} = {}) {
  return {
    audioRuntime: createPlaybackAudioRuntimeAppContext(audioRuntime),
    samplePreload: createPlaybackSamplePreloadAppContext(samplePreload),
    scheduledAudio: createPlaybackScheduledAudioAppContext(scheduledAudio),
    audioPlayback: createPlaybackAudioPlaybackAppContext(audioPlayback),
    samplePlayback: createPlaybackSamplePlaybackAppContext(samplePlayback)
  };
}
