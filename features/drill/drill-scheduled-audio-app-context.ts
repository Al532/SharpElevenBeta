
import { createDrillScheduledAudioRuntime } from './drill-scheduled-audio-runtime.js';

type DrillScheduledAudioAppContextOptions = {
  audioState?: Record<string, any>;
  audioHelpers?: Record<string, any>;
  constants?: Record<string, any>;
};

/**
 * Creates the scheduled-audio runtime from grouped app concerns so `app.js`
 * does not have to wire comping shutdown and fade defaults inline.
 *
 * @param {object} [options]
 * @param {object} [options.audioState]
 * @param {object} [options.audioHelpers]
 * @param {object} [options.constants]
 */
export function createDrillScheduledAudioAppContext({
  audioState = {},
  audioHelpers = {},
  constants = {}
}: DrillScheduledAudioAppContextOptions = {}) {
  return createDrillScheduledAudioRuntime({
    getAudioContext: audioState.getAudioContext,
    stopActiveComping: audioHelpers.stopActiveComping,
    getDefaultFadeDuration: constants.getDefaultFadeDuration
  } as any);
}


