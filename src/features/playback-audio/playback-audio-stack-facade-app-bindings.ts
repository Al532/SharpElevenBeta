
import type { PlaybackAudioStackLike } from './playback-audio-types.js';

type PlaybackAudioStackFacadeAppBindingsOptions = {
  audioStack?: PlaybackAudioStackLike;
  getCurrentTime?: () => number;
  defaultFadeDuration?: number;
};

/**
 * Groups the app-level bindings passed into the playback audio stack facade.
 *
 * @param {object} [options]
 * @param {PlaybackAudioStackLike} [options.audioStack]
 * @param {() => number} [options.getCurrentTime]
 * @param {number} [options.defaultFadeDuration]
 * @returns {{
 *   audioStack: PlaybackAudioStackLike,
 *   getCurrentTime: (() => number) | undefined,
 *   defaultFadeDuration: number | undefined
 * }}
 */
export function createPlaybackAudioStackFacadeAppBindings({
  audioStack = {},
  getCurrentTime,
  defaultFadeDuration
}: PlaybackAudioStackFacadeAppBindingsOptions = {}) {
  return {
    audioStack,
    getCurrentTime,
    defaultFadeDuration
  };
}


