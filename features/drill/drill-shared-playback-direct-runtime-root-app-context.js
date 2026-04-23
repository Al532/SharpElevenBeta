// @ts-check

/**
 * Creates the shared-playback direct-runtime root context from live root-app bindings.
 * This keeps the direct-runtime contract out of `app.js` while preserving the
 * same direct shared-playback runtime behavior.
 *
 * @param {object} [options]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillSharedPlaybackDirectRuntimeRootAppContext({
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getAudioContext = () => null,
    getCurrentKey = () => 0
  } = state;
  const {
    noteFadeout = 0
  } = constants;
  const {
    ensureWalkingBassGenerator = async () => {},
    stopActiveChordVoices = () => {},
    rebuildPreparedCompingPlans = () => {},
    buildPreparedBassPlan = () => {},
    preloadNearTermSamples = () => Promise.resolve(),
    validateCustomPattern = () => true
  } = helpers;

  return {
    ensureWalkingBassGenerator,
    getAudioContext,
    noteFadeout,
    stopActiveChordVoices,
    rebuildPreparedCompingPlans,
    buildPreparedBassPlan,
    getCurrentKey,
    preloadNearTermSamples,
    validateCustomPattern
  };
}
