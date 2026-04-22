// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { createChartDirectPlaybackWindowHost } from './chart-direct-playback-window-host.js';
import { createChartDirectPlaybackControllerOptions } from './chart-direct-playback-options.js';

/**
 * Creates the transitional direct playback runtime host for the chart.
 * This centralizes the temporary iframe-backed direct host assembly so the
 * future same-page runtime swap can replace one chart module instead of
 * touching `chart-dev/main.js` and multiple helper layers.
 *
 * @param {{
 *   getCurrentWindow?: () => Window | null,
 *   getExistingFrame?: () => HTMLIFrameElement | null,
 *   setFrame?: (frame: HTMLIFrameElement) => void,
 *   getTempo?: () => number,
 *   getCurrentChartTitle?: () => string,
 *   src?: string,
 *   parent?: ParentNode | null,
 *   timeoutMs?: number,
 *   createFrame?: () => HTMLIFrameElement
 * }} [options]
 * @returns {{
 *   ensureFrame: () => HTMLIFrameElement | null,
 *   getCurrentTargetWindow: () => Window | null,
 *   getFallbackTargetWindow: () => Window | null,
 *   getTargetWindow: () => Window | null,
 *   getDirectPlaybackOptions: () => DirectPlaybackControllerOptions
 * }}
 */
export function createChartDirectPlaybackRuntimeHost({
  getCurrentWindow,
  getExistingFrame,
  setFrame,
  getTempo,
  getCurrentChartTitle,
  src,
  parent,
  timeoutMs,
  createFrame
} = {}) {
  const windowHost = createChartDirectPlaybackWindowHost({
    getCurrentWindow,
    getExistingFrame,
    setFrame,
    src,
    parent,
    createFrame
  });

  const directPlaybackOptions = createChartDirectPlaybackControllerOptions({
    getTargetWindow: windowHost.getTargetWindow,
    getPreferredTargetWindow: windowHost.getCurrentTargetWindow,
    getFallbackTargetWindow: windowHost.getFallbackTargetWindow,
    getHostFrame: windowHost.ensureFrame,
    timeoutMs
  });

  return {
    ensureFrame: windowHost.ensureFrame,
    getCurrentTargetWindow: windowHost.getCurrentTargetWindow,
    getFallbackTargetWindow: windowHost.getFallbackTargetWindow,
    getTargetWindow: windowHost.getTargetWindow,
    getDirectPlaybackOptions() {
      return directPlaybackOptions;
    }
  };
}
