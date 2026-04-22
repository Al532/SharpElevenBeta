// @ts-check

/**
 * Creates the transitional direct playback host frame resolver for the chart.
 * The current direct runtime still lives behind a same-origin iframe, so this
 * keeps that temporary host creation localized to a single chart-specific
 * module until the same-page runtime fully replaces it.
 *
 * @param {{
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
 *   ensureFrame: () => HTMLIFrameElement,
 *   getTargetWindow: () => Window | null
 * }}
 */
export function createChartDirectPlaybackFrameHost({
  getExistingFrame,
  setFrame,
  src = '../index.html?embedded=1',
  id = 'drill-bridge-frame',
  className = 'chart-drill-bridge',
  title = 'Hidden playback bridge',
  parent = typeof document !== 'undefined' ? document.body : null,
  createFrame = () => /** @type {HTMLIFrameElement} */ (document.createElement('iframe'))
} = {}) {
  /**
   * @param {unknown} value
   * @returns {value is HTMLIFrameElement}
   */
  function isIframeElement(value) {
    return Boolean(
      value
      && typeof value === 'object'
      && 'contentWindow' in /** @type {object} */ (value)
    );
  }

  /** @returns {HTMLIFrameElement} */
  function ensureFrame() {
    const existingFrame = getExistingFrame?.() || null;
    if (isIframeElement(existingFrame)) {
      return existingFrame;
    }

    const frame = createFrame();
    frame.id = id;
    frame.className = className;
    frame.src = src;
    frame.title = title;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    parent?.appendChild(frame);
    setFrame?.(frame);
    return frame;
  }

  return {
    ensureFrame,
    getTargetWindow() {
      return ensureFrame().contentWindow || null;
    }
  };
}
