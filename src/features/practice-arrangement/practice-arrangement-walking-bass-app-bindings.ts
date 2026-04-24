// @ts-check
/** @typedef {{ constants?: { BASS_LOW?: number, BASS_HIGH?: number } }} PracticeArrangementWalkingBassBindings */

/**
 * Groups the app-level bindings passed into the drill walking bass generator.
 *
 * @param {object} [options]
 * @param {PracticeArrangementWalkingBassBindings} [options]
 * @returns {{ constants: { BASS_LOW?: number, BASS_HIGH?: number } }}
 */
export function createPracticeArrangementWalkingBassAppBindings({
  constants = {}
} = {}) {
  return {
    constants
  };
}
