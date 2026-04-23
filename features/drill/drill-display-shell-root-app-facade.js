// @ts-check

/**
 * Creates the drill display-shell facade from live root-app bindings. This
 * keeps the small next-column, placeholder, and beat-dot UI contracts out of
 * `app.js` while preserving the same display shell behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Function} [options.fitHarmonyDisplay]
 * @param {string} [options.defaultDisplayPlaceholderMessage]
 */
export function createDrillDisplayShellRootAppFacade({
  dom = {},
  fitHarmonyDisplay,
  defaultDisplayPlaceholderMessage = ''
} = {}) {
  function showNextCol() {
    dom.nextHeader.textContent = 'Next';
    dom.nextHeader.classList.remove('hidden');
    dom.nextKeyDisplay.classList.remove('hidden');
    dom.nextChordDisplay.classList.remove('hidden');
    fitHarmonyDisplay?.();
  }

  function hideNextCol() {
    dom.nextHeader.textContent = '';
    dom.nextHeader.classList.add('hidden');
    dom.nextKeyDisplay.classList.add('hidden');
    dom.nextChordDisplay.classList.add('hidden');
    fitHarmonyDisplay?.();
  }

  function setDisplayPlaceholderVisible(visible) {
    dom.displayPlaceholder?.classList.toggle('hidden', !visible);
    dom.reopenWelcome?.classList.toggle('hidden', !visible);
  }

  function setDisplayPlaceholderMessage(message = defaultDisplayPlaceholderMessage) {
    if (!dom.displayPlaceholderMessage) return;
    dom.displayPlaceholderMessage.textContent = message;
  }

  function updateBeatDots(beat, isIntro) {
    dom.beatDots.forEach((dot, index) => {
      dot.classList.toggle('active', index === beat && !isIntro);
      dot.classList.toggle('intro', index === beat && isIntro);
    });
  }

  function clearBeatDots() {
    dom.beatDots.forEach(dot => {
      dot.classList.remove('active', 'intro');
    });
  }

  return {
    showNextCol,
    hideNextCol,
    setDisplayPlaceholderVisible,
    setDisplayPlaceholderMessage,
    updateBeatDots,
    clearBeatDots
  };
}
