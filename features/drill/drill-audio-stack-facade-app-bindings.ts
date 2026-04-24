
import type { DrillAudioStackLike } from './drill-audio-types.js';

type DrillAudioStackFacadeAppBindingsOptions = {
  audioStack?: DrillAudioStackLike;
  getCurrentTime?: () => number;
  defaultFadeDuration?: number;
};

/**
 * Groups the app-level bindings passed into the drill audio stack facade.
 *
 * @param {object} [options]
 * @param {DrillAudioStackLike} [options.audioStack]
 * @param {() => number} [options.getCurrentTime]
 * @param {number} [options.defaultFadeDuration]
 * @returns {{
 *   audioStack: DrillAudioStackLike,
 *   getCurrentTime: (() => number) | undefined,
 *   defaultFadeDuration: number | undefined
 * }}
 */
export function createDrillAudioStackFacadeAppBindings({
  audioStack = {},
  getCurrentTime,
  defaultFadeDuration
}: DrillAudioStackFacadeAppBindingsOptions = {}) {
  return {
    audioStack,
    getCurrentTime,
    defaultFadeDuration
  };
}


