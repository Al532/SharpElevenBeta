// @ts-nocheck

/**
 * Creates grouped app-host bindings for the embedded Drill runtime.
 * This keeps the DOM/setter wrappers needed by the embedded runtime out of
 * `app.js`, while preserving the current runtime behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {string} [options.customPatternOptionValue]
 * @param {(value: boolean) => void} [options.setSuppressPatternSelectChange]
 * @param {(value: string) => void} [options.setPatternSelectValue]
 * @param {(value: string) => void} [options.setEditorPatternMode]
 * @param {() => void} [options.syncPatternSelectionFromInput]
 * @param {() => string} [options.getLastPatternSelectValue]
 * @param {(value: string) => void} [options.setLastPatternSelectValue]
 * @param {() => boolean} [options.getIsPlaying]
 * @param {() => boolean} [options.getIsPaused]
 * @param {() => boolean} [options.getIsIntro]
 * @param {() => number} [options.getCurrentBeat]
 * @param {() => number} [options.getCurrentChordIdx]
 * @param {() => number} [options.getPaddedChordCount]
 * @param {() => number} [options.getTempo]
 * @param {() => BaseAudioContext | null} [options.getAudioContext]
 * @param {() => number} [options.getCurrentKey]
 * @param {() => Promise<void>} [options.startPlayback]
 * @param {() => void} [options.stopPlayback]
 * @param {() => void} [options.togglePausePlayback]
 * @returns {{
 *   patternUi: Record<string, any>,
 *   playbackState: Record<string, any>,
 *   playbackRuntime: Record<string, any>,
 *   transportActions: Record<string, any>
 * }}
 */
export function createDrillEmbeddedRuntimeHostBindings({
  dom = {},
  customPatternOptionValue = '',
  setSuppressPatternSelectChange = () => {},
  setPatternSelectValue = () => {},
  setEditorPatternMode = () => {},
  syncPatternSelectionFromInput = () => {},
  getLastPatternSelectValue = () => '',
  setLastPatternSelectValue = () => {},
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getIsIntro = () => false,
  getCurrentBeat = () => 0,
  getCurrentChordIdx = () => 0,
  getPaddedChordCount = () => 0,
  getTempo = () => 0,
  getAudioContext = () => null,
  getCurrentKey = () => 0,
  startPlayback = async () => {},
  stopPlayback = () => {},
  togglePausePlayback = () => {}
} = {}) {
  return {
    patternUi: {
      setCustomPatternSelection() {
        setSuppressPatternSelectChange(true);
        setPatternSelectValue(customPatternOptionValue);
      },
      setPatternName(value) {
        if (dom.patternName) {
          dom.patternName.value = value;
        }
      },
      setCustomPatternValue(value) {
        if (dom.customPattern) {
          dom.customPattern.value = value;
        }
      },
      setEditorPatternMode(value) {
        setEditorPatternMode(value);
      },
      syncPatternSelectionFromInput() {
        syncPatternSelectionFromInput();
        setSuppressPatternSelectChange(false);
      },
      setLastPatternSelectValue() {
        const nextValue = dom.patternSelect?.value ?? getLastPatternSelectValue();
        setLastPatternSelectValue(String(nextValue));
      },
      getPatternErrorText() {
        return String(dom.patternError?.textContent || 'Invalid custom pattern');
      }
    },
    playbackState: {
      getIsPlaying,
      getIsPaused,
      getIsIntro,
      getCurrentBeat,
      getCurrentChordIdx,
      getPaddedChordCount,
      getTempo
    },
    playbackRuntime: {
      getAudioContext,
      getCurrentKey
    },
    transportActions: {
      startPlayback,
      stopPlayback,
      togglePausePlayback
    }
  };
}


