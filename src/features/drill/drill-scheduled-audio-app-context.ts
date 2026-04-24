
import { createDrillScheduledAudioRuntime } from './drill-scheduled-audio-runtime.js';

type DrillScheduledAudioRuntimeOptions = Parameters<typeof createDrillScheduledAudioRuntime>[0];
type ScheduledAudioState = Pick<NonNullable<DrillScheduledAudioRuntimeOptions>, 'getAudioContext'>;
type ScheduledAudioHelpers = Pick<NonNullable<DrillScheduledAudioRuntimeOptions>, 'stopActiveComping'>;
type ScheduledAudioConstants = Pick<NonNullable<DrillScheduledAudioRuntimeOptions>, 'getDefaultFadeDuration'>;

type DrillScheduledAudioAppContextOptions = {
  audioState?: ScheduledAudioState;
  audioHelpers?: ScheduledAudioHelpers;
  constants?: ScheduledAudioConstants;
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
  const options: DrillScheduledAudioRuntimeOptions = {
    getAudioContext: audioState.getAudioContext,
    stopActiveComping: audioHelpers.stopActiveComping,
    getDefaultFadeDuration: constants.getDefaultFadeDuration
  };
  return createDrillScheduledAudioRuntime(options);
}


