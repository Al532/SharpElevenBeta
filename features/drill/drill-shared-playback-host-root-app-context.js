// @ts-check

/**
 * Creates the shared-playback host root context from live root-app bindings.
 * This keeps the large host contract out of `app.js` while preserving the same
 * host-facing shared-playback behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillSharedPlaybackHostRootAppContext({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getLastPatternSelectValue = () => '',
    setLastPatternSelectValue = () => {},
    getIsPlaying = () => false,
    getIsPaused = () => false,
    getIsIntro = () => false,
    getCurrentBeat = () => 0,
    getCurrentChordIdx = () => 0,
    getPaddedChordCount = () => 0,
    getCurrentKey = () => 0,
    getAudioContext = () => null
  } = state;
  const {
    customPatternOptionValue = ''
  } = constants;
  const {
    setSuppressPatternSelectChange = () => {},
    setPatternSelectValue = () => {},
    setEditorPatternMode = () => {},
    syncPatternSelectionFromInput = () => {},
    startPlayback = () => {},
    stopPlayback = () => {},
    togglePausePlayback = () => {}
  } = helpers;

  return {
    customPatternOptionValue,
    setSuppressPatternSelectChange,
    setPatternSelectValue,
    setEditorPatternMode,
    syncPatternSelectionFromInput,
    getLastPatternSelectValue,
    setLastPatternSelectValue,
    getIsPlaying,
    getIsPaused,
    getIsIntro,
    getCurrentBeat,
    getCurrentChordIdx,
    getPaddedChordCount,
    getTempo: () => Number(dom.tempoSlider?.value || 0),
    getAudioContext,
    getCurrentKey,
    startPlayback,
    stopPlayback,
    togglePausePlayback
  };
}
