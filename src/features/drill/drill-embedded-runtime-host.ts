
type DrillEmbeddedRuntimeHostDom = {
  patternName?: { value: string };
  customPattern?: { value: string };
  patternSelect?: { value?: string | null };
  patternError?: { textContent?: string | null };
} & Record<string, unknown>;

type DrillEmbeddedRuntimeHostPatternUiBindings = {
  setCustomPatternSelection: () => void;
  setPatternName: (value: string) => void;
  setCustomPatternValue: (value: string) => void;
  setEditorPatternMode: (value: string) => void;
  syncPatternSelectionFromInput: () => void;
  setLastPatternSelectValue: () => void;
  getPatternErrorText: () => string;
};

type DrillEmbeddedRuntimeHostPlaybackStateBindings = {
  getIsPlaying: () => boolean;
  getIsPaused: () => boolean;
  getIsIntro: () => boolean;
  getCurrentBeat: () => number;
  getCurrentChordIdx: () => number;
  getPaddedChordCount: () => number;
  getTempo: () => number;
};

type DrillEmbeddedRuntimeHostPlaybackRuntimeBindings = {
  getAudioContext: () => AudioContext | null;
  getCurrentKey: () => number;
};

type DrillEmbeddedRuntimeHostTransportBindings = {
  startPlayback: () => Promise<void>;
  stopPlayback: () => void;
  togglePausePlayback: () => void;
};

type DrillEmbeddedRuntimeHostBindingsOptions = {
  dom?: DrillEmbeddedRuntimeHostDom;
  customPatternOptionValue?: string;
  setSuppressPatternSelectChange?: (value: boolean) => void;
  setPatternSelectValue?: (value: string) => void;
  setEditorPatternMode?: (value: string) => void;
  syncPatternSelectionFromInput?: () => void;
  getLastPatternSelectValue?: () => string;
  setLastPatternSelectValue?: (value: string) => void;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getTempo?: () => number;
  getAudioContext?: () => AudioContext | null;
  getCurrentKey?: () => number;
  startPlayback?: () => Promise<void>;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

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
 *   patternUi: DrillEmbeddedRuntimeHostPatternUiBindings,
 *   playbackState: DrillEmbeddedRuntimeHostPlaybackStateBindings,
 *   playbackRuntime: DrillEmbeddedRuntimeHostPlaybackRuntimeBindings,
 *   transportActions: DrillEmbeddedRuntimeHostTransportBindings
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
}: DrillEmbeddedRuntimeHostBindingsOptions = {}) {
  return {
    patternUi: {
      setCustomPatternSelection() {
        setSuppressPatternSelectChange(true);
        setPatternSelectValue(customPatternOptionValue);
      },
      setPatternName(value: string) {
        if (dom.patternName) {
          dom.patternName.value = value;
        }
      },
      setCustomPatternValue(value: string) {
        if (dom.customPattern) {
          dom.customPattern.value = value;
        }
      },
      setEditorPatternMode(value: string) {
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


