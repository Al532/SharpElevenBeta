
import {
  DEFAULT_SWING_TEMPO_BPM,
  getDrumSwingRatioForTempoBpm,
  getLightSwingRatioForTempoBpm
} from '../../core/music/swing-utils.js';

type CreateDrillTempoRuntimeRootAppAssemblyOptions = {
  dom?: {
    tempoSlider?: HTMLInputElement | null;
  };
  constants?: {
    defaultSwingRatio?: number;
  };
};

/**
 * Creates the small tempo/swing support helpers from live root-app bindings.
 * This keeps the derived timing helpers out of `app.js` while centralizing the
 * BPM-adaptive swing curves.
 *
 * @param {object} [options]
 * @param {CreateDrillTempoRuntimeRootAppAssemblyOptions['dom']} [options.dom]
 * @param {CreateDrillTempoRuntimeRootAppAssemblyOptions['constants']} [options.constants]
 */
export function createDrillTempoRuntimeRootAppAssembly({
  dom = {},
  constants = {}
}: CreateDrillTempoRuntimeRootAppAssemblyOptions = {}) {
  function getSecondsPerBeat() {
    return 60 / getTempoBpm();
  }

  function getTempoBpm() {
    const tempo = Number(dom.tempoSlider?.value || DEFAULT_SWING_TEMPO_BPM);
    return Number.isFinite(tempo) && tempo > 0 ? tempo : DEFAULT_SWING_TEMPO_BPM;
  }

  function getDrumSwingRatio() {
    return getDrumSwingRatioForTempoBpm(getTempoBpm());
  }

  function getSwingRatio() {
    return getLightSwingRatioForTempoBpm(getTempoBpm());
  }

  return {
    getSecondsPerBeat,
    getDrumSwingRatio,
    getSwingRatio
  };
}


