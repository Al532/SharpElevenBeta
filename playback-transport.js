import {
  DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE,
  STOP_SUGGESTION_MESSAGES
} from './display-placeholder-messages.js';

export function createPlaybackTransport({ dom, state, constants, helpers }) {
  const { NOTE_FADEOUT, SCHEDULE_INTERVAL } = constants;
  const {
    applyDisplaySideLayout,
    clearBeatDots,
    clearScheduledDisplays,
    ensureMediumSwingWalkingBassGenerator,
    ensureNearTermSamplePreload,
    ensureSessionStarted,
    fitHarmonyDisplay,
    getPlaybackAnalyticsProps,
    getProgressionAnalyticsProps,
    hideNextCol,
    initAudio,
    preloadStartupSamples,
    prepareNextProgression,
    registerSessionAction,
    scheduleBeat,
    setDisplayPlaceholderMessage,
    setDisplayPlaceholderVisible,
    stopActiveComping,
    stopScheduledAudio,
    trackEvent,
    trackProgressionEvent
  } = helpers;

  async function start() {
    ensureSessionStarted('play_start');
    initAudio();
    if (state.audioCtx.state === 'suspended') await state.audioCtx.resume();
    if (dom.customMediumSwingBass?.checked) {
      await ensureMediumSwingWalkingBassGenerator();
    }

    state.isPlaying = true;
    state.isPaused = false;
    setDisplayPlaceholderVisible(false);
    setDisplayPlaceholderMessage(DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE);
    dom.startStop.textContent = 'Stop';
    dom.startStop.classList.add('running');
    dom.pause.classList.remove('hidden', 'paused');
    dom.pause.textContent = 'Pause';

    state.isIntro = true;
    state.currentBeat = 0;
    state.currentChordIdx = 0;
    state.currentDisplaySide = 'left';
    state.keyPool = [];
    state.nextKeyValue = null;
    state.currentKeyRepetition = 0;
    state.loopVoicingTemplate = null;
    state.nearTermSamplePreloadPromise = null;
    prepareNextProgression();
    applyDisplaySideLayout();
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.textContent = '';
    hideNextCol();
    state.startupSamplePreloadInProgress = true;
    try {
      await preloadStartupSamples();
    } finally {
      state.startupSamplePreloadInProgress = false;
    }
    ensureNearTermSamplePreload();
    if (!state.firstPlayStartTracked) {
      state.firstPlayStartTracked = true;
      const progressionProps = getProgressionAnalyticsProps();
      trackEvent('first_play_start', {
        progression_source: progressionProps.progression_source,
        progression_kind: progressionProps.progression_kind
      });
      registerSessionAction('first_play_start');
    }
    trackProgressionEvent('play_start', getPlaybackAnalyticsProps());

    state.nextBeatTime = state.audioCtx.currentTime + 0.3;
    state.schedulerTimer = setInterval(scheduleBeat, SCHEDULE_INTERVAL);
  }

  function stop() {
    const shouldShowStopSuggestion = state.firstPlayStartTracked;

    trackProgressionEvent('play_stop', getPlaybackAnalyticsProps());
    state.isPlaying = false;
    state.isPaused = false;
    setDisplayPlaceholderVisible(true);
    dom.startStop.textContent = 'Start';
    dom.startStop.classList.remove('running');
    dom.pause.classList.add('hidden');
    dom.pause.classList.remove('paused');
    if (state.schedulerTimer) {
      clearInterval(state.schedulerTimer);
      state.schedulerTimer = null;
    }
    clearScheduledDisplays();
    stopScheduledAudio();
    if (state.activeNoteGain) {
      state.activeNoteGain.gain.linearRampToValueAtTime(0, state.audioCtx.currentTime + NOTE_FADEOUT);
      state.activeNoteGain = null;
    }
    stopActiveComping(state.audioCtx.currentTime, NOTE_FADEOUT);
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.textContent = '';
    hideNextCol();
    fitHarmonyDisplay();
    clearBeatDots();

    if (shouldShowStopSuggestion) {
      const suggestionIndex = state.playStopSuggestionCount % STOP_SUGGESTION_MESSAGES.length;
      setDisplayPlaceholderMessage(STOP_SUGGESTION_MESSAGES[suggestionIndex]);
      state.playStopSuggestionCount += 1;
    }
  }

  function togglePause() {
    if (!state.isPlaying) return;
    if (state.isPaused) {
      state.isPaused = false;
      dom.pause.textContent = 'Pause';
      dom.pause.classList.remove('paused');
      state.audioCtx.resume();
      trackProgressionEvent('play_resume', getPlaybackAnalyticsProps());
      state.nextBeatTime = state.audioCtx.currentTime + 0.05;
      state.schedulerTimer = setInterval(scheduleBeat, SCHEDULE_INTERVAL);
      return;
    }

    state.isPaused = true;
    dom.pause.textContent = 'Resume';
    dom.pause.classList.add('paused');
    if (state.schedulerTimer) {
      clearInterval(state.schedulerTimer);
      state.schedulerTimer = null;
    }
    clearScheduledDisplays();
    stopScheduledAudio();
    state.activeNoteGain = null;
    stopActiveComping(state.audioCtx.currentTime, NOTE_FADEOUT);
    state.audioCtx.suspend();
    trackProgressionEvent('play_pause', getPlaybackAnalyticsProps());
  }

  return {
    start,
    stop,
    togglePause
  };
}
