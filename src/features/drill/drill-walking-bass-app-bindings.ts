// @ts-check
/** @typedef {{ constants?: { BASS_LOW?: number, BASS_HIGH?: number } }} DrillWalkingBassBindings */

/**
 * Groups the app-level bindings passed into the drill walking bass generator.
 *
 * @param {object} [options]
 * @param {DrillWalkingBassBindings} [options]
 * @returns {{ constants: { BASS_LOW?: number, BASS_HIGH?: number } }}
 */
export function createDrillWalkingBassAppBindings({
  constants = {}
} = {}) {
  return {
    constants
  };
}
