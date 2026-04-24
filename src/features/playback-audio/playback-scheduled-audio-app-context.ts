
import { createPlaybackScheduledAudioRuntime } from './playback-scheduled-audio-runtime.js';

type PlaybackScheduledAudioRuntimeOptions = Parameters<typeof createPlaybackScheduledAudioRuntime>[0];
type ScheduledAudioState = Pick<NonNullable<PlaybackScheduledAudioRuntimeOptions>, 'getAudioContext'>;
type ScheduledAudioHelpers = Pick<NonNullable<PlaybackScheduledAudioRuntimeOptions>, 'stopActiveComping'>;
type ScheduledAudioConstants = Pick<NonNullable<PlaybackScheduledAudioRuntimeOptions>, 'getDefaultFadeDuration'>;

type PlaybackScheduledAudioAppContextOptions = {
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
export function createPlaybackScheduledAudioAppContext({
  audioState = {},
  audioHelpers = {},
  constants = {}
}: PlaybackScheduledAudioAppContextOptions = {}) {
  const options: PlaybackScheduledAudioRuntimeOptions = {
    getAudioContext: audioState.getAudioContext,
    stopActiveComping: audioHelpers.stopActiveComping,
    getDefaultFadeDuration: constants.getDefaultFadeDuration
  };
  return createPlaybackScheduledAudioRuntime(options);
}


