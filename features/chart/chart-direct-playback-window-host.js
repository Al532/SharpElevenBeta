// @ts-check

import { readDirectPlaybackGlobals } from '../../core/playback/direct-playback-globals.js';
import { createChartDirectPlaybackFrameHost } from './chart-direct-playback-frame.js';

/**
 * Creates the transitional direct playback window host for the chart.
 * It prefers a same-page direct runtime when one is already published on the
 * current window, and only falls back to the temporary iframe-backed host when
 * needed. This keeps the future iframe removal localized to one chart seam.
 *
 * @param {{
 *   getCurrentWindow?: () => Window | null,
 *   shouldUseCurrentWindow?: (targetWindow: Window | null) => boolean,
 *   getExistingFrame?: () => HTMLIFrameElement | null,
 *   setFrame?: (frame: HTMLIFrameElement) => void,
 *   src?: string,
 *   id?: string,
 *   className?: string,
 *   title?: string,
 *   parent?: ParentNode | null,
 *   createFrame?: () => HTMLIFrameElement
 * }} [options]
 * @returns {{
 *   getCurrentTargetWindow: () => Window | null,
 *   ensureFrame: () => HTMLIFrameElement | null,
 *   getFallbackTargetWindow: () => Window | null,
 *   getTargetWindow: () => Window | null
 * }}
 */
export function createChartDirectPlaybackWindowHost({
  getCurrentWindow = () => (typeof window !== 'undefined' ? window : null),
  shouldUseCurrentWindow = (targetWindow) => Boolean(readDirectPlaybackGlobals(targetWindow)),
  getExistingFrame,
  setFrame,
  src,
  id,
  className,
  title,
  parent,
  createFrame
} = {}) {
  const frameHost = createChartDirectPlaybackFrameHost({
    getExistingFrame,
    setFrame,
    src,
    id,
    className,
    title,
    parent,
    createFrame
  });

  /** @returns {Window | null} */
  function getCurrentTargetWindow() {
    const targetWindow = getCurrentWindow?.() || null;
    return shouldUseCurrentWindow(targetWindow) ? targetWindow : null;
  }

  return {
    getCurrentTargetWindow() {
      return getCurrentTargetWindow();
    },
    ensureFrame() {
      return getCurrentTargetWindow() ? null : frameHost.ensureFrame();
    },
    getFallbackTargetWindow() {
      return frameHost.getTargetWindow();
    },
    getTargetWindow() {
      return getCurrentTargetWindow() || frameHost.getTargetWindow();
    }
  };
}
