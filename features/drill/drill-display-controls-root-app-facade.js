// @ts-check

import {
  applyDrillBeatIndicatorVisibility,
  applyDrillCurrentHarmonyVisibility,
  applyDrillDisplayMode
} from './drill-display-runtime.js';

/**
 * Creates the drill display-controls facade from live root-app bindings.
 * This keeps the small display/visibility helper contracts out of `app.js`
 * while preserving the same display toggle behavior.
 *
 * @param {object} [options]
 * @param {() => any} [options.getBeatIndicator]
 * @param {() => boolean} [options.getShowBeatIndicatorEnabled]
 * @param {() => any} [options.getDisplayElement]
 * @param {() => boolean} [options.getCurrentHarmonyHidden]
 * @param {() => string} [options.getDisplayMode]
 * @param {Function} [options.applyDisplaySideLayout]
 * @param {Function} [options.fitHarmonyDisplay]
 */
export function createDrillDisplayControlsRootAppFacade({
  getBeatIndicator = () => null,
  getShowBeatIndicatorEnabled = () => true,
  getDisplayElement = () => null,
  getCurrentHarmonyHidden = () => false,
  getDisplayMode = () => 'both',
  applyDisplaySideLayout,
  fitHarmonyDisplay
} = {}) {
  function applyBeatIndicatorVisibility() {
    applyDrillBeatIndicatorVisibility({
      beatIndicator: getBeatIndicator(),
      showBeatIndicatorEnabled: getShowBeatIndicatorEnabled()
    });
  }

  function isCurrentHarmonyHidden() {
    return getCurrentHarmonyHidden() === true;
  }

  function applyCurrentHarmonyVisibility() {
    applyDrillCurrentHarmonyVisibility({
      displayElement: getDisplayElement(),
      currentHarmonyHidden: isCurrentHarmonyHidden()
    });
  }

  function applyDisplayMode() {
    applyDrillDisplayMode({
      displayElement: getDisplayElement(),
      mode: getDisplayMode(),
      applyDisplaySideLayout,
      applyCurrentHarmonyVisibility,
      fitHarmonyDisplay
    });
  }

  return {
    applyBeatIndicatorVisibility,
    isCurrentHarmonyHidden,
    applyCurrentHarmonyVisibility,
    applyDisplayMode
  };
}
