// @ts-nocheck

/**
 * Creates the small tempo/swing support helpers from live root-app bindings.
 * This keeps the derived timing helpers out of `app.js` while preserving the
 * existing playback timing behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.constants]
 */
export function createDrillTempoRuntimeRootAppAssembly({
  dom = {},
  constants = {}
} = {}) {
  const {
    defaultSwingRatio = 2 / 3
  } = constants;

  function getSecondsPerBeat() {
    return 60 / Number(dom.tempoSlider?.value || 120);
  }

  function getSwingRatio() {
    const tempo = Number(dom.tempoSlider?.value || 0);
    if (!Number.isFinite(tempo) || tempo <= 150) return defaultSwingRatio;
    if (tempo >= 300) return 0.5;
    const progress = (tempo - 150) / 150;
    return defaultSwingRatio + ((0.5 - defaultSwingRatio) * progress);
  }

  return {
    getSecondsPerBeat,
    getSwingRatio
  };
}


